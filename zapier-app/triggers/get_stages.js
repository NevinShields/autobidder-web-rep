// Dynamic dropdown trigger for CRM stages
// This is used by other triggers to populate stage dropdown options

const performList = async (z, bundle) => {
  const response = await z.request({
    url: `${bundle.authData.server_url}/api/zapier/options/stages`,
    headers: {
      Authorization: `Bearer ${bundle.authData.api_key}`,
    },
  });

  return response.data;
};

module.exports = {
  key: 'get_stages',
  noun: 'Stage',
  display: {
    label: 'Get Stages',
    description: 'Gets available CRM pipeline stages.',
    hidden: true, // Hide from trigger list - only used for dynamic dropdowns
  },
  operation: {
    perform: performList,
    sample: {
      id: 'booked',
      name: 'Booked',
    },
    outputFields: [
      { key: 'id', label: 'Stage ID', type: 'string' },
      { key: 'name', label: 'Stage Name', type: 'string' },
    ],
  },
};
