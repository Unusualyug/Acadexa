import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';

export const notFound = (req, _res, next) => next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));

export function errorHandler(err, _req, res, _next) {
  let status = err.status || 500;
  let message = err.message || 'Something went wrong.';
  let details = err.details;

  if (err.name === 'ValidationError') {
    status = 400;
    message = 'Please check the highlighted fields.';
    details = Object.values(err.errors).map((e) => ({ path: e.path, message: e.message }));
  } else if (err.code === 11000) {
    status = 409;
    message = `A record with that ${Object.keys(err.keyValue || { field: '' })[0]} already exists.`;
  } else if (err.name === 'CastError') {
    status = 400;
    message = 'Invalid identifier supplied.';
  } else if (err.code === 'LIMIT_FILE_SIZE') {
    status = 413;
    message = 'File is larger than the permitted size.';
  }

  if (status >= 500) console.error('[error]', err);

  res.status(status).json({
    message: status >= 500 && env.isProd ? 'Something went wrong on our side.' : message,
    details,
    ...(env.isProd ? {} : { stack: status >= 500 ? err.stack : undefined }),
  });
}
