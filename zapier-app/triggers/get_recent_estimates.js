const performList = async (z, bundle) => {
  const response = await z.request({
    url: `${bundle.authData.server_url}/api/zapier/options/estimates`,
    headers: {
      Authorization: `Bearer ${bundle.authData.api_key}`,
    },
  });

  return response.data;
};

module.exports = {
  key: 'get_recent_estimates',
  noun: 'Estimate',
  display: {
    label: 'Get Recent Estimates',
    description: 'Gets recent estimates for selecting automation targets.',
    hidden: true,
  },
  operation: {
    perform: performList,
    sample: {
      id: 1,
      name: 'EST-2024-001 - John Doe',
    },
    outputFields: [
      { key: 'id', label: 'Estimate ID', type: 'integer' },
      { key: 'name', label: 'Estimate Name', type: 'string' },
    ],
  },
};
