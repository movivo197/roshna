import type { NextConfig } from 'next';
import path from 'node:path';

const isDevelopment = process.env.NODE_ENV !== 'production';
const scriptSource = isDevelopment ? "'self' 'unsafe-inline' 'unsafe-eval'" : "'self' 'unsafe-inline'";
const connectSource = isDevelopment ? "'self' ws: wss: http: https:" : "'self' https://generativelanguage.googleapis.com";
const config: NextConfig = {
  output: 'standalone',
  outputFileTracingRoot: path.resolve(process.cwd()),
  poweredByHeader: false,
  async headers() {
    return [{source: '/:path*', headers: [
      {key: 'X-Content-Type-Options', value: 'nosniff'},
      {key: 'X-Frame-Options', value: 'DENY'},
      {key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin'},
      {key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()'},
      {key: 'Cross-Origin-Opener-Policy', value: 'same-origin'},
      {key: 'Cross-Origin-Resource-Policy', value: 'same-origin'},
      {key: 'Content-Security-Policy', value: `default-src 'self'; script-src ${scriptSource}; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src ${connectSource}; media-src 'self' blob:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'`}
    ]}, {source: '/sw.js', headers: [{key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate'}, {key:'Service-Worker-Allowed',value:'/'}]}, {source:'/offline-manifest.json',headers:[{key:'Cache-Control',value:'no-store'}]}];
  },
};
export default config;
