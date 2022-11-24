import csv from 'async-csv'
import Ajv from 'ajv'

const validateRow = (row) => {
    const errors = [];

    // validate that employeeId is not duplicated

    if (!row.first_name) {
        errors.push("Firstname cannot be empty")
    }
    if (!row.email) {
        errors.push("Email cannot be empty")
    }

    // validate firstname, lastName, middlename(optional) is non empty [ can only contain ' ', alphabets, atleast 3 chars]
    // validate dob is in dd/mm/yyyy && is in the past
    // validate gender is in enum [Male, Female, Other] non null
    //
    return errors;
}

const updateRow = async (app, orgId, row) => {

    const query = `INSERT INTO
                    members ("organization_id", "employee_id", "first_name", "middle_name", "last_name", "email", "date_of_birth", "gender")
                    VALUES($1, $2, $3, $4, $5, $6, $7, $8)`
    const { rowCount } = await app.pg.query(query, [
        orgId,
        row.employee_id, row.first_name, row.middle_name,
        row.last_name, row.email, row.date_of_birth, row.gender
    ])
    //todo: insert error?
    // constraint violation?
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

            if (!request.body.file) throw Error("Invalid file");
            if (request.body.file.length != 1) throw Error("Upload only 1 file");
            if (request.body.file[0].mimetype != 'text/csv') throw Error("Invalid mimetype")

            const rows = await csv.parse(request.body.file[0].data, {
                from: 2,
                columns: ['employee_id', 'first_name', 'middle_name', 'last_name', 'email', 'date_of_birth', 'gender']
            })

            const errorsList = []
            const validEntries = []

            for (let [rowIndex, row] of rows.entries()) {
                const errors = validateRow(row);
                if (errors.length > 0) errorsList.push({ rowIndex, errors });
                else validEntries.push(row);
            }

            const updatePromises = validEntries.map(row => updateRow(app, request.params.orgId, row))
            await Promise.all(updatePromises)

            reply.code(201).send({
                success: true,
                upsertCount: updatePromises.length,
                errors: errorsList
            });

        } catch (e) {
            reply.code(400).send({ success: false, message: e.message })
        }
    });
}

