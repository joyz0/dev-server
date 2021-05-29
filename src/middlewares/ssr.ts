import type { ServerMiddleware } from '../typings';
import compress from 'koa-compress';
import mount from 'koa-mount';
import path from 'path';
import { PassThrough, Stream } from 'stream';
import type { RCSContext } from '../typings';

interface IServerRenderParams {
  path: string;
  htmlTemplate?: string;
  mountElementId?: string;
  context?: object;
  mode?: 'string' | 'stream';
  basename?: string;
  staticMarkup?: boolean;
  forceInitial?: boolean;
  removeWindowInitialProps?: boolean;
  getInitialPropsCtx?: object;
  manifest?: string;
  [k: string]: any;
}

interface IServerRenderResult<T = string | Stream> {
  rootContainer: T;
  html: T;
  error: Error;
}

interface IServerRender {
  (params: IServerRenderParams): Promise<IServerRenderResult>;
}

export const ssr: ServerMiddleware = ({ app, config }) => {
  const staticPath = path.resolve(__dirname, config.ssr.path);

  app.use(
    compress({
      threshold: 2048,
      gzip: {
        flush: require('zlib').constants.Z_SYNC_FLUSH,
      },
      deflate: {
        flush: require('zlib').constants.Z_SYNC_FLUSH,
      },
      br: false, // 禁用br解决https gzip不生效加载缓慢问题
    }),
  );

  let render: IServerRender;
  app.use(async (ctx, next) => {
    /**
     *  扩展global对象
     *
     *  这里是在服务端处理好cookie，
     *  会把所有cookie处理成{}形式
     *  赋值到global上面，方便客户端使用
     *
     *  同时获取浏览器的默认语言，处理好
     */
    // @ts-ignore
    global._cookies = parseCookie(ctx);
    // @ts-ignore
    global._navigatorLang = parseNavLang(ctx);

    const ext = path.extname(ctx.request.path);
    // 符合要求的路由才进行服务端渲染，否则走静态文件逻辑
    if (!ext) {
      if (!render) {
        render = require(path.join(staticPath, 'umi.server.js'));
      }

      const { html, error, rootContainer } = await render({
        basename: 'reactcases',
        path: ctx.request.url,
        mode: 'stream',
      });
      if (error) {
        console.log('----------------服务端报错-------------------', error);
        ctx.throw(500, error);
      } else {
        ctx.status = 200;
        ctx.type = 'text/html';
      }
      if (html instanceof Stream) {
        // 流渲染
        // ctx.type = 'application/octet-stream';
        ctx.body = html.on('error', ctx.onerror).pipe(new PassThrough());
      } else {
        ctx.body = html;
      }
    } else {
      await next();
    }
  });

  app.use(mount('/reactcases', require('koa-static')(staticPath)));
};

const parseCookie = (ctx: RCSContext) => {
  let cookies = ctx.get('cookie');
  if (!cookies) {
    return [];
  }
  cookies = cookies.split(';');
  const res: Record<string, string> = {};
  for (const item of cookies) {
    const kv = item.split('=');
    if (kv && kv.length > 0) {
      res[kv[0].trim()] = decodeURIComponent(kv[1]);
    }
  }
  return res;
};

const parseNavLang = (ctx: RCSContext) => {
  // 服务端无法获取navigator.language，所以只能通过Accept-Language来判断浏览器语言。
  let navigatorLang;
  const clientLang = ctx.get('Accept-Language');
  if (clientLang.startsWith('zh')) {
    navigatorLang = 'zh-CN';
  } else if (clientLang.startsWith('en')) {
    navigatorLang = 'en-US';
  }
  return navigatorLang;
};
