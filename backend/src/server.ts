import Fastify from 'fastify'
import {ZodTypeProvider, serializerCompiler, validatorCompiler} from '@fastify/type-provider-zod'
import { z } from 'zod'
import { getMVP } from './github';

export const server = Fastify().withTypeProvider<ZodTypeProvider>()
                        .setValidatorCompiler(validatorCompiler)
                        .setSerializerCompiler(serializerCompiler);
    
server.get('/health', (_, reply) => {
    reply.code(200)
    reply.send({response: 'server is healthy!'})
})

server.get('/mvp', async (request, reply) =>  {
    try {
        const mvp = await getMVP();
        if (mvp == null) {
            reply.code(404)
                .send({response: 'Cannot find MVP.md in remote repository'})
        }
        return {mvp}
    } catch (err) {
        request.log.error(err)
        return reply.code(502).send({error: "Couldn't reach Github"})
    }
})

server.listen({port: 3000, host: "0.0.0.0"}, (err, address) => {
  if (err) {
    server.log.error(err)
    process.exit(1)
  }
});