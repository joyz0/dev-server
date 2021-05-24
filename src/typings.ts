import * as https from 'https';
import Koa, { DefaultState, DefaultContext } from 'koa';
import { RequestListener, Server as HttpServer } from 'http';

type ProxyOptions = {};

export interface RCSConfig {
  /**
   * Project root directory. Can be an absolute path, or a path relative from
   * the location of the config file itself.
   * @default process.cwd()
   */
  root?: string;
  /**
   * Base public path when served in development or production.
   * @default '/'
   */
  base?: string;
  /**
   * Server specific options, e.g. host, port, https...
   */
  server: ServerOptions;
}

export interface RCSServer {
  config: RCSConfig;
  httpServer: HttpServer;
  listen(port?: number, isRestart?: boolean): any;
}

export interface ServerOptions {
  host?: string | boolean;
  port?: number;
  https?: boolean | https.ServerOptions;
  open?: boolean | string;
  proxy?: Record<string, string | ProxyOptions>;
}

export interface UserConfig {
  server?: ServerOptions;
}

export interface RCSState extends DefaultState {}

export interface ServerMiddlewareContext {
  app: Koa<RCSState, RCSContext>;
  config: RCSConfig;
}

export type RCSContext = DefaultContext & ServerMiddlewareContext;

export type ServerMiddleware = (ctx: ServerMiddlewareContext) => void;
