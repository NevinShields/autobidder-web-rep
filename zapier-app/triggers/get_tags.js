// Dynamic dropdown trigger for lead tags
// This is used by other triggers to populate tag dropdown options

const performList = async (z, bundle) => {
  const response = await z.request({
    url: `${bundle.authData.server_url}/api/zapier/options/tags`,
    headers: {
      Authorization: `Bearer ${bundle.authData.api_key}`,
    },
  });

  return response.data;
};

module.exports = {
  key: 'get_tags',
  noun: 'Tag',
  display: {
    label: 'Get Tags',
    description: 'Gets available lead tags.',
    hidden: true, // Hide from trigger list - only used for dynamic dropdowns
  },
  operation: {
    perform: performList,
    sample: {
      id: 1,
      name: 'Hot Lead',
    },
    outputFields: [
      { key: 'id', label: 'Tag ID', type: 'integer' },
      { key: 'name', label: 'Tag Name', type: 'string' },
    ],
  },
};
