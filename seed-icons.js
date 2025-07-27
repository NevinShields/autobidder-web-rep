import { Client } from '@neondatabase/serverless';

const iconData = [
  { name: '1-Story House', filename: '1-story.png', category: 'construction', description: 'Single story residential building' },
  { name: '2-Story House', filename: '2-story.png', category: 'construction', description: 'Two story residential building' },
  { name: '3-Story House', filename: '3-story.png', category: 'construction', description: 'Three story residential building' },
  { name: 'Car Detailing', filename: 'car-detailing.png', category: 'automotive', description: 'Professional car cleaning and detailing services' },
  { name: 'Commercial Project', filename: 'commercial-project.png', category: 'construction', description: 'Large scale commercial construction projects' },
  { name: 'Deck Construction', filename: 'deck.png', category: 'construction', description: 'Outdoor deck building and repair' },
  { name: 'Epoxy Floor', filename: 'epoxy-floor.png', category: 'construction', description: 'Epoxy floor coating and installation' },
  { name: 'Fence Installation', filename: 'fence.png', category: 'construction', description: 'Fence building and repair services' },
  { name: 'Flat Roof', filename: 'flat.png', category: 'construction', description: 'Flat roof installation and maintenance' },
  { name: 'Gutter Service', filename: 'gutter.png', category: 'cleaning', description: 'Gutter cleaning and maintenance' },
  { name: 'Patio Work', filename: 'patio.png', category: 'construction', description: 'Patio construction and cleaning' },
  { name: 'Pressure Washing', filename: 'pressure-washing.png', category: 'cleaning', description: 'High pressure cleaning services' },
  { name: 'Railing Installation', filename: 'railing.png', category: 'construction', description: 'Railing installation and repair' },
  { name: 'Roof Service', filename: 'roof.png', category: 'construction', description: 'Roofing installation and repair' },
  { name: 'Shingle Roof', filename: 'shingle.png', category: 'construction', description: 'Shingle roofing services' },
  { name: 'Walk-out Basement', filename: 'walk-out-basement.png', category: 'construction', description: 'Walk-out basement construction' }
];

async function seedIcons() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    // Clear existing icons
    await client.query('DELETE FROM icons');
    console.log('Cleared existing icons');

    // Insert new icons
    for (const icon of iconData) {
      await client.query(
        'INSERT INTO icons (name, filename, category, description, is_active) VALUES ($1, $2, $3, $4, $5)',
        [icon.name, icon.filename, icon.category, icon.description, true]
      );
      console.log(`Added icon: ${icon.name}`);
    }

    console.log(`Successfully seeded ${iconData.length} icons`);
  } catch (error) {
    console.error('Error seeding icons:', error);
  } finally {
    await client.end();
  }
}

seedIcons();