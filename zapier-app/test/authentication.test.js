const zapier = require('zapier-platform-core');
const App = require('../index');

const appTester = zapier.createAppTester(App);

describe('Authentication', () => {
  zapier.tools.env.inject();

  it('should authenticate with valid credentials', async () => {
    const bundle = {
      authData: {
        server_url: process.env.TEST_SERVER_URL || 'https://test-server.com',
        api_key: process.env.TEST_API_KEY || 'test-key',
      },
    };

    const result = await appTester(App.authentication.test, bundle);
    expect(result).toBeDefined();
    expect(result.user).toBeDefined();
  });

  it('should fail with invalid API key', async () => {
    const bundle = {
      authData: {
        server_url: process.env.TEST_SERVER_URL || 'https://test-server.com',
        api_key: 'invalid-key',
      },
    };

    await expect(appTester(App.authentication.test, bundle)).rejects.toThrow();
  });
});