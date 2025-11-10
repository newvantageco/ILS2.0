declare module 'prom-client' {
  export class Registry {
    metrics(): Promise<string>;
    contentType?: string;
  }

  export class Counter {
    constructor(config: any);
    inc(n?: number): void;
  }

  export function collectDefaultMetrics(opts?: any): void;

  const client: any;
  export default client;
}
