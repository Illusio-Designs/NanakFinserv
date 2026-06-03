/**
 * asyncHandler — wraps an Express handler so any thrown error or rejected
 * promise is forwarded to next() (and thus the central error handler), instead
 * of producing an unhandled rejection / hung request.
 *
 * `wrapController` applies it to every function on a controller module, so a
 * route file can wrap all its handlers in one line.
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

function wrapController(controller) {
  const wrapped = {};
  for (const key of Object.keys(controller)) {
    wrapped[key] =
      typeof controller[key] === "function"
        ? asyncHandler(controller[key])
        : controller[key];
  }
  return wrapped;
}

module.exports = { asyncHandler, wrapController };
