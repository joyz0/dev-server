import type { RCSConfig } from './typings';

export function resolveConfig() {
  const config: RCSConfig = {
    server: {
      host: 'localhost',
      port: 7001,
      https: true,
      open: true,
    },
  };
  return config;
}
