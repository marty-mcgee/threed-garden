// src/lib/services/threed/PlantModelMapping.ts
import { db } from '@/lib/db/client';
import { threedPlants } from '@/lib/schema';
import { eq } from 'drizzle-orm';

// Map plant common names to model types
const modelNameMap: Record<string, string> = {
  // Vegetables
  'tomato': 'tomato',
  'roma tomato': 'tomato',
  'cherry tomato': 'tomato',
  'pepper': 'pepper',
  'bell pepper': 'pepper',
  'jalapeno': 'pepper',
  'lettuce': 'lettuce',
  'buttercrunch lettuce': 'lettuce',
  'carrot': 'carrot',
  'zucchini': 'zucchini',
  'corn': 'corn',
  'sweet corn': 'corn',
  
  // Herbs
  'basil': 'basil',
  'sweet basil': 'basil',
  'mint': 'herb-generic',
  'rosemary': 'herb-generic',
  'thyme': 'herb-generic',
  'oregano': 'herb-generic',
  
  // Fruits
  'strawberry': 'strawberry',
  'everbearing strawberry': 'strawberry',
  'blueberry': 'berry-bush',
  'raspberry': 'berry-bush',
  
  // Flowers
  'sunflower': 'sunflower',
  'rose': 'rose',
  'lavender': 'flower-generic',
  'marigold': 'flower-generic',
};

// Get model type from plant name
export function getModelTypeFromPlantName(plantName: string): string {
  const lowerName = plantName.toLowerCase();
  
  // Check for exact matches
  if (modelNameMap[lowerName]) return modelNameMap[lowerName];
  
  // Check for partial matches
  for (const [key, modelType] of Object.entries(modelNameMap)) {
    if (lowerName.includes(key)) {
      return modelType;
    }
  }
  
  // Default based on plant type
  return 'tomato'; // Default fallback
}

// Get plant with 3D model info
export async function getPlantWithModelInfo(plantId: number) {
  const plant = await db
    .select()
    .from(threedPlants)
    .where(eq(threedPlants.id, plantId))
    .limit(1);
  
  if (!plant.length) return null;
  
  const plantData = plant[0];
  
  // Determine model type from plant name or use stored value
  const modelType = plantData.modelType || getModelTypeFromPlantName(plantData.commonName);
  
  return {
    ...plantData,
    modelType,
    // Model-specific overrides
    modelConfig: {
      type: modelType,
      defaultColor: plantData.foliageColor || getDefaultColorForModel(modelType),
      fruitColor: plantData.fruitColor || getDefaultFruitColorForModel(modelType),
      scale: plantData.modelScale || 1,
    }
  };
}

function getDefaultColorForModel(modelType: string): string {
  const colors: Record<string, string> = {
    'tomato': '#32CD32',
    'pepper': '#2E8B57',
    'lettuce': '#228B22',
    'carrot': '#32CD32',
    'basil': '#228B22',
    'strawberry': '#2E8B57',
    'sunflower': '#228B22',
    'rose': '#228B22',
    'herb-generic': '#32CD32',
    'flower-generic': '#32CD32',
    'default': '#32CD32',
  };
  return colors[modelType] || colors.default;
}

function getDefaultFruitColorForModel(modelType: string): string {
  const colors: Record<string, string> = {
    'tomato': '#FF6347',
    'pepper': '#FF0000',
    'strawberry': '#FF0000',
    'default': '#FF6347',
  };
  return colors[modelType] || colors.default;
}