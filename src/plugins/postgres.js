import fastifyPostgers from '@fastify/postgres'

export default async function(fastify, _opts) {
    await fastify.register(fastifyPostgers, { connectionString: fastify.config.DB_URI })
    console.log("Postgres loaded")
}
