import Fastify from 'fastify'
import {ZodTypeProvider, serializerCompiler, validatorCompiler} from '@fastify/type-provider-zod'
import { z } from 'zod'
import { getMVP } from './github';
import { saveMvp } from './db';

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
            return reply.code(404)
                .send({response: 'Cannot find MVP.md in remote repository'})
        }
        const id = await saveMvp(mvp);
        return {mvp, id}
    } catch (err) {
        request.log.error(err)
        return reply.code(500).send({error: "Server error"})
    }
})

server.listen({port: 3000, host: "0.0.0.0"}, (err, address) => {
  if (err) {
    server.log.error(err)
    process.exit(1)
  }
});