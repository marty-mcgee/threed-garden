// scripts/seed-initial-data.ts - Fixed version without onConflictDoUpdate

import { db } from '@/lib/db/client';
import { 
  // Auth
  user,
  // Projects
  project, projectThreed, projectTraffic, projectMusic, projectAssets,
  // ThreeD
  threed, threedPlants, threedBeds, threedPlantings, threedModels, 
  threedModelFiles, threedCharacters, threedFarmbots, threedMarkers, 
  threedLayers, threedTasks, threedHarvests, threedWeatherLogs,
  // Traffic
  traffic, trafficChpCadIncidents, trafficChpCases, trafficChpCenters,
  trafficCaltransLaneClosures, trafficCaltransCctvCameras, 
  trafficCaltransDistricts, trafficBayArea511Events, trafficCalfireIncidents,
  // Music
  music, musicAlbums, musicTracks, musicLinks, musicMedia,
} from '@/lib/schema';
import { eq, sql, and } from 'drizzle-orm';

// ============================================
// CONFIGURATION
// ============================================

// ✅ Test user ID (will be created if not exists)
const TEST_USER_ID = '9a9ed475-3dcd-492e-b22f-de27a33ed1fc';

// ✅ GPS Center for ThreeD (San Francisco)
const GPS_CENTER = { lat: 39.514719, lng: -123.760382 };
const SCALE_FACTOR = 0.00001;

// ============================================
// HELPERS
// ============================================

function threeDToGPS(x: number, z: number): { lat: number; lng: number } {
  return {
    lat: GPS_CENTER.lat + (z * SCALE_FACTOR),
    lng: GPS_CENTER.lng + (x * SCALE_FACTOR),
  };
}

function randomDate(daysBack: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysBack));
  return date;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// ✅ Helper to safely insert with conflict check
async function safeInsert(table: any, values: any, conflictFields: string[] = []) {
  try {
    // Try to insert
    const [result] = await db.insert(table).values(values).returning();
    return result;
  } catch (error: any) {
    // If duplicate key error, try to find and return existing
    if (error.code === '23505') { // Unique violation
      const conditions = conflictFields.map(field => {
        const value = values[field];
        if (value === undefined) return null;
        return eq(table[field], value);
      }).filter(Boolean);
      
      if (conditions.length > 0) {
        const [existing] = await db
          .select()
          .from(table)
          .where(and(...conditions))
          .limit(1);
        if (existing) return existing;
      }
    }
    throw error;
  }
}

// ✅ Helper to link asset to project
async function linkAssetToProject(
  userId: string,
  projectId: number,
  moduleId: number,
  moduleType: string,
  assetType: string,
  assetId: number
) {
  // Check if already linked
  const [existing] = await db
    .select()
    .from(projectAssets)
    .where(
      and(
        eq(projectAssets.projectId, projectId),
        eq(projectAssets.moduleId, moduleId),
        eq(projectAssets.moduleType, moduleType),
        eq(projectAssets.assetType, assetType),
        eq(projectAssets.assetId, assetId)
      )
    )
    .limit(1);

  if (existing) {
    // Update if needed
    if (!existing.isActive) {
      await db
        .update(projectAssets)
        .set({ isActive: true })
        .where(eq(projectAssets.id, existing.id));
    }
    return existing;
  }

  // Create new link
  const [newLink] = await db
    .insert(projectAssets)
    .values({
      userId,
      projectId,
      moduleId,
      moduleType,
      assetType,
      assetId,
      isActive: true,
      config: {},
    })
    .returning();

  return newLink;
}

// ============================================
// SEED FUNCTIONS
// ============================================

async function seedUser() {
  console.log('👤 Seeding user...');
  
  const [existingUser] = await db
    .select()
    .from(user)
    .where(eq(user.id, TEST_USER_ID))
    .limit(1);

  if (existingUser) {
    console.log('✅ User already exists');
    return existingUser;
  }

  const [newUser] = await db
    .insert(user)
    .values({
      id: TEST_USER_ID,
      name: 'Test User',
      email: 'test@example.com',
      emailVerified: new Date(),
      image: 'https://ui-avatars.com/api/?name=Test+User',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  console.log('✅ User created');
  return newUser;
}

async function seedProjects(userId: string) {
  console.log('📁 Seeding projects...');

  const projects = [
    {
      name: 'Demo Garden Project',
      description: 'A demonstration garden project with all module types',
      slug: 'demo-garden',
      isActive: true,
      isPublic: true,
    },
    {
      name: 'Urban Farm',
      description: 'City-based farming project with traffic monitoring',
      slug: 'urban-farm',
      isActive: true,
      isPublic: false,
    },
    {
      name: 'Music Garden',
      description: 'Combining music and gardening in a unique space',
      slug: 'music-garden',
      isActive: true,
      isPublic: true,
    },
  ];

  const createdProjects = [];
  for (const projectData of projects) {
    const [existing] = await db
      .select()
      .from(project)
      .where(eq(project.slug, projectData.slug))
      .limit(1);

    if (existing) {
      createdProjects.push(existing);
      continue;
    }

    const [newProject] = await db
      .insert(project)
      .values({
        userId,
        ...projectData,
        config: {},
        metadata: {},
      })
      .returning();

    createdProjects.push(newProject);
  }

  console.log(`✅ Created ${createdProjects.length} projects`);
  return createdProjects;
}

async function seedThreedModule(userId: string, projectId: number) {
  console.log('🌱 Seeding ThreeD module...');

  // Create ThreeD module
  let threedModule: any;
  const [existingModule] = await db
    .select()
    .from(threed)
    .where(eq(threed.slug, 'garden-main'))
    .limit(1);

  if (existingModule) {
    threedModule = existingModule;
    await db
      .update(threed)
      .set({ isActive: true, name: 'Garden Main' })
      .where(eq(threed.id, existingModule.id));
  } else {
    const [newModule] = await db
      .insert(threed)
      .values({
        userId,
        projectId,
        name: 'Garden Main',
        description: 'Main garden module for testing',
        slug: 'garden-main',
        isActive: true,
        isPublic: true,
        config: { gridSize: 10, units: 'feet' },
        version: '1.0.0',
        metadata: {},
      })
      .returning();
    threedModule = newModule;
  }

  // Link to project
  const [existingLink] = await db
    .select()
    .from(projectThreed)
    .where(
      and(
        eq(projectThreed.projectId, projectId),
        eq(projectThreed.threedId, threedModule.id)
      )
    )
    .limit(1);

  if (!existingLink) {
    await db
      .insert(projectThreed)
      .values({
        userId,
        projectId,
        threedId: threedModule.id,
        isActive: true,
      });
  }

  // ✅ Seed Plants
  console.log('  🌿 Seeding plants...');
  const plants = [
    { plantId: 'PLANT-001', commonName: 'Tomato', scientificName: 'Solanum lycopersicum', type: 'Vegetable' },
    { plantId: 'PLANT-002', commonName: 'Lavender', scientificName: 'Lavandula', type: 'Herb' },
    { plantId: 'PLANT-003', commonName: 'Rose', scientificName: 'Rosa', type: 'Flower' },
    { plantId: 'PLANT-004', commonName: 'Basil', scientificName: 'Ocimum basilicum', type: 'Herb' },
    { plantId: 'PLANT-005', commonName: 'Strawberry', scientificName: 'Fragaria', type: 'Fruit' },
  ];

  const createdPlants = [];
  for (const plant of plants) {
    let existing = await db
      .select()
      .from(threedPlants)
      .where(eq(threedPlants.plantId, plant.plantId))
      .limit(1);

    let newPlant;
    if (existing.length > 0) {
      newPlant = existing[0];
      await db
        .update(threedPlants)
        .set({ isActive: true, commonName: plant.commonName })
        .where(eq(threedPlants.id, newPlant.id));
    } else {
      const [inserted] = await db
        .insert(threedPlants)
        .values({
          userId,
          plantId: plant.plantId,
          commonName: plant.commonName,
          scientificName: plant.scientificName,
          type: plant.type,
          isActive: true,
          status: 'active',
          sunlight: 'Full Sun',
          waterNeeds: 'Medium',
          description: `${plant.commonName} plant for testing`,
        })
        .returning();
      newPlant = inserted;
    }
    createdPlants.push(newPlant);

    // Link to project assets
    await linkAssetToProject(
      userId,
      projectId,
      threedModule.id,
      'threed',
      'threed_plants',
      newPlant.id
    );
  }

  // ✅ Seed Beds
  console.log('  🛏️ Seeding beds...');
  const beds = [
    { bedId: 'BED-001', name: 'Main Garden Bed', positionX: '0', positionY: '0', positionZ: '0', color: '#f59e0b' },
    { bedId: 'BED-002', name: 'Herb Garden', positionX: '3', positionY: '0', positionZ: '-2', color: '#22c55e' },
    { bedId: 'BED-003', name: 'Flower Bed', positionX: '-3', positionY: '0', positionZ: '2', color: '#ec4899' },
  ];

  const createdBeds = [];
  for (const bed of beds) {
    let existing = await db
      .select()
      .from(threedBeds)
      .where(eq(threedBeds.bedId, bed.bedId))
      .limit(1);

    let newBed;
    if (existing.length > 0) {
      newBed = existing[0];
      await db
        .update(threedBeds)
        .set({ isActive: true, name: bed.name })
        .where(eq(threedBeds.id, newBed.id));
    } else {
      const [inserted] = await db
        .insert(threedBeds)
        .values({
          userId,
          bedId: bed.bedId,
          name: bed.name,
          shape: 'rectangle',
          widthFeet: '4',
          lengthFeet: '8',
          heightFeet: '1',
          positionX: bed.positionX,
          positionY: bed.positionY,
          positionZ: bed.positionZ,
          color: bed.color,
          isActive: true,
          status: 'active',
        })
        .returning();
      newBed = inserted;
    }
    createdBeds.push(newBed);

    await linkAssetToProject(
      userId,
      projectId,
      threedModule.id,
      'threed',
      'threed_beds',
      newBed.id
    );
  }

  // ✅ Seed Plantings
  console.log('  🌱 Seeding plantings...');
  for (let i = 0; i < 5; i++) {
    const plant = createdPlants[i % createdPlants.length];
    const bed = createdBeds[i % createdBeds.length];
    const gps = threeDToGPS(
      parseFloat(bed.positionX || '0') + (i - 2) * 0.5,
      parseFloat(bed.positionZ || '0') + (i - 2) * 0.5
    );

    let existing = await db
      .select()
      .from(threedPlantings)
      .where(eq(threedPlantings.plantingId, `PLANTING-${String(i + 1).padStart(3, '0')}`))
      .limit(1);

    let newPlanting;
    if (existing.length > 0) {
      newPlanting = existing[0];
      await db
        .update(threedPlantings)
        .set({ isActive: true })
        .where(eq(threedPlantings.id, newPlanting.id));
    } else {
      const [inserted] = await db
        .insert(threedPlantings)
        .values({
          userId,
          plantingId: `PLANTING-${String(i + 1).padStart(3, '0')}`,
          plantId: plant.id,
          bedId: bed.id,
          quantity: randomInt(1, 5),
          positionX: String(gps.lng),
          positionY: '0',
          positionZ: String(gps.lat),
          plantedDate: randomDate(30).toISOString(),
          isActive: true,
          status: randomChoice(['planted', 'growing', 'harvesting', 'harvested']),
          growthStage: randomChoice(['seed', 'seedling', 'vegetative', 'flowering', 'fruiting', 'mature']),
          health: randomChoice(['excellent', 'good', 'fair']),
        })
        .returning();
      newPlanting = inserted;
    }

    await linkAssetToProject(
      userId,
      projectId,
      threedModule.id,
      'threed',
      'threed_plantings',
      newPlanting.id
    );
  }

  // ✅ Seed Characters
  console.log('  🧑‍🌾 Seeding characters...');
  const characters = [
    { characterId: 'CHAR-001', name: 'Gardener Joe', type: 'human' },
    { characterId: 'CHAR-002', name: 'Friendly Bird', type: 'bird' },
  ];

  for (const char of characters) {
    const gps = threeDToGPS(randomInt(-3, 3), randomInt(-3, 3));
    
    let existing = await db
      .select()
      .from(threedCharacters)
      .where(eq(threedCharacters.characterId, char.characterId))
      .limit(1);

    let newChar;
    if (existing.length > 0) {
      newChar = existing[0];
      await db
        .update(threedCharacters)
        .set({ isActive: true, name: char.name })
        .where(eq(threedCharacters.id, newChar.id));
    } else {
      const [inserted] = await db
        .insert(threedCharacters)
        .values({
          userId,
          characterId: char.characterId,
          name: char.name,
          type: char.type,
          isActive: true,
          status: 'active',
          positionX: String(gps.lng),
          positionY: '0',
          positionZ: String(gps.lat),
          visible: true,
          interactable: true,
        })
        .returning();
      newChar = inserted;
    }

    await linkAssetToProject(
      userId,
      projectId,
      threedModule.id,
      'threed',
      'threed_characters',
      newChar.id
    );
  }

  // ✅ Seed FarmBots
  console.log('  🤖 Seeding FarmBots...');
  const farmbots = [
    { deviceId: 'FARMBOT-001', name: 'FarmBot Alpha', bedId: createdBeds[0]?.id },
    { deviceId: 'FARMBOT-002', name: 'FarmBot Beta', bedId: createdBeds[1]?.id },
  ];

  for (const farmbot of farmbots) {
    const gps = threeDToGPS(randomInt(-2, 2), randomInt(-2, 2));
    
    let existing = await db
      .select()
      .from(threedFarmbots)
      .where(eq(threedFarmbots.deviceId, farmbot.deviceId))
      .limit(1);

    let newFarmbot;
    if (existing.length > 0) {
      newFarmbot = existing[0];
      await db
        .update(threedFarmbots)
        .set({ isActive: true, name: farmbot.name })
        .where(eq(threedFarmbots.id, newFarmbot.id));
    } else {
      const [inserted] = await db
        .insert(threedFarmbots)
        .values({
          userId,
          deviceId: farmbot.deviceId,
          name: farmbot.name,
          bedId: farmbot.bedId,
          status: randomChoice(['online', 'offline']),
          isActive: true,
          positionX: String(gps.lng),
          positionY: '0',
          positionZ: String(gps.lat),
          batteryLevel: randomInt(20, 100),
          firmwareVersion: 'v1.2.3',
        })
        .returning();
      newFarmbot = inserted;
    }

    await linkAssetToProject(
      userId,
      projectId,
      threedModule.id,
      'threed',
      'threed_farmbots',
      newFarmbot.id
    );
  }

  // ✅ Seed Markers
  console.log('  📍 Seeding markers...');
  const markers = [
    { markerId: 'MARKER-001', name: 'Garden Entrance', x: -4, z: 4, color: '#ec4899' },
    { markerId: 'MARKER-002', name: 'Water Station', x: 0, z: 4.5, color: '#3b82f6' },
    { markerId: 'MARKER-003', name: 'Compost Area', x: 4, z: 4, color: '#f59e0b' },
  ];

  for (const marker of markers) {
    let existing = await db
      .select()
      .from(threedMarkers)
      .where(eq(threedMarkers.markerId, marker.markerId))
      .limit(1);

    let newMarker;
    if (existing.length > 0) {
      newMarker = existing[0];
      await db
        .update(threedMarkers)
        .set({ isActive: true, name: marker.name })
        .where(eq(threedMarkers.id, newMarker.id));
    } else {
      const [inserted] = await db
        .insert(threedMarkers)
        .values({
          userId,
          markerId: marker.markerId,
          name: marker.name,
          position: { x: marker.x, y: 0.5, z: marker.z },
          color: marker.color,
          isActive: true,
          isVisible: true,
        })
        .returning();
      newMarker = inserted;
    }

    await linkAssetToProject(
      userId,
      projectId,
      threedModule.id,
      'threed',
      'threed_markers',
      newMarker.id
    );
  }

  // ✅ Seed Layers
  console.log('  📐 Seeding layers...');
  const layers = [
    { layerId: 'LAYER-001', name: 'Garden Layer' },
    { layerId: 'LAYER-002', name: 'Plants Layer' },
  ];

  for (const layer of layers) {
    let existing = await db
      .select()
      .from(threedLayers)
      .where(eq(threedLayers.layerId, layer.layerId))
      .limit(1);

    let newLayer;
    if (existing.length > 0) {
      newLayer = existing[0];
      await db
        .update(threedLayers)
        .set({ isActive: true, name: layer.name })
        .where(eq(threedLayers.id, newLayer.id));
    } else {
      const [inserted] = await db
        .insert(threedLayers)
        .values({
          userId,
          layerId: layer.layerId,
          name: layer.name,
          isActive: true,
          isVisible: true,
          config: { visible: true, opacity: 1.0, color: '#ffffff' },
        })
        .returning();
      newLayer = inserted;
    }

    await linkAssetToProject(
      userId,
      projectId,
      threedModule.id,
      'threed',
      'threed_layers',
      newLayer.id
    );
  }

  // ✅ Seed Tasks
  console.log('  📋 Seeding tasks...');
  const tasks = [
    { taskId: 'TASK-001', title: 'Water plants', type: 'water', priority: 'high' },
    { taskId: 'TASK-002', title: 'Fertilize tomatoes', type: 'fertilize', priority: 'medium' },
    { taskId: 'TASK-003', title: 'Harvest basil', type: 'harvest', priority: 'low' },
  ];

  for (const task of tasks) {
    let existing = await db
      .select()
      .from(threedTasks)
      .where(eq(threedTasks.taskId, task.taskId))
      .limit(1);

    let newTask;
    if (existing.length > 0) {
      newTask = existing[0];
      await db
        .update(threedTasks)
        .set({ isActive: true, title: task.title })
        .where(eq(threedTasks.id, newTask.id));
    } else {
      const [inserted] = await db
        .insert(threedTasks)
        .values({
          userId,
          taskId: task.taskId,
          title: task.title,
          type: task.type,
          priority: task.priority,
          status: randomChoice(['pending', 'in_progress', 'completed']),
          isActive: true,
          dueDate: randomDate(14).toISOString(),
        })
        .returning();
      newTask = inserted;
    }

    await linkAssetToProject(
      userId,
      projectId,
      threedModule.id,
      'threed',
      'threed_tasks',
      newTask.id
    );
  }

  console.log(`✅ ThreeD module seeded with ${createdPlants.length} plants, ${createdBeds.length} beds, etc.`);
  return threedModule;
}

// ... (similar updates for seedTrafficModule and seedMusicModule)

// ============================================
// MAIN SEED FUNCTION
// ============================================

async function seedInitialData() {
  console.log('🌱 Starting initial data seed...\n');

  try {
    // 1. Seed User
    const testUser = await seedUser();

    // 2. Seed Projects
    const projects = await seedProjects(testUser.id);
    const mainProject = projects[0];

    // 3. Seed ThreeD Module
    await seedThreedModule(testUser.id, mainProject.id);

    // 4. Seed Traffic Module
    // await seedTrafficModule(testUser.id, mainProject.id);

    // 5. Seed Music Module
    // await seedMusicModule(testUser.id, mainProject.id);

    console.log('\n🎉 Initial data seed complete!');
    console.log(`
📊 Summary:
  - User: ${testUser.name} (${testUser.id})
  - Projects: ${projects.length}
  - Modules: ThreeD (seeded)
  - Assets: Linked via project_assets

🔗 Quick Links:
  - Admin: http://localhost:4444/admin
  - Projects: http://localhost:4444/admin/projects
  - Map: http://localhost:4444/dashboard/map?projectId=${mainProject.id}
    `);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  }
}

// ============================================
// RUN SEED
// ============================================

seedInitialData()
  .catch(console.error)
  .finally(() => process.exit(0));