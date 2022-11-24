export default async function(app, _opts) {
    app.get('', {
        schema: {
            tags: ['Organizations'],
            summary: 'Organization and basic employee details',
            description: 'To show the list of organisations and basic employee details paginated',
            security: [{ apiKey: [] }],
            querystring: {
                page: { type: 'integer', description: 'page ( default = 0 )' },
                size: { type: 'integer', description: 'number of items to return ( default = 5)' }
            },
            response: {
                200: {
                    type: 'object',
                    description: 'List of Organizations and their members',
                    properties: {
                        success: { type: 'boolean' },
                        organizations: {
                            type: 'array',
                            items: {
                                allOf: [{ $ref: "organization#" }],
                                properties: {
                                    members: {
                                        type: 'array',
                                        items: {
                                            type: 'object',
                                            properties: {
                                                'employee_id': { type: 'integer' },
                                                'first_name': { type: 'string' },
                                                'email': { type: 'string' }
                                            }
                                        }
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
            const page = Math.max(0, request.query.page ?? 0);
            const size = Math.max(1, request.query.size ?? 5);
            const offset = page * size;
            const { rows } = await app.pg.query(`
                SELECT
                    o.*,
                    array(
                        SELECT
                            json_build_object(
                                'employee_id', m."employee_id",
                                'first_name', m."first_name",
                                'email', m."email"
                            )
                        FROM members m where m."organization_id" = o.id
                    ) as members
                FROM organizations o OFFSET $1 LIMIT $2
            `, [offset, size]);
            reply.code(200).send({ success: true, organizations: rows });
        } catch (e) {
            console.error(e);
            reply.code(400).send({ success: false, message: e.message });
        }
    });

}

