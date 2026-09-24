// Wraps an async route handler so rejected promises are forwarded to
// Express's error middleware instead of needing a try/catch in every
// controller function (the old codebase repeated the same try/catch
// block in ~20 places).
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
