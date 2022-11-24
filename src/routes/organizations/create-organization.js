export default async function(app, _opts) {
    app.post('', {
        schema: {
            tags: ['Organizations'],
            summary: 'Create organization',
            description: 'To create a new organization',
            body: {
                type: 'object',
                required: ['name'],
                properties: {
                    name: { type: 'string' }
                }
            },
            response: {
                200: {
                    type: 'object',
                    description: 'Successfully created the organization',
                    properties: {
                        success: { type: 'boolean' },
                        organization: { $ref: 'organization#' }
                    }
                },
                '4xx': { $ref: "errorMessage#" }
            }
        },
    }, async (request, reply) => {
        try {
            const { rowCount, rows: insertedIds } = await app.pg.query('INSERT INTO organizations(name) VALUES ($1) RETURNING id', [request.body.name])
            if (rowCount !== 1) throw Error("Failed to insert")
            const { rows } = await app.pg.query('SELECT * FROM organizations where id=$1', [insertedIds[0].id])
            reply.code(201).send({ success: true, organization: rows[0] })
        } catch (e) {
            console.error(e);
            reply.code(400).send({ success: false, message: e.message })
        }
    });
}

