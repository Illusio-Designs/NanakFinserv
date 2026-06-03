// In production builds, silence noisy console.log/info/debug (which would
// otherwise ship in the bundle and leak data). Warnings and errors are kept.
// Imported first in index.js so it runs before other modules evaluate.
if (process.env.NODE_ENV === 'production') {
  const noop = () => {};
  // eslint-disable-next-line no-console
  console.log = noop;
  // eslint-disable-next-line no-console
  console.info = noop;
  // eslint-disable-next-line no-console
  console.debug = noop;
}

export default null;
