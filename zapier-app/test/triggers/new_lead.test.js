const zapier = require('zapier-platform-core');
const App = require('../../index');

const appTester = zapier.createAppTester(App);

describe('New Lead Trigger', () => {
  zapier.tools.env.inject();

  it('should get new leads', async () => {
    const bundle = {
      authData: {
        server_url: process.env.TEST_SERVER_URL || 'https://test-server.com',
        api_key: process.env.TEST_API_KEY || 'test-key',
      },
    };

    const results = await appTester(App.triggers['new_lead'].operation.perform, bundle);
    expect(results).toBeDefined();
    expect(Array.isArray(results)).toBe(true);
  });

  it('should have the correct output fields', () => {
    const trigger = App.triggers['new_lead'];
    const outputFields = trigger.operation.outputFields;
    
    expect(outputFields).toContainEqual(
      expect.objectContaining({ key: 'id', label: 'Lead ID' })
    );
    expect(outputFields).toContainEqual(
      expect.objectContaining({ key: 'name', label: 'Customer Name' })
    );
    expect(outputFields).toContainEqual(
      expect.objectContaining({ key: 'email', label: 'Customer Email' })
    );
  });
});