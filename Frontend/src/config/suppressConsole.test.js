describe('suppressConsole', () => {
  const orig = { log: console.log, info: console.info, debug: console.debug };

  afterEach(() => {
    console.log = orig.log;
    console.info = orig.info;
    console.debug = orig.debug;
    vi.resetModules();
  });

  it('no-ops console.log in production', async () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    console.log = orig.log;
    vi.resetModules();
    await import('./suppressConsole');
    expect(console.log).not.toBe(orig.log);
    process.env.NODE_ENV = prev;
  });

  it('leaves console.log intact outside production', async () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    console.log = orig.log;
    vi.resetModules();
    await import('./suppressConsole');
    expect(console.log).toBe(orig.log);
    process.env.NODE_ENV = prev;
  });
});
