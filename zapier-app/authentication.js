const testAuth = async (z, bundle) => {
  // Validate server URL format
  const serverUrl = bundle.authData.server_url;
  if (!serverUrl) {
    throw new Error('Server URL is required');
  }
  
  // Validate URL format and protocol
  try {
    const url = new URL(serverUrl);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      throw new Error('Server URL must use http:// or https:// protocol');
    }
  } catch (error) {
    throw new Error('Invalid server URL format. Please enter a valid URL (e.g., https://your-app.replit.app)');
  }

  // Test the API key by making a request to the auth endpoint
  const response = await z.request({
    url: `${serverUrl}/api/zapier/auth/test`,
    headers: {
      Authorization: `Bearer ${bundle.authData.api_key}`,
    },
  });

  if (response.status !== 200) {
    throw new Error('Invalid API key or server URL. Please check your credentials and try again.');
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
      helpText: 'The URL of your Autobidder instance. Find this in your Autobidder dashboard under Settings > Zapier Integration. Must include https:// (e.g., https://your-app.replit.app)',
      placeholder: 'https://your-app.replit.app',
      helpLink: 'https://help.autobidder.com/zapier-setup#server-url',
      altersDynamicFields: false,
    },
    {
      computed: false,
      key: 'api_key',
      required: true,
      label: 'API Key',
      type: 'password',
      helpText: 'Your Autobidder API key. Generate this in your Autobidder dashboard under Settings > Zapier Integration. Keep this secure and do not share it.',
      helpLink: 'https://help.autobidder.com/zapier-setup#api-key',
      altersDynamicFields: false,
    },
  ],
  test: testAuth,
  connectionLabel: '{{user.username}} - {{user.businessName}}',
};