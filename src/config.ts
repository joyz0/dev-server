import type { RCSConfig } from './typings';

const { NODE_ENV } = process.env;
export function resolveConfig() {
  const config: RCSConfig = {
    base: '/',
    ssr: {
      path:
        NODE_ENV === 'production'
          ? '/usr/src/reactcases/ssr_html'
          : 'F:\\Codes\\justable\\dev-server\\dist\\front',
      basename: '',
    },
    server: {
      host: 'localhost',
      port: 7001,
      https: true,
      open: false,
    },
  };
  return config;
}
