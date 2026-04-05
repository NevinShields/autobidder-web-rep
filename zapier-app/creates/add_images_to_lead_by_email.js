const perform = async (z, bundle) => {
  const response = await z.request({
    url: `${bundle.authData.server_url}/api/zapier/actions/add-images-to-lead-by-email`,
    method: 'POST',
    headers: {
      Authorization: `Bearer ${bundle.authData.api_key}`,
      'Content-Type': 'application/json',
    },
    body: {
      email: bundle.inputData.email,
      imageUrls: bundle.inputData.imageUrls,
    },
  });

  return response.data;
};

module.exports = {
  key: 'add_images_to_lead_by_email',
  noun: 'Lead',
  display: {
    label: 'Add Images to Lead by Email',
    description: 'Finds an existing lead by email and appends image URLs to that lead in Autobidder.',
  },
  operation: {
    perform,
    inputFields: [
      {
        key: 'email',
        label: 'Lead Email',
        type: 'string',
        required: true,
        helpText: 'Email address used to find the existing lead inside this Autobidder account.',
      },
      {
        key: 'imageUrls',
        label: 'Image URLs',
        type: 'text',
        required: true,
        helpText: 'Use a JSON array, comma-separated list, or one image URL per line.',
      },
    ],
    sample: {
      id: "1",
      name: "John Doe",
      email: "john@example.com",
      uploadedImages: [
        "https://cdn.example.com/lead-1-photo.jpg",
        "https://cdn.example.com/lead-1-photo-2.jpg"
      ],
      addedImageCount: 2,
    },
    outputFields: [
      { key: 'id', label: 'Lead ID', type: 'string' },
      { key: 'name', label: 'Customer Name', type: 'string' },
      { key: 'email', label: 'Customer Email', type: 'string' },
      { key: 'uploadedImages[]', label: 'Uploaded Image URL', type: 'string' },
      { key: 'addedImageCount', label: 'Added Image Count', type: 'integer' },
    ],
  },
};
