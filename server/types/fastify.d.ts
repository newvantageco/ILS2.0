import '@fastify/jwt';
import { FastifyRequest } from 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    jwtVerify(): Promise<void>;
    user: {
      id: string;
      organizationId: string;
      role: 'ecp' | 'lab_tech' | 'engineer' | 'supplier' | 'admin';
    };
  }
}