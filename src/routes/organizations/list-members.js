export default async function(app, _opts) {
    app.get('/:orgId/members', {
        schema: {
            tags: ['Organizations'],
            summary: 'Get member details',
            description: 'To show the list of members paginated',
            security: [{ apiKey: [] }],
            querystring: {
                page: { type: 'integer' },
                size: { type: 'integer' }
            },
            params: {
                orgId: { type: 'string' }
            },
            response: {
                200: {
                    type: 'object',
                    description: 'List of members of organization',
                    properties: {
                        success: { type: 'boolean' },
                        members: {
                            type: 'array',
                            items: { $ref: "member#" }
                        }
                    }
                },
                '4xx': { $ref: "errorMessage#" }
            }
        },
    }, async (request, reply) => {
        try {
            const { page, size } = request.query;
            const offset = page * size;
            const { rows } = await app.pg.query(`
                SELECT * FROM members WHERE "organization_id" = $1 OFFSET $2 LIMIT $3
            `, [request.params.orgId, offset, size])
            return reply.code(200).send(rows);
        } catch (e) {
            console.log(e)
            return reply.code(400).send({ success: false });
        }
    });
}

