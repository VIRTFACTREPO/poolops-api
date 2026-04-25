import { notImplemented } from '../utils/response.js';

export function stub(method, path) {
  return (req, res) => notImplemented(res, `${method.toUpperCase()} ${path}`);
}
