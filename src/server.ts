import Koa from 'koa';
import chalk from 'chalk';
import { resolveHttpServer, resolveHttpsConfig } from './http';
import { resolveConfig } from './config';
import { openBrowser } from './openBrowser';
import { ssr } from './middlewares/ssr';
import type {
  RCSServer,
  ServerMiddlewareContext,
  RCSState,
  RCSContext,
} from './typings';

const middlewares = [ssr];

export async function createServer(): Promise<RCSServer> {
  const config = resolveConfig();
  const serverConfig = config.server || {};
  const app = new Koa<RCSState, RCSContext>();
  const context = {
    app,
    config,
  };

  resolveMiddlewares(app, context);
  const httpsOptions = await resolveHttpsConfig(config);
  const httpServer = await resolveHttpServer(
    serverConfig,
    app.callback(),
    httpsOptions,
  );

  const server = {
    config,
    httpServer,
    listen(port?: number, isRestart?: boolean) {
      return startServer(server, port, isRestart);
    },
  };

  return server;
}

function resolveMiddlewares(
  app: Koa<RCSState, RCSContext>,
  context: ServerMiddlewareContext,
) {
  app.use((ctx, next) => {
    Object.assign(ctx, context);
    return next();
  });

  middlewares.forEach((m) => m && m(context));
  return app;
}

async function startServer(
  server: RCSServer,
  inlinePort?: number,
  isRestart: boolean = false,
): Promise<RCSServer> {
  const httpServer = server.httpServer;
  if (!httpServer) {
    throw new Error('Cannot call server.listen in middleware mode.');
  }

  const options = server.config.server || {};
  let port = inlinePort || options.port || 3000;
  let hostname: string | undefined;
  if (options.host === undefined || options.host === 'localhost') {
    // Use a secure default
    hostname = '127.0.0.1';
  } else if (options.host === true) {
    // probably passed --host in the CLI, without arguments
    hostname = undefined; // undefined typically means 0.0.0.0 or :: (listen on all IPs)
  } else {
    hostname = options.host as string;
  }

  const protocol = options.https ? 'https' : 'http';
  const info = chalk.green;
  const base = server.config.base;

  return new Promise((resolve, reject) => {
    const onError = (e: Error & { code?: string }) => {
      if (e.code === 'EADDRINUSE') {
        info(`Port ${port} is in use, trying another one...`);
        httpServer.listen(++port, hostname);
      } else {
        httpServer.removeListener('error', onError);
        reject(e);
      }
    };

    httpServer.on('error', onError);

    httpServer.listen(port, hostname, () => {
      httpServer.removeListener('error', onError);

      info(
        `\n  vite v${
          require('vite/package.json').version
        } dev server running at:\n`,
      );

      if (options.open && !isRestart) {
        const path = typeof options.open === 'string' ? options.open : base;
        openBrowser(`${protocol}://${hostname}:${port}${path}`);
      }

      resolve(server);
    });
  });
}
