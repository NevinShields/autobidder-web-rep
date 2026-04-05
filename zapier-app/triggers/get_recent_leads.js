const performList = async (z, bundle) => {
  const response = await z.request({
    url: `${bundle.authData.server_url}/api/zapier/options/leads`,
    headers: {
      Authorization: `Bearer ${bundle.authData.api_key}`,
    },
  });

  return response.data;
};

module.exports = {
  key: 'get_recent_leads',
  noun: 'Lead',
  display: {
    label: 'Get Recent Leads',
    description: 'Gets recent leads for selecting automation targets.',
    hidden: true,
  },
  operation: {
    perform: performList,
    sample: {
      id: 1,
      name: 'John Doe (john@example.com)',
    },
    outputFields: [
      { key: 'id', label: 'Lead ID', type: 'integer' },
      { key: 'name', label: 'Lead Name', type: 'string' },
    ],
  },
};
