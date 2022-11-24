import Ajv from "ajv"
import addFormats from "ajv-formats"
import addErrors from 'ajv-errors'
const ajv = new Ajv({ allErrors: true })
import csv from 'async-csv'

addErrors(ajv)
addFormats(ajv, ['email'])

const csvSchema = {
    type: "array",
    items: {
        type: 'object',
        required: ['employee_id', 'first_name', 'last_name', 'email', 'date_of_birth', 'gender'],
        properties: {
            employee_id: {
                type: 'string',
                errorMessage: 'employee_id is required'
            },
            first_name: {
                type: 'string',
                minLength: 3,
                errorMessage: 'first_name is required and must atleast 3 characters'
            },
            middle_name: {
                type: 'string',
                minLength: 3,
                errorMessage: 'middle_name must atleast 3 characters'
            },
            last_name: {
                type: 'string',
                minLength: 3,
                errorMessage: 'last_name is required and must atleast 3 characters'
            },
            email: {
                type: 'string',
                format: 'email',
                errorMessage: 'email is required and should be valid'
            },
            date_of_birth: {
                type: 'string',
                pattern: "\\d{2}\/\\d{2}\/\\d{4}",
                errorMessage: 'date_of_birth is required and should be in dd-MM-yyyy format'
            },
            gender: {
                type: 'string',
                enum: ['male', 'female', 'other'],
                errorMessage: `gender is required and must be 'male, 'female', or 'other'`
            }
        }
    }
}

const validate = ajv.compile(csvSchema)

const updateRow = async (app, orgId, row) => {
    try {
        const query = `INSERT INTO
                        members ("organization_id", "employee_id", "first_name", "middle_name", "last_name", "email", "date_of_birth", "gender")
                        VALUES($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT ("organization_id", "employee_id") DO NOTHING`
        const { rowCount } = await app.pg.query(query, [
            orgId,
            row.employee_id, row.first_name, row.middle_name,
            row.last_name, row.email, row.date_of_birth, row.gender
        ])
        if (rowCount != 1) throw Error("Insert failed")
        return ''
    } catch (e) {
        console.error(e);
        return `row = ${row.csv_row} error = Failed to insert`
    }
}

export default async function(app, _opts) {
    app.post('/:orgId/members/upload', {
        schema: {
            tags: ['Organizations'],
            summary: 'Bulk update members with CSV',
            description: `
- To upload a CSV file containing employees of the organisation to perform bulk update/insert
- Invalid CSVs are rejected
- Invalid rows and errors are returned in response

### Example CSV

        Employee ID,First Name,Middle Name,Last Name,Email ID,Date of Birth,Gender
        1,Richard,,Hendricks,richard.h@gmail.com,01/09/1998,Male
            `,
            security: [{ apiKey: [] }],
            params: {
                orgId: { type: 'string' }
            },
            consumes: ['multipart/form-data'],
            body: {
                type: 'object',
                required: ['file'],
                properties: { file: { isFileType: true } }
            },
            response: {
                200: {
                    type: 'object',
                    description: 'Success response',
                    properties: {
                        success: { type: 'boolean', description: 'always `true` indicating success' },
                        upsertCount: { type: 'integer', description: 'Count of items updated/inserted' },
                        errors: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    rowIndex: { type: 'integer', description: 'Row in which error happened' },
                                    errors: {
                                        type: 'array',
                                        description: 'List of errors in the row',
                                        items: { type: 'string' }
                                    }
                                }

                            }
                        }
                    }
                },
                '4xx': { $ref: "errorMessage#" }
            }
        },
    }, async (request, reply) => {

        try {
            await app.pg.query('BEGIN');

            const query = `select exists(select 1 from organizations where id=$1)`
            const { rows: orgResult } = await app.pg.query(query, [request.params.orgId])

            if (!orgResult[0].exists) throw Error("Invalid organization id");
            if (!request.body.file) throw Error("Invalid file");
            if (request.body.file.length != 1) throw Error("Upload only 1 file");
            if (request.body.file[0].mimetype != 'text/csv') throw Error("Invalid mimetype")

            const rows = await csv.parse(request.body.file[0].data, {
                from: 2,
                columns: ['employee_id', 'first_name', 'middle_name', 'last_name', 'email', 'date_of_birth', 'gender']
            })

            for (let [index, row] of rows.entries()) {
                row['csv_row'] = index;
                // hack: to remove middle_name='' entry from the object for easier validation
                if (!row['middle_name']) delete row['middle_name']
            }


            validate(rows)
            const ajvErrorList = validate.errors ?? []
            const indexRegexp = new RegExp(/^\/(\d+)\//) // to extract index out of instancePath

            const errorIndices = new Set();
            const errorsList = ajvErrorList.map(error => {
                const matches = indexRegexp.exec(error.instancePath)
                const index = matches[1];
                errorIndices.add(parseInt(index));
                return `row = ${index} error = ${error.message}`
            })

            const updatePromises = rows.filter((_, index) => !errorIndices.has(index))
                .map(row => updateRow(app, request.params.orgId, row))

            // get errors during insert, and add the non empty ones
            const responses = await Promise.all(updatePromises)
            errorsList.push(...responses.filter(r => !!r))

            await app.pg.query('COMMIT')
            reply.code(201).send({
                success: true,
                upsertCount: updatePromises.length,
                errors: errorsList
            });

        } catch (e) {
            await app.pg.query('ROLLBACK')
            reply.code(400).send({ success: false, message: e.message })
        }
    });
}

