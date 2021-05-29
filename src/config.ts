import type { RCSConfig } from './typings';

export function resolveConfig() {
  const config: RCSConfig = {
    base: '/',
    server: {
      host: 'localhost',
      port: 7001,
      https: false,
      open: false,
    },
  };
  return config;
}
