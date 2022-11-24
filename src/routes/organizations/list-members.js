export default async function(app, _opts) {
    app.get('/:orgId/members', {
        schema: {
            tags: ['Organizations'],
            summary: 'Get member details',
            description: 'To show the list of members paginated',
            security: [{ apiKey: [] }],
            querystring: {
                page: { type: 'integer', description: 'page ( default = 0 )' },
                size: { type: 'integer', description: 'number of items to return ( default = 5)' }
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
            const query = `select exists(select 1 from organizations where id=$1)`
            const { rows: orgResult } = await app.pg.query(query, [request.params.orgId])
            if (!orgResult[0].exists) throw Error("Invalid organization id");

            const page = Math.max(0, request.query.page ?? 0);
            const size = Math.max(1, request.query.size ?? 5);
            const offset = page * size;
            const { rows } = await app.pg.query(`
                SELECT m.*, to_char(m.date_of_birth, 'DD/MM/YYYY') as date_of_birth
                    FROM members m
                    WHERE "organization_id" = $1
                    ORDER BY m.id OFFSET $2 LIMIT $3
            `, [request.params.orgId, offset, size])
            return reply.code(200).send({success: true, members: rows});
        } catch (e) {
            console.log(e)
            return reply.code(400).send({ success: false, message: e.message });
        }
    });
}

