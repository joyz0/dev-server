import path from 'path';
import fs from 'fs-extra';
import { RequestListener, Server as HttpServer } from 'http';
import { ServerOptions as HttpsServerOptions } from 'https';
import type { RCSConfig, ServerOptions } from './typings';

export async function resolveHttpServer(
  { proxy }: ServerOptions,
  requestListener: RequestListener,
  httpsOptions?: HttpsServerOptions,
): Promise<HttpServer> {
  if (!httpsOptions) {
    return require('http').createServer(requestListener);
  }

  if (proxy) {
    return require('https').createServer(httpsOptions, requestListener);
  } else {
    return require('http2').createSecureServer(
      {
        ...httpsOptions,
        allowHTTP1: true,
      },
      requestListener,
    );
  }
}

export async function resolveHttpsConfig(
  config: RCSConfig,
): Promise<HttpsServerOptions | undefined> {
  if (!config.server.https) return undefined;

  const httpsOption =
    typeof config.server.https === 'object' ? config.server.https : {};

  const { ca, cert, key, pfx } = httpsOption;
  Object.assign(httpsOption, {
    ca: readFileIfExists(ca),
    cert: readFileIfExists(cert),
    key: readFileIfExists(key),
    pfx: readFileIfExists(pfx),
  });
  if (!httpsOption.key || !httpsOption.cert) {
    httpsOption.cert = httpsOption.key = await createCertificate();
  }
  return httpsOption;
}

function readFileIfExists(value?: string | Buffer | any[]) {
  if (typeof value === 'string') {
    try {
      return fs.readFileSync(path.resolve(value as string));
    } catch (e) {
      return value;
    }
  }
  return value;
}

/**
 * https://github.com/webpack/webpack-dev-server/blob/master/lib/utils/createCertificate.js
 *
 * Copyright JS Foundation and other contributors
 * This source code is licensed under the MIT license found in the
 * LICENSE file at
 * https://github.com/webpack/webpack-dev-server/blob/master/LICENSE
 */
async function createCertificate() {
  // @ts-ignore
  const { generate } = await import('selfsigned');
  const pems = generate(null, {
    algorithm: 'sha256',
    days: 30,
    keySize: 2048,
    extensions: [
      // {
      //   name: 'basicConstraints',
      //   cA: true,
      // },
      {
        name: 'keyUsage',
        keyCertSign: true,
        digitalSignature: true,
        nonRepudiation: true,
        keyEncipherment: true,
        dataEncipherment: true,
      },
      {
        name: 'extKeyUsage',
        serverAuth: true,
        clientAuth: true,
        codeSigning: true,
        timeStamping: true,
      },
      {
        name: 'subjectAltName',
        altNames: [
          {
            // type 2 is DNS
            type: 2,
            value: 'localhost',
          },
          {
            type: 2,
            value: 'localhost.localdomain',
          },
          {
            type: 2,
            value: 'lvh.me',
          },
          {
            type: 2,
            value: '*.lvh.me',
          },
          {
            type: 2,
            value: '[::1]',
          },
          {
            // type 7 is IP
            type: 7,
            ip: '127.0.0.1',
          },
          {
            type: 7,
            ip: 'fe80::1',
          },
        ],
      },
    ],
  });
  return pems.private + pems.cert;
}
