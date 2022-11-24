import Fastify from 'fastify'
import autoLoad from '@fastify/autoload'
import multipart from '@fastify/multipart'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

function ajvPlugin(ajv, options) {
    ajv.addKeyword('isFileType', {
        compile: (schema, parent, it) => {
            // Change the schema type, as this is post validation it doesn't appear to error.
            parent.type = 'file'
            delete parent.isFileType
            return () => true
        },
    })

    return ajv
}

try {
    const fastify = Fastify({ logger: true, ajv: { plugins: [ajvPlugin] } })
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = dirname(__filename)


    fastify.addSchema({
        $id: 'organization',
        type: 'object',
        required: ['id', 'name'],
        properties: {
            id: { type: 'integer' },
            name: { type: 'string' }
        }
    })

    fastify.addSchema({
        $id: 'member',
        type: 'object',
        required: ['id', 'employee_id', 'first_name', 'middle_name', 'last_name', 'email', 'date_of_birth', 'gender'],
        properties: {
            id: { type: 'integer' },
            employee_id: { type: 'integer' },
            first_name: { type: 'string' },
            middle_name: { type: 'string' },
            last_name: { type: 'string' },
            email: { type: 'string' },
            date_of_birth: { type: 'string' },
            gender: { type: 'string', enum: ["male", "female", "other"] },
        }
    })

    fastify.addSchema({
        $id: 'errorMessage',
        type: 'object',
        description: 'Error response body',
        required: ['success', 'message'],
        properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
        }
    })

    await fastify.register(multipart, { addToBody: true })
    await fastify.register(autoLoad, { dir: join(__dirname, 'plugins'), encapsulate: false, forceESM: true })
    await fastify.register(autoLoad, { dir: join(__dirname, 'routes'), options: { prefix: '/api' } })
    await fastify.listen({ port: fastify.config.PORT })
} catch (err) {
    console.error(err)
    process.exit(1)
}

