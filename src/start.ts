import { createServer } from './server';

async function start() {
  const server = await createServer();
  server.listen(7001);
}

start();
