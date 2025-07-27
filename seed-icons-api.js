// Simple script to add sample icons through database insert
import { storage } from './server/storage.js';

const iconData = [
  { name: '1-Story House', filename: '1-story.png', category: 'construction', description: 'Single story residential building', isActive: true },
  { name: '2-Story House', filename: '2-story.png', category: 'construction', description: 'Two story residential building', isActive: true },
  { name: '3-Story House', filename: '3-story.png', category: 'construction', description: 'Three story residential building', isActive: true },
  { name: 'Car Detailing', filename: 'car-detailing.png', category: 'automotive', description: 'Professional car cleaning and detailing services', isActive: true },
  { name: 'Commercial Project', filename: 'commercial-project.png', category: 'construction', description: 'Large scale commercial construction projects', isActive: true },
  { name: 'Deck Construction', filename: 'deck.png', category: 'construction', description: 'Outdoor deck building and repair', isActive: true },
  { name: 'Epoxy Floor', filename: 'epoxy-floor.png', category: 'construction', description: 'Epoxy floor coating and installation', isActive: true },
  { name: 'Fence Installation', filename: 'fence.png', category: 'construction', description: 'Fence building and repair services', isActive: true },
  { name: 'Flat Roof', filename: 'flat.png', category: 'construction', description: 'Flat roof installation and maintenance', isActive: true },
  { name: 'Gutter Service', filename: 'gutter.png', category: 'cleaning', description: 'Gutter cleaning and maintenance', isActive: true },
  { name: 'Patio Work', filename: 'patio.png', category: 'construction', description: 'Patio construction and cleaning', isActive: true },
  { name: 'Pressure Washing', filename: 'pressure-washing.png', category: 'cleaning', description: 'High pressure cleaning services', isActive: true },
  { name: 'Railing Installation', filename: 'railing.png', category: 'construction', description: 'Railing installation and repair', isActive: true },
  { name: 'Roof Service', filename: 'roof.png', category: 'construction', description: 'Roofing installation and repair', isActive: true },
  { name: 'Shingle Roof', filename: 'shingle.png', category: 'construction', description: 'Shingle roofing services', isActive: true },
  { name: 'Walk-out Basement', filename: 'walk-out-basement.png', category: 'construction', description: 'Walk-out basement construction', isActive: true }
];

async function seedIcons() {
  try {
    console.log('Starting icon seeding...');
    
    for (const icon of iconData) {
      try {
        const createdIcon = await storage.createIcon(icon);
        console.log(`✓ Added icon: ${icon.name} (ID: ${createdIcon.id})`);
      } catch (error) {
        console.error(`✗ Failed to add icon ${icon.name}:`, error.message);
      }
    }
    
    console.log(`\n✓ Icon seeding completed. Added ${iconData.length} icons.`);
  } catch (error) {
    console.error('Error during icon seeding:', error);
  }
}

seedIcons();