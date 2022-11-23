import fastifyEnv from '@fastify/env'

export default async function (fastify, _opts) {
  await fastify.register(fastifyEnv, {
    confKey: 'config',
    schema: {
      type: 'object',
      required: [ 'PORT' ],
      properties: {
        PORT: {
          type: 'string',
          default: 3000
        },
        DB_URI: {
          type: 'string',
          default: 'postgres://fzzocats:jaMiapCNssB6ixdhiiD8lX2u2zFVeV5A@arjuna.db.elephantsql.com/fzzocats'
        }
      }
    },
  })
  console.log("Environment loaded")
}
