import json from '@rollup/plugin-json';
import dts from 'rollup-plugin-dts';
import esbuild from 'rollup-plugin-esbuild';

import pkg from './package.json' assert { type: 'json' };

const external = [
  ...Object.keys(pkg.peerDependencies),
  '@cdktf/provider-aws/lib/s3-bucket',
  '@cdktf/provider-aws/lib/s3-bucket-acl',
  '@cdktf/provider-aws/lib/s3-bucket-logging',
  '@cdktf/provider-aws/lib/s3-bucket-public-access-block',
  '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration',
  '@cdktf/provider-aws/lib/s3-bucket-versioning'
];

export default [
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/index.cjs',
        format: 'cjs',
        sourcemap: true
      },
      {
        file: 'dist/index.mjs',
        format: 'esm',
        sourcemap: true
      }
    ],
    plugins: [
      json(),
      esbuild({
        include: /\.ts$/,
        sourceMap: true,
        minify: true,
        target: 'esnext',
        tsconfig: 'tsconfig.build.json'
      })
    ],
    external
  },
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.d.ts',
      format: 'es',
      sourcemap: false
    },
    external,
    plugins: [dts()]
  }
];
