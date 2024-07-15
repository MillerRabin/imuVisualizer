import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const port = process.env['PORT'] ?? 9001;
export const staticPath = path.resolve(__dirname, '..', 'static');

export const settings = {
  root: path.resolve(__dirname, '..', 'static'),
  watch: [path.resolve(__dirname, '..', 'static')],
  templates: path.resolve(__dirname, '..', 'templates')  
};

export const backendUrl = 'https://api.flowersin4hours.com/graphql';

export default {
  port,
  staticPath,
  settings,
  backendUrl,
};
