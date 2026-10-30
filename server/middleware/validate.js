import { ApiError } from '../utils/ApiError.js';

export const validate = (schemas) => (req, _res, next) => {
  try {
    for (const key of ['body', 'query', 'params']) {
      if (!schemas[key]) continue;
      const result = schemas[key].safeParse(req[key]);
      if (!result.success) {
        const details = result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
        throw ApiError.badRequest('Please check the highlighted fields.', details);
      }
      req[key] = result.data;
    }
    next();
  } catch (err) {
    next(err);
  }
};
