import type { RCSConfig } from './typings';

export function resolveConfig() {
  const config: RCSConfig = {
    base: '/',
    ssr: {
      path: '/usr/src/reactcases/ssr_html',
    },
    server: {
      host: 'localhost',
      port: 7001,
      https: false,
      open: false,
    },
  };
  return config;
}
