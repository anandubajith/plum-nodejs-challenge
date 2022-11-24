import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUi from '@fastify/swagger-ui'

export default async function (fastify, opts) {
  await fastify.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'Plum - Organization API',
        description: 'Backend to handle organizations',
        version: '0.1.1'
      },
    },
    hideUntagged: true,
    exposeRoute: true
  })
  console.log("Swagger loaded")

  await fastify.register(fastifySwaggerUi, {
    routePrefix: '/documentation',
    uiConfig: {
      deepLinking: false
    },
    staticCSP: true,
    transformStaticCSP: (header) => header
  })
  console.log("Swagger UI loaded")

}
