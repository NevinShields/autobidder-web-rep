const zapier = require('zapier-platform-core');
const App = require('../../index');

const appTester = zapier.createAppTester(App);

describe('Create Lead Action', () => {
  zapier.tools.env.inject();

  it('should create a lead', async () => {
    const bundle = {
      authData: {
        server_url: process.env.TEST_SERVER_URL || 'https://test-server.com',
        api_key: process.env.TEST_API_KEY || 'test-key',
      },
      inputData: {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '555-1234',
        address: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        zipCode: '12345',
        serviceType: 'Roof Cleaning',
        totalPrice: 500,
        notes: 'Customer requested eco-friendly cleaning',
        source: 'Zapier Test',
      },
    };

    const result = await appTester(App.creates['create_lead'].operation.perform, bundle);
    expect(result).toBeDefined();
    expect(result.name).toBe('John Doe');
    expect(result.email).toBe('john@example.com');
  });

  it('should require name and email', () => {
    const action = App.creates['create_lead'];
    const inputFields = action.operation.inputFields;
    
    const nameField = inputFields.find(field => field.key === 'name');
    const emailField = inputFields.find(field => field.key === 'email');
    
    expect(nameField.required).toBe(true);
    expect(emailField.required).toBe(true);
  });
});