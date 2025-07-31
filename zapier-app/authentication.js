const testAuth = async (z, bundle) => {
  // Test the API key by making a request to the auth endpoint
  const response = await z.request({
    url: `${bundle.authData.server_url}/api/zapier/auth/test`,
    headers: {
      Authorization: `Bearer ${bundle.authData.api_key}`,
    },
  });

  if (response.status !== 200) {
    throw new Error('Invalid API key or server URL');
  }

  return response.data;
};

module.exports = {
  type: 'custom',
  fields: [
    {
      computed: false,
      key: 'server_url',
      required: true,
      label: 'Server URL',
      type: 'string',
      helpText: 'The URL of your Autobidder instance (e.g., https://your-app.replit.app)',
      placeholder: 'https://your-app.replit.app',
    },
    {
      computed: false,
      key: 'api_key',
      required: true,
      label: 'API Key',
      type: 'password',
      helpText: 'Your Autobidder API key. You can generate this in your Autobidder dashboard under Settings > Zapier Integration.',
    },
  ],
  test: testAuth,
  connectionLabel: '{{user.username}} - {{user.businessName}}',
};