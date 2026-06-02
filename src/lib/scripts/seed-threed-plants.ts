// src/lib/scripts/seed-threed-plants.ts
import { db } from '@/lib/db/client';
import { threedPlants } from '@/lib/auth/schema';
import { eq } from 'drizzle-orm';

const seedPlants = [
  {
    plantId: 'tomato-roma',
    commonName: 'Roma Tomato',
    scientificName: 'Solanum lycopersicum',
    variety: 'Roma',
    family: 'Solanaceae',
    type: 'Vegetable',
    growthHabit: 'Bush',
    daysToMaturity: 75,
    daysToGermination: 7,
    spacingInches: 24,
    rowSpacingInches: 36,
    plantingDepthInches: '0.5',
    sunlight: 'Full Sun',
    waterNeeds: 'Medium',
    description: 'Roma tomatoes are plum tomatoes perfect for sauces and canning.',
    careInstructions: 'Water regularly, stake for support, fertilize every 2 weeks.',
  },
  {
    plantId: 'basil-sweet',
    commonName: 'Sweet Basil',
    scientificName: 'Ocimum basilicum',
    variety: 'Genovese',
    family: 'Lamiaceae',
    type: 'Herb',
    growthHabit: 'Bush',
    daysToMaturity: 60,
    daysToGermination: 5,
    spacingInches: 12,
    rowSpacingInches: 18,
    plantingDepthInches: '0.25',
    sunlight: 'Full Sun',
    waterNeeds: 'Medium',
    description: 'Classic sweet basil for pesto and Italian cooking.',
    careInstructions: 'Pinch flowers to encourage leaf growth, water at base.',
  },
  {
    plantId: 'lettuce-buttercrunch',
    commonName: 'Buttercrunch Lettuce',
    scientificName: 'Lactuca sativa',
    variety: 'Buttercrunch',
    family: 'Asteraceae',
    type: 'Vegetable',
    growthHabit: 'Bush',
    daysToMaturity: 55,
    daysToGermination: 4,
    spacingInches: 8,
    rowSpacingInches: 12,
    plantingDepthInches: '0.25',
    sunlight: 'Partial Shade',
    waterNeeds: 'High',
    frostTolerant: true,
    description: 'Butterhead lettuce with tender, sweet leaves.',
  },
  {
    plantId: 'pepper-bell',
    commonName: 'Bell Pepper',
    scientificName: 'Capsicum annuum',
    variety: 'California Wonder',
    family: 'Solanaceae',
    type: 'Vegetable',
    growthHabit: 'Bush',
    daysToMaturity: 70,
    daysToGermination: 10,
    spacingInches: 18,
    rowSpacingInches: 24,
    plantingDepthInches: '0.5',
    sunlight: 'Full Sun',
    waterNeeds: 'Medium',
    description: 'Sweet bell peppers that turn from green to red when fully ripe.',
  },
  {
    plantId: 'carrot-nantes',
    commonName: 'Nantes Carrot',
    scientificName: 'Daucus carota',
    variety: 'Nantes',
    family: 'Apiaceae',
    type: 'Vegetable',
    growthHabit: 'Root',
    daysToMaturity: 65,
    daysToGermination: 14,
    spacingInches: 3,
    rowSpacingInches: 12,
    plantingDepthInches: '0.5',
    sunlight: 'Full Sun',
    waterNeeds: 'Medium',
    frostTolerant: true,
    description: 'Sweet, cylindrical carrots with crisp texture.',
  },
  {
    plantId: 'zucchini-black-beauty',
    commonName: 'Black Beauty Zucchini',
    scientificName: 'Cucurbita pepo',
    variety: 'Black Beauty',
    family: 'Cucurbitaceae',
    type: 'Vegetable',
    growthHabit: 'Bush',
    daysToMaturity: 50,
    daysToGermination: 7,
    spacingInches: 24,
    rowSpacingInches: 36,
    plantingDepthInches: '1',
    sunlight: 'Full Sun',
    waterNeeds: 'High',
    description: 'Dark green zucchini with excellent flavor. High yielding.',
  },
  {
    plantId: 'strawberry-everbearing',
    commonName: 'Everbearing Strawberry',
    scientificName: 'Fragaria × ananassa',
    variety: 'Ozark Beauty',
    family: 'Rosaceae',
    type: 'Fruit',
    growthHabit: 'Ground Cover',
    daysToMaturity: 90,
    daysToGermination: 14,
    spacingInches: 12,
    rowSpacingInches: 24,
    plantingDepthInches: '0',
    sunlight: 'Full Sun',
    waterNeeds: 'Medium',
    perennial: true,
    description: 'Produces berries from spring through fall.',
  },
];

async function seedThreedPlants() {
  console.log('🌱 Seeding ThreeD Garden plants...\n');
  
  let newCount = 0;
  let existingCount = 0;
  
  for (const plant of seedPlants) {
    const existing = await db
      .select()
      .from(threedPlants)
      .where(eq(threedPlants.plantId, plant.plantId))
      .limit(1);
    
    if (existing.length === 0) {
      await db.insert(threedPlants).values({
        ...plant,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      newCount++;
      console.log(`  ✓ Added: ${plant.commonName}`);
    } else {
      existingCount++;
      console.log(`  ○ Already exists: ${plant.commonName}`);
    }
  }
  
  console.log(`\n✅ Seed complete: ${newCount} new, ${existingCount} existing`);
  process.exit(0);
}

seedThreedPlants().catch(console.error);