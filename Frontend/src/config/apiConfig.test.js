// jsdom sets window.location.hostname to 'localhost' by default.

describe('apiConfig', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
  });
  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('prefers REACT_APP_API_URL when set', () => {
    process.env.REACT_APP_API_URL = 'https://api.example.com/api';
    const config = require('./apiConfig').default;
    expect(config.API_URL).toBe('https://api.example.com/api');
  });

  it('falls back to localhost dev URL when no env + hostname is localhost', () => {
    delete process.env.REACT_APP_API_URL;
    const config = require('./apiConfig').default;
    expect(config.API_URL).toContain('localhost:5001');
  });
});
