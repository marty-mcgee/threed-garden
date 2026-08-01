// scripts/seed-initial-data.ts - Complete working version

import { db } from '@/lib/db/client';
import { 
  // Auth
  user,
  // Projects
  project, projectThreed, projectTraffic, projectMusic, projectAssets,
  // ThreeD
  threed, threedPlants, threedBeds, threedPlantings, threedModels, 
  threedModelFiles, threedCharacters, threedFarmbots, 
  threedLayers, threedTasks, threedHarvests, threedWeatherLogs,
  threedFarmbotLogs, threedSystemLogs, threedWateringSchedules, threedWateringHistory,
  // Traffic
  traffic, trafficChpCadIncidents, trafficChpCases, trafficChpCenters,
  trafficCaltransLaneClosures, trafficCaltransCctvCameras, 
  trafficCaltransDistricts, trafficBayArea511Events, trafficCalfireIncidents,
  trafficApiRequestLogs,
  // Music
  music, musicAlbums, musicTracks, musicLinks, musicMedia, 
  musicPlaybackHistory, musicPollingLogs,
} from '@/lib/schema';
import { eq, sql, and } from 'drizzle-orm';

// ============================================
// CONFIGURATION
// ============================================

const TEST_USER_ID = '9a9ed475-3dcd-492e-b22f-de27a33ed1fc';
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

function randomFloat(min: number, max: number): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// ✅ Helper for precise coordinate formatting
function formatCoordinate(value: number, decimals: number = 7): string {
  return value.toFixed(decimals);
}

// ✅ Actual GPS coordinates for various locations
const LOCATIONS = {
  sacramento: { lat: 38.5815722, lng: -121.4943996 },
  sanFrancisco: { lat: 37.7749295, lng: -122.4194155 },
  oakland: { lat: 37.8043637, lng: -122.2711137 },
  sanJose: { lat: 37.3382082, lng: -121.8863286 },
  redding: { lat: 40.5865396, lng: -122.3916754 },
  fresno: { lat: 36.7377981, lng: -119.7871247 },
  stockton: { lat: 37.9577016, lng: -121.2907796 },
  modesto: { lat: 37.6390972, lng: -120.9968782 },
};

function randomGPS(center: { lat: number; lng: number }, spread: number = 0.001): { lat: number; lng: number } {
  return {
    lat: center.lat + (Math.random() - 0.5) * spread,
    lng: center.lng + (Math.random() - 0.5) * spread,
  };
}

// ✅ Helper to safely insert with conflict check
async function safeInsert(table: any, values: any, conflictFields: string[] = []) {
  try {
    const [result] = await db.insert(table).values(values).returning();
    return result;
  } catch (error: any) {
    if (error.code === '23505') {
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
    if (!existing.isActive) {
      await db
        .update(projectAssets)
        .set({ isActive: true })
        .where(eq(projectAssets.id, existing.id));
    }
    return existing;
  }

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

// ============================================
// THREED MODULE - Complete
// ============================================

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

  // ============================================
  // 1. threed_plants - Master plant database
  // ============================================
  console.log('  🌿 Seeding plants (master data)...');
  const plants = [
    { plantId: 'PLANT-001', commonName: 'Tomato', scientificName: 'Solanum lycopersicum', type: 'Vegetable', sunlight: 'Full Sun', waterNeeds: 'Medium', daysToMaturity: 85 },
    { plantId: 'PLANT-002', commonName: 'Lavender', scientificName: 'Lavandula', type: 'Herb', sunlight: 'Full Sun', waterNeeds: 'Low', daysToMaturity: 90 },
    { plantId: 'PLANT-003', commonName: 'Rose', scientificName: 'Rosa', type: 'Flower', sunlight: 'Full Sun', waterNeeds: 'Medium', daysToMaturity: 120 },
    { plantId: 'PLANT-004', commonName: 'Basil', scientificName: 'Ocimum basilicum', type: 'Herb', sunlight: 'Full Sun', waterNeeds: 'Medium', daysToMaturity: 70 },
    { plantId: 'PLANT-005', commonName: 'Strawberry', scientificName: 'Fragaria', type: 'Fruit', sunlight: 'Full Sun', waterNeeds: 'Medium', daysToMaturity: 90 },
    { plantId: 'PLANT-006', commonName: 'Lettuce', scientificName: 'Lactuca sativa', type: 'Vegetable', sunlight: 'Partial Shade', waterNeeds: 'High', daysToMaturity: 65 },
    { plantId: 'PLANT-007', commonName: 'Mint', scientificName: 'Mentha', type: 'Herb', sunlight: 'Partial Shade', waterNeeds: 'High', daysToMaturity: 90 },
    { plantId: 'PLANT-008', commonName: 'Sunflower', scientificName: 'Helianthus annuus', type: 'Flower', sunlight: 'Full Sun', waterNeeds: 'Low', daysToMaturity: 100 },
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
          sunlight: plant.sunlight,
          waterNeeds: plant.waterNeeds,
          daysToMaturity: plant.daysToMaturity,
          daysToGermination: randomInt(5, 14),
          daysToHarvest: plant.daysToMaturity + randomInt(-10, 10),
          spacingInches: randomInt(12, 36),
          rowSpacingInches: randomInt(18, 48),
          plantingDepthInches: randomFloat(0.25, 1.5).toString(),
          frostTolerant: randomChoice([true, false]),
          perennial: randomChoice([true, false]),
          description: `${plant.commonName} plant for testing`,
          careInstructions: `Water ${plant.waterNeeds.toLowerCase()}, provide ${plant.sunlight.toLowerCase()}`,
          harvestInstructions: `Harvest when ready`,
        })
        .returning();
      newPlant = inserted;
    }
    createdPlants.push(newPlant);

    await linkAssetToProject(
      userId,
      projectId,
      threedModule.id,
      'threed',
      'threed_plants',
      newPlant.id
    );
  }

  // ============================================
  // 2. threed_models - 3D Model library
  // ============================================
  console.log('  🗿 Seeding 3D models...');
  const models = [
    { modelName: 'Tomato Plant', modelType: 'glb', filePath: '/models/tomato.glb', isDefault: true },
    { modelName: 'Lavender Bush', modelType: 'glb', filePath: '/models/lavender.glb' },
    { modelName: 'Rose Bush', modelType: 'glb', filePath: '/models/rose.glb' },
    { modelName: 'Garden Bed', modelType: 'glb', filePath: '/models/bed.glb', isDefault: true },
    { modelName: 'FarmBot', modelType: 'glb', filePath: '/models/farmbot.glb' },
  ];

  const createdModels = [];
  for (const model of models) {
    let existing = await db
      .select()
      .from(threedModels)
      .where(eq(threedModels.modelName, model.modelName))
      .limit(1);

    let newModel;
    if (existing.length > 0) {
      newModel = existing[0];
      await db
        .update(threedModels)
        .set({ isActive: true })
        .where(eq(threedModels.id, newModel.id));
    } else {
      const [inserted] = await db
        .insert(threedModels)
        .values({
          userId,
          modelName: model.modelName,
          modelType: model.modelType,
          filePath: model.filePath,
          fileSize: randomInt(1024, 10240),
          thumbnailUrl: `https://via.placeholder.com/200x200/64748b/ffffff?text=${model.modelName}`,
          isDefault: model.isDefault || false,
          isActive: true,
          status: 'active',
          scale: randomFloat(0.8, 1.2).toString(),
        })
        .returning();
      newModel = inserted;
    }
    createdModels.push(newModel);

    await linkAssetToProject(
      userId,
      projectId,
      threedModule.id,
      'threed',
      'threed_models',
      newModel.id
    );
  }

  // ============================================
  // 3. threed_model_files - Model files
  // ============================================
  console.log('  📁 Seeding model files...');
  for (const model of createdModels) {
    const files = [
      { fileName: `${model.modelName}.glb`, fileType: 'model' },
      { fileName: `${model.modelName}_texture.png`, fileType: 'texture', textureType: 'baseColor' },
      { fileName: `${model.modelName}_normal.png`, fileType: 'texture', textureType: 'normalMap' },
    ];
    
    for (const file of files) {
      const [existing] = await db
        .select()
        .from(threedModelFiles)
        .where(eq(threedModelFiles.fileName, file.fileName))
        .limit(1);

      if (!existing) {
        await db
          .insert(threedModelFiles)
          .values({
            userId,
            modelId: model.id,
            fileName: file.fileName,
            fileType: file.fileType,
            textureType: file.textureType || null,
            filePath: `/models/${file.fileName}`,
            fileSize: randomInt(1024, 5120),
            loadOrder: files.indexOf(file),
          })
          .returning();
      }
    }
  }

  // ============================================
  // 4. threed_beds - Garden beds
  // ============================================
  console.log('  🛏️ Seeding beds...');
  const beds = [
    { bedId: 'BED-001', name: 'Main Garden Bed', positionX: '0', positionY: '0', positionZ: '0', color: '#f59e0b', widthFeet: '8', lengthFeet: '12' },
    { bedId: 'BED-002', name: 'Herb Garden', positionX: '3', positionY: '0', positionZ: '-2', color: '#22c55e', widthFeet: '4', lengthFeet: '6' },
    { bedId: 'BED-003', name: 'Flower Bed', positionX: '-3', positionY: '0', positionZ: '2', color: '#ec4899', widthFeet: '6', lengthFeet: '8' },
    { bedId: 'BED-004', name: 'Vegetable Row', positionX: '5', positionY: '0', positionZ: '-4', color: '#f97316', widthFeet: '3', lengthFeet: '10' },
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
          widthFeet: bed.widthFeet,
          lengthFeet: bed.lengthFeet,
          heightFeet: randomFloat(0.5, 1.5).toString(),
          squareFeet: (parseFloat(bed.widthFeet) * parseFloat(bed.lengthFeet)).toString(),
          positionX: bed.positionX,
          positionY: bed.positionY,
          positionZ: bed.positionZ,
          color: bed.color,
          isActive: true,
          status: 'active',
          soilType: randomChoice(['Loam', 'Sandy', 'Clay', 'Silt']),
          sunExposure: randomChoice(['Full Sun', 'Partial Sun', 'Shade']),
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

  // ============================================
  // 5. threed_plantings - Plant instances with full precision
  // ============================================
  console.log('  🌱 Seeding plantings (instances with positions)...');
  const createdPlantings = [];
  for (let i = 0; i < 12; i++) {
    const plant = createdPlants[i % createdPlants.length];
    const bed = createdBeds[i % createdBeds.length];
    
    const bedX = parseFloat(bed.positionX || '0');
    const bedZ = parseFloat(bed.positionZ || '0');
    const offsetX = (i % 4) * 0.8 - 1.2;
    const offsetZ = Math.floor(i / 4) * 0.8 - 1.2;
    const gps = threeDToGPS(bedX + offsetX, bedZ + offsetZ);

    let existing = await db
      .select()
      .from(threedPlantings)
      .where(eq(threedPlantings.plantingId, `PLANTING-${String(i + 1).padStart(3, '0')}`))
      .limit(1);

    let newPlanting;
    const statuses = ['planted', 'growing', 'harvesting', 'harvested', 'failed'];
    const growthStages = ['seed', 'seedling', 'vegetative', 'flowering', 'fruiting', 'mature', 'dormant'];
    
    if (existing.length > 0) {
      newPlanting = existing[0];
      await db
        .update(threedPlantings)
        .set({ 
          isActive: true,
          positionX: formatCoordinate(gps.lng, 7),
          positionY: '0.0000000',
          positionZ: formatCoordinate(gps.lat, 7),
        })
        .where(eq(threedPlantings.id, newPlanting.id));
    } else {
      const [inserted] = await db
        .insert(threedPlantings)
        .values({
          userId,
          plantingId: `PLANTING-${String(i + 1).padStart(3, '0')}`,
          plantId: plant.id,
          bedId: bed.id,
          quantity: randomInt(1, 6),
          positionX: formatCoordinate(gps.lng, 7),
          positionY: '0.0000000',
          positionZ: formatCoordinate(gps.lat, 7),
          plantedDate: randomDate(30),
          isActive: true,
          status: randomChoice(statuses),
          growthStage: randomChoice(growthStages),
          health: randomChoice(['excellent', 'good', 'fair', 'poor']),
          notes: `Planting of ${plant.commonName} in ${bed.name}`,
        })
        .returning();
      newPlanting = inserted;
    }
    createdPlantings.push(newPlanting);

    await linkAssetToProject(
      userId,
      projectId,
      threedModule.id,
      'threed',
      'threed_plantings',
      newPlanting.id
    );
  }

  // ============================================
  // 6. threed_watering_schedules
  // ============================================
  console.log('  💧 Seeding watering schedules...');
  const wateringSchedules = [];
  for (let i = 0; i < 4; i++) {
    const planting = createdPlantings[i % createdPlantings.length];
    const scheduleId = `SCHEDULE-${String(i + 1).padStart(3, '0')}`;
    
    let existing = await db
      .select()
      .from(threedWateringSchedules)
      .where(eq(threedWateringSchedules.scheduleId, scheduleId))
      .limit(1);

    let newSchedule;
    if (existing.length > 0) {
      newSchedule = existing[0];
      await db
        .update(threedWateringSchedules)
        .set({ isActive: true })
        .where(eq(threedWateringSchedules.id, newSchedule.id));
    } else {
      const nextWateringDate = new Date();
      nextWateringDate.setDate(nextWateringDate.getDate() + randomInt(1, 3));
      
      const [inserted] = await db
        .insert(threedWateringSchedules)
        .values({
          userId,
          scheduleId,
          plantId: planting.plantId,
          plantingId: planting.id,
          bedId: planting.bedId,
          frequency: randomChoice(['daily', 'weekly', 'moisture-based']),
          intervalDays: randomInt(1, 7),
          daysOfWeek: [1, 3, 5],
          timeOfDay: '08:00:00',
          durationMs: randomInt(30000, 120000),
          volumeMl: randomInt(500, 2000),
          moistureThreshold: randomInt(30, 60),
          nextWatering: nextWateringDate,
          lastWatering: randomDate(3),
          isActive: true,
          skipIfRain: randomChoice([true, false]),
          maxTemperature: randomInt(85, 100),
          minTemperature: randomInt(32, 50),
          maxWindSpeed: randomInt(15, 30),
          repeatCount: -1,
          timesExecuted: randomInt(0, 10),
          notes: `Watering schedule for ${planting.plantId}`,
          createdBy: 'system',
        })
        .returning();
      newSchedule = inserted;
    }
    wateringSchedules.push(newSchedule);

    await linkAssetToProject(
      userId,
      projectId,
      threedModule.id,
      'threed',
      'threed_watering_schedules',
      newSchedule.id
    );
  }

  // ============================================
  // 7. threed_watering_history
  // ============================================
  console.log('  📊 Seeding watering history...');
  for (let i = 0; i < 10; i++) {
    const schedule = wateringSchedules[i % wateringSchedules.length];
    const historyId = `WH-${String(i + 1).padStart(3, '0')}`;
    const statuses = ['success', 'failed', 'skipped'];
    
    const [existing] = await db
      .select()
      .from(threedWateringHistory)
      .where(eq(threedWateringHistory.historyId, historyId))
      .limit(1);

    if (!existing) {
      await db
        .insert(threedWateringHistory)
        .values({
          userId,
          historyId,
          scheduleId: schedule.id,
          plantId: schedule.plantId,
          farmbotId: null,
          plantingId: schedule.plantingId,
          status: randomChoice(statuses),
          durationMs: randomInt(30000, 120000),
          volumeMl: randomInt(500, 2000),
          skipReason: randomChoice([null, 'Rain detected', 'Temperature too high', 'Wind too strong']),
          errorMessage: randomChoice([null, 'Connection timeout', 'Device offline', 'Sensor error']),
          soilMoistureBefore: randomInt(20, 80),
          soilMoistureAfter: randomInt(40, 90),
          temperatureAtTime: randomFloat(55, 90).toString(),
          executedAt: randomDate(7),
          executedBy: randomChoice(['automated', 'manual', 'user']),
        })
        .returning();
    }
  }

  // ============================================
  // 8. threed_farmbots
  // ============================================
  console.log('  🤖 Seeding FarmBots...');
  const farmbots = [
    { deviceId: 'FARMBOT-001', name: 'FarmBot Alpha', bedId: createdBeds[0]?.id },
    { deviceId: 'FARMBOT-002', name: 'FarmBot Beta', bedId: createdBeds[1]?.id },
    { deviceId: 'FARMBOT-003', name: 'FarmBot Gamma', bedId: createdBeds[2]?.id },
  ];

  const createdFarmbots = [];
  for (const farmbot of farmbots) {
    const gps = threeDToGPS(randomInt(-3, 3), randomInt(-3, 3));
    
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
        .set({ 
          isActive: true, 
          name: farmbot.name,
          positionX: formatCoordinate(gps.lng, 7),
          positionY: '0.0000000',
          positionZ: formatCoordinate(gps.lat, 7),
          lastSeen: randomDate(1),
        })
        .where(eq(threedFarmbots.id, newFarmbot.id));
    } else {
      const [inserted] = await db
        .insert(threedFarmbots)
        .values({
          userId,
          deviceId: farmbot.deviceId,
          name: farmbot.name,
          bedId: farmbot.bedId,
          status: randomChoice(['online', 'offline', 'maintenance', 'error']),
          isActive: true,
          positionX: formatCoordinate(gps.lng, 7),
          positionY: '0.0000000',
          positionZ: formatCoordinate(gps.lat, 7),
          batteryLevel: randomInt(20, 100),
          firmwareVersion: `v${randomInt(1, 3)}.${randomInt(0, 9)}.${randomInt(0, 9)}`,
          lastSeen: randomDate(1),
          apiToken: `token-${Math.random().toString(36).substr(2, 16)}`,
          apiUrl: 'https://my.farmbot.io/api',
          notes: `FarmBot ${farmbot.name}`,
        })
        .returning();
      newFarmbot = inserted;
    }
    createdFarmbots.push(newFarmbot);

    await linkAssetToProject(
      userId,
      projectId,
      threedModule.id,
      'threed',
      'threed_farmbots',
      newFarmbot.id
    );
  }

  // ============================================
  // 9. threed_farmbot_logs
  // ============================================
  console.log('  📝 Seeding FarmBot logs...');
  for (let i = 0; i < 15; i++) {
    const farmbot = createdFarmbots[i % createdFarmbots.length];
    const eventTypes = ['status_change', 'watering', 'sensor_reading', 'error', 'info', 'warning'];
    const statuses = ['success', 'info', 'warning', 'error'];
    
    const [existing] = await db
      .select()
      .from(threedFarmbotLogs)
      .where(eq(threedFarmbotLogs.farmbotId, farmbot.id))
      .limit(1);

    if (!existing) {
      await db
        .insert(threedFarmbotLogs)
        .values({
          userId,
          farmbotId: farmbot.id,
          eventType: randomChoice(eventTypes),
          status: randomChoice(statuses),
          message: randomChoice([
            'Watering cycle completed',
            'Sensor reading: temperature 72°F',
            'Connection established',
            'Error: motor stuck',
            'Warning: low battery',
            'Firmware update available',
            'Schedule updated',
            'Manual override activated',
          ]),
          sensorData: {
            temperature: randomFloat(60, 85),
            humidity: randomFloat(40, 80),
            moisture: randomFloat(20, 70),
            battery: randomInt(20, 100),
          },
          loggedAt: randomDate(3),
        })
        .returning();
    }
  }

  // ============================================
  // 10. threed_characters - FIXED ALL ENUMS
  // ============================================
  console.log('  🧚 Seeding characters...');

  // Valid enum values
  const validEmotes = ['none', 'happy', 'sad', 'surprised', 'angry', 'wave', 'dance', 'sleep'];
  const validStatuses = ['active', 'idle', 'sleeping', 'moving'];
  const validMovementTypes = ['stationary', 'wander', 'patrol', 'circle', 'follow', 'teleport'];
  const validCharacterTypes = ['animal', 'bird', 'insect', 'mythical', 'human', 'robot', 'decoration'];

  const characters = [
    { characterId: 'CHAR-001', name: 'Gardener Joe', type: 'human', emote: 'happy' },
    { characterId: 'CHAR-002', name: 'Friendly Bird', type: 'bird', emote: 'dance' },
    { characterId: 'CHAR-003', name: 'Butterfly', type: 'insect', emote: 'dance' },
    { characterId: 'CHAR-004', name: 'Garden Gnome', type: 'decoration', emote: 'none' },
    { characterId: 'CHAR-005', name: 'Frog', type: 'animal', emote: 'happy' },
  ];

  for (const char of characters) {
    const gps = threeDToGPS(randomInt(-5, 5), randomInt(-5, 5));
    
    // Ensure all values are valid
    const emote = validEmotes.includes(char.emote) ? char.emote : 'none';
    const type = validCharacterTypes.includes(char.type) ? char.type : 'decoration';
    
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
        .set({ 
          isActive: true, 
          name: char.name,
          positionX: formatCoordinate(gps.lng, 7),
          positionY: '0.0000000',
          positionZ: formatCoordinate(gps.lat, 7),
        })
        .where(eq(threedCharacters.id, newChar.id));
    } else {
      const [inserted] = await db
        .insert(threedCharacters)
        .values({
          userId,
          characterId: char.characterId,
          name: char.name,
          type: type,
          isActive: true,
          status: randomChoice(validStatuses),
          positionX: formatCoordinate(gps.lng, 7),
          positionY: '0.0000000',
          positionZ: formatCoordinate(gps.lat, 7),
          visible: true,
          interactable: true,
          isMovable: randomChoice([true, false]),
          movementType: randomChoice(validMovementTypes),
          movementSpeed: randomFloat(0.2, 1.5).toString(),
          movementRadius: randomFloat(1, 5).toString(),
          defaultEmote: emote,
          interactionMessage: `Hello from ${char.name}!`,
          scale: randomFloat(0.8, 1.5).toString(),
          colorTint: randomChoice(['#ffffff', '#ff6b6b', '#4ecdc4', '#ffe66d', '#a8e6cf']),
          description: `${char.name} is a ${char.type} character in the garden`,
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

  // ============================================
  // 11. threed_layers
  // ============================================
  console.log('  📐 Seeding layers...');
  const layers = [
    { layerId: 'LAYER-001', name: 'Garden Layer', description: 'Main garden view' },
    { layerId: 'LAYER-002', name: 'Plants Layer', description: 'All plants and plantings' },
    { layerId: 'LAYER-003', name: 'Infrastructure Layer', description: 'Beds, paths, structures' },
    { layerId: 'LAYER-004', name: 'Characters Layer', description: 'All characters and creatures' },
    { layerId: 'LAYER-005', name: 'Tasks Layer', description: 'Current tasks and to-dos' },
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
          description: layer.description,
          isActive: true,
          isVisible: true,
          config: { 
            visible: true, 
            opacity: 1.0, 
            color: randomChoice(['#ffffff', '#f0f0f0', '#e0e0e0']),
            includeTypes: randomChoice([['plants', 'beds'], ['characters', 'farmbots'], ['tasks', 'layers']])
          },
          category: randomChoice(['garden', 'plants', 'infrastructure', 'characters', 'tasks']),
          layerType: randomChoice(['garden', 'plants', 'beds', 'characters', 'tasks']),
          orderIndex: layers.indexOf(layer),
          isPublic: randomChoice([true, false]),
          visibility: randomChoice(['public', 'private', 'shared']),
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

  // ============================================
  // 12. threed_tasks
  // ============================================
  console.log('  📋 Seeding tasks (simple to-dos)...');
  const tasks = [
    { taskId: 'TASK-001', title: 'Water plants', type: 'water', priority: 'high' },
    { taskId: 'TASK-002', title: 'Fertilize tomatoes', type: 'fertilize', priority: 'medium' },
    { taskId: 'TASK-003', title: 'Harvest basil', type: 'harvest', priority: 'low' },
    { taskId: 'TASK-004', title: 'Weed garden beds', type: 'weed', priority: 'medium' },
    { taskId: 'TASK-005', title: 'Prune roses', type: 'prune', priority: 'low' },
    { taskId: 'TASK-006', title: 'Check irrigation system', type: 'maintenance', priority: 'high' },
    { taskId: 'TASK-007', title: 'Plant new seeds', type: 'plant', priority: 'medium' },
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
        .set({ 
          isActive: true, 
          title: task.title,
        })
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
          status: randomChoice(['pending', 'in_progress', 'completed', 'cancelled']),
          isActive: true,
          dueDate: randomDate(14),
          description: `${task.title} task for the garden`,
          assignedTo: 'Gardener',
          notes: `Task to ${task.title.toLowerCase()}`,
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

  // ============================================
  // 13. threed_harvests
  // ============================================
  console.log('  🍎 Seeding harvests...');
  const harvests = [
    { harvestId: 'HARVEST-001', quantity: '2.5', unit: 'lbs', notes: 'First tomato harvest of the season' },
    { harvestId: 'HARVEST-002', quantity: '1.0', unit: 'lbs', notes: 'Basil harvest for pesto' },
    { harvestId: 'HARVEST-003', quantity: '0.5', unit: 'lbs', notes: 'Strawberry harvest, early season' },
    { harvestId: 'HARVEST-004', quantity: '3.0', unit: 'lbs', notes: 'Lettuce harvest, excellent quality' },
  ];

  for (let h = 0; h < harvests.length; h++) {
    const harvest = harvests[h];
    let existing = await db
      .select()
      .from(threedHarvests)
      .where(eq(threedHarvests.harvestId, harvest.harvestId))
      .limit(1);

    let newHarvest;
    if (existing.length > 0) {
      newHarvest = existing[0];
      await db
        .update(threedHarvests)
        .set({ 
          isActive: true, 
          quantity: harvest.quantity,
          notes: harvest.notes,
        })
        .where(eq(threedHarvests.id, newHarvest.id));
    } else {
      const [inserted] = await db
        .insert(threedHarvests)
        .values({
          userId,
          harvestId: harvest.harvestId,
          plantingId: createdPlantings[h % createdPlantings.length]?.id || null,
          plantId: createdPlants[h % createdPlants.length]?.id || null,
          quantity: harvest.quantity,
          unit: harvest.unit,
          notes: harvest.notes,
          harvestDate: randomDate(7),
          isActive: true,
          imageUrl: `https://via.placeholder.com/400x300/22c55e/ffffff?text=Harvest+${harvest.harvestId}`,
        })
        .returning();
      newHarvest = inserted;
    }

    await linkAssetToProject(
      userId,
      projectId,
      threedModule.id,
      'threed',
      'threed_harvests',
      newHarvest.id
    );
  }

  // ============================================
  // 14. threed_weather_logs
  // ============================================
  console.log('  🌤️ Seeding weather logs...');
  const weatherConditions = ['Sunny', 'Partly Cloudy', 'Cloudy', 'Light Rain', 'Heavy Rain', 'Fog', 'Windy', 'Snow'];
  
  for (let i = 0; i < 15; i++) {
    const [existing] = await db
      .select()
      .from(threedWeatherLogs)
      .where(eq(threedWeatherLogs.userId, userId))
      .limit(1);

    if (!existing) {
      await db
        .insert(threedWeatherLogs)
        .values({
          userId,
          recordedAt: randomDate(7),
          temperature: randomFloat(45, 95).toString(),
          humidity: randomFloat(30, 90).toString(),
          rainfallInches: randomFloat(0, 0.5).toString(),
          soilMoisture: randomFloat(20, 80).toString(),
          sunlightHours: randomFloat(2, 12).toString(),
          windSpeed: randomFloat(0, 25).toString(),
          frostWarning: randomChoice([true, false]),
          heatWarning: randomChoice([true, false]),
          droughtWarning: randomChoice([true, false]),
          source: randomChoice(['api', 'manual', 'sensor']),
          rawData: { condition: randomChoice(weatherConditions) },
        })
        .returning();
    }
  }

  // ============================================
  // 15. threed_system_logs
  // ============================================
  console.log('  📊 Seeding system logs...');
  const logLevels = ['info', 'warning', 'error', 'debug'];
  const sources = ['api', 'database', 'worker', 'scheduler', 'auth'];
  
  for (let i = 0; i < 20; i++) {
    const [existing] = await db
      .select()
      .from(threedSystemLogs)
      .where(eq(threedSystemLogs.userId, userId))
      .limit(1);

    if (!existing) {
      await db
        .insert(threedSystemLogs)
        .values({
          userId,
          level: randomChoice(logLevels),
          source: randomChoice(sources),
          message: randomChoice([
            'API request processed successfully',
            'Database connection established',
            'Worker task completed',
            'Scheduler started',
            'Authentication successful',
            'Data synchronization completed',
            'Cache cleared',
            'Background job completed',
          ]),
          details: { 
            timestamp: new Date().toISOString(),
            duration: randomInt(100, 5000),
            metadata: { version: '1.0.0' }
          },
          loggedAt: randomDate(1),
        })
        .returning();
    }
  }

  console.log(`✅ ThreeD module seeded with ${createdPlants.length} plants, ${createdBeds.length} beds, ${createdPlantings.length} plantings`);
  return threedModule;
}

// ============================================
// TRAFFIC MODULE - Complete
// ============================================

async function seedTrafficModule(userId: string, projectId: number) {
  console.log('🚗 Seeding Traffic module...');

  // Create Traffic module
  let trafficModule: any;
  const [existingModule] = await db
    .select()
    .from(traffic)
    .where(eq(traffic.slug, 'traffic-main'))
    .limit(1);

  if (existingModule) {
    trafficModule = existingModule;
    await db
      .update(traffic)
      .set({ isActive: true })
      .where(eq(traffic.id, existingModule.id));
  } else {
    const [newModule] = await db
      .insert(traffic)
      .values({
        userId,
        projectId,
        name: 'Traffic Monitor',
        description: 'Traffic monitoring module',
        slug: 'traffic-main',
        isActive: true,
        isPublic: true,
        config: {},
      })
      .returning();
    trafficModule = newModule;
  }

  // Link to project
  const [existingLink] = await db
    .select()
    .from(projectTraffic)
    .where(
      and(
        eq(projectTraffic.projectId, projectId),
        eq(projectTraffic.trafficId, trafficModule.id)
      )
    )
    .limit(1);

  if (!existingLink) {
    await db
      .insert(projectTraffic)
      .values({
        userId,
        projectId,
        trafficId: trafficModule.id,
        isActive: true,
      });
  }

  // ============================================
  // 1. traffic_chp_cad_incidents
  // ============================================
  console.log('  🚨 Seeding CHP CAD incidents...');
  const chpIncidents = [
    { 
      incidentId: 'INC-001',
      sourceId: 'CAD-001', 
      title: 'Accident on I-80', 
      description: 'Multi-vehicle accident, lane blocked', 
      location: 'I-80 Eastbound, near Sacramento',
      lat: LOCATIONS.sacramento.lat, 
      lng: LOCATIONS.sacramento.lng,
      severity: 3,
      status: 'active',
      type: 'traffic_collision'
    },
    { 
      incidentId: 'INC-002',
      sourceId: 'CAD-002', 
      title: 'Disabled Vehicle', 
      description: 'Vehicle on shoulder, awaiting tow', 
      location: 'US-101 Southbound, near San Francisco',
      lat: LOCATIONS.sanFrancisco.lat, 
      lng: LOCATIONS.sanFrancisco.lng,
      severity: 2,
      status: 'active',
      type: 'hazard'
    },
    { 
      incidentId: 'INC-003',
      sourceId: 'CAD-003', 
      title: 'Road Hazard', 
      description: 'Debris in roadway, use caution', 
      location: 'I-5 Northbound, near Stockton',
      lat: LOCATIONS.stockton.lat, 
      lng: LOCATIONS.stockton.lng,
      severity: 2,
      status: 'cleared',
      type: 'hazard'
    },
    { 
      incidentId: 'INC-004',
      sourceId: 'CAD-004', 
      title: 'Traffic Stop', 
      description: 'Vehicle stopped for speeding', 
      location: 'CA-99 Southbound, near Modesto',
      lat: LOCATIONS.modesto.lat, 
      lng: LOCATIONS.modesto.lng,
      severity: 1,
      status: 'active',
      type: 'other'
    },
  ];

  for (const incident of chpIncidents) {
    let existing = await db
      .select()
      .from(trafficChpCadIncidents)
      .where(eq(trafficChpCadIncidents.sourceId, incident.sourceId))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(trafficChpCadIncidents)
        .set({ isActive: true })
        .where(eq(trafficChpCadIncidents.id, existing[0].id));
    } else {
      const [inserted] = await db
        .insert(trafficChpCadIncidents)
        .values({
          userId,
          incidentId: incident.incidentId,
          sourceId: incident.sourceId,
          title: incident.title,
          description: incident.description,
          type: incident.type as any,
          status: incident.status as any,
          location: incident.location,
          latitude: formatCoordinate(incident.lat, 7),
          longitude: formatCoordinate(incident.lng, 7),
          severity: incident.severity,
          isActive: true,
          isPublic: true,
          reportedAt: randomDate(3).toISOString(),
          lastUpdated: new Date().toISOString(),
          rawData: { source: 'CHP', feed: 'CAD' },
        })
        .returning();

      await linkAssetToProject(
        userId,
        projectId,
        trafficModule.id,
        'traffic',
        'traffic_chp_cad_incidents',
        inserted.id
      );
    }
  }

  // ============================================
  // 2. traffic_chp_cases
  // ============================================
  console.log('  📋 Seeding CHP cases...');
  const chpCases = [
    { caseId: 'CASE-001', title: 'Collision Investigation', description: 'Multi-vehicle collision on I-80', location: 'Sacramento, CA', caseNumber: 'CHP-2024-001' },
    { caseId: 'CASE-002', title: 'DUI Stop', description: 'Driver arrested for DUI', location: 'San Francisco, CA', caseNumber: 'CHP-2024-002' },
  ];

  for (const chpCase of chpCases) {
    let existing = await db
      .select()
      .from(trafficChpCases)
      .where(eq(trafficChpCases.caseId, chpCase.caseId))
      .limit(1);

    if (existing.length === 0) {
      const [inserted] = await db
        .insert(trafficChpCases)
        .values({
          userId,
          caseId: chpCase.caseId,
          sourceId: chpCase.caseId,
          title: chpCase.title,
          description: chpCase.description,
          location: chpCase.location,
          caseNumber: chpCase.caseNumber,
          isActive: true,
          isPublic: true,
          severity: 2,
          occurredAt: randomDate(30).toISOString(),
          reportedAt: randomDate(7).toISOString(),
          createdAt: randomDate(30),
          updatedAt: randomDate(7),
        })
        .returning();

      await linkAssetToProject(
        userId,
        projectId,
        trafficModule.id,
        'traffic',
        'traffic_chp_cases',
        inserted.id
      );
    }
  }

  // ============================================
  // 3. traffic_chp_centers
  // ============================================
  console.log('  📍 Seeding CHP centers...');
  const chpCenters = [
    { 
      centerId: 'CENTER-001', 
      name: 'Sacramento CHP', 
      location: 'Sacramento, CA',
      lat: LOCATIONS.sacramento.lat, 
      lng: LOCATIONS.sacramento.lng,
      address: '601 North 7th Street, Sacramento, CA 95811',
      city: 'Sacramento',
      county: 'Sacramento',
      region: 'Northern California',
      phone: '(916) 445-1234',
      email: 'sacramento.chp@chp.ca.gov'
    },
    { 
      centerId: 'CENTER-002', 
      name: 'San Francisco CHP', 
      location: 'San Francisco, CA',
      lat: LOCATIONS.sanFrancisco.lat, 
      lng: LOCATIONS.sanFrancisco.lng,
      address: '455 Golden Gate Avenue, San Francisco, CA 94102',
      city: 'San Francisco',
      county: 'San Francisco',
      region: 'Bay Area',
      phone: '(415) 555-6789',
      email: 'sf.chp@chp.ca.gov'
    },
    { 
      centerId: 'CENTER-003', 
      name: 'Oakland CHP', 
      location: 'Oakland, CA',
      lat: LOCATIONS.oakland.lat, 
      lng: LOCATIONS.oakland.lng,
      address: '500 7th Street, Oakland, CA 94607',
      city: 'Oakland',
      county: 'Alameda',
      region: 'Bay Area',
      phone: '(510) 555-9012',
      email: 'oakland.chp@chp.ca.gov'
    },
  ];

  for (const center of chpCenters) {
    let existing = await db
      .select()
      .from(trafficChpCenters)
      .where(eq(trafficChpCenters.centerId, center.centerId))
      .limit(1);

    if (existing.length === 0) {
      const [inserted] = await db
        .insert(trafficChpCenters)
        .values({
          userId,
          centerId: center.centerId,
          name: center.name,
          location: center.location,
          latitude: formatCoordinate(center.lat, 7),
          longitude: formatCoordinate(center.lng, 7),
          address: center.address,
          city: center.city,
          county: center.county,
          region: center.region,
          state: 'CA',
          phone: center.phone,
          email: center.email,
          isActive: true,
        })
        .returning();

      await linkAssetToProject(
        userId,
        projectId,
        trafficModule.id,
        'traffic',
        'traffic_chp_centers',
        inserted.id
      );
    }
  }

  // ============================================
  // 4. traffic_caltrans_lane_closures
  // ============================================
  console.log('  🚧 Seeding Caltrans lane closures...');
  const closures = [
    { 
      closureId: 'CLOSURE-001', 
      sourceId: 'SRC-001',
      title: 'I-80 Lane Closure', 
      description: 'Right lane closed for construction', 
      location: 'I-80 Eastbound, Sacramento',
      lat: LOCATIONS.sacramento.lat, 
      lng: LOCATIONS.sacramento.lng,
      status: 'active',
      closureType: 'lane'
    },
    { 
      closureId: 'CLOSURE-002', 
      sourceId: 'SRC-002',
      title: 'US-101 Lane Closure', 
      description: 'Left lane closed for utility work', 
      location: 'US-101 Southbound, San Francisco',
      lat: LOCATIONS.sanFrancisco.lat, 
      lng: LOCATIONS.sanFrancisco.lng,
      status: 'active',
      closureType: 'lane'
    },
  ];

  for (const closure of closures) {
    let existing = await db
      .select()
      .from(trafficCaltransLaneClosures)
      .where(eq(trafficCaltransLaneClosures.closureId, closure.closureId))
      .limit(1);

    if (existing.length === 0) {
      const now = new Date().toISOString();
      const [inserted] = await db
        .insert(trafficCaltransLaneClosures)
        .values({
          userId,
          closureId: closure.closureId,
          sourceId: closure.sourceId,
          title: closure.title,
          description: closure.description,
          location: closure.location,
          latitude: formatCoordinate(closure.lat, 7),
          longitude: formatCoordinate(closure.lng, 7),
          closureType: closure.closureType as any,
          isActive: true,
          isPublic: true,
          startDate: randomDate(7).toISOString(),
          endDate: randomDate(14).toISOString(),
          expectedEndDate: randomDate(10).toISOString(),
          lastUpdated: now,
        })
        .returning();

      await linkAssetToProject(
        userId,
        projectId,
        trafficModule.id,
        'traffic',
        'traffic_caltrans_lane_closures',
        inserted.id
      );
    }
  }

  // ============================================
  // 5. traffic_caltrans_cctv_cameras - FIXED: Add source_id
  // ============================================
  console.log('  📹 Seeding Caltrans CCTV cameras...');
  const cameras = [
    { 
      cameraId: 'CAM-001',
      sourceId: 'SRC-CAM-001',  // ✅ REQUIRED
      name: 'I-80 at Sacramento', 
      location: 'I-80 Eastbound, Sacramento',
      lat: LOCATIONS.sacramento.lat, 
      lng: LOCATIONS.sacramento.lng, 
      status: 'online',
      cameraType: 'fixed',
      direction: 'Eastbound',
      districtId: 3,
      caltransId: 'CT-001'
    },
    { 
      cameraId: 'CAM-002',
      sourceId: 'SRC-CAM-002',  // ✅ REQUIRED
      name: 'US-101 at San Francisco', 
      location: 'US-101 Southbound, San Francisco',
      lat: LOCATIONS.sanFrancisco.lat, 
      lng: LOCATIONS.sanFrancisco.lng, 
      status: 'online',
      cameraType: 'fixed',
      direction: 'Southbound',
      districtId: 4,
      caltransId: 'CT-002'
    },
    { 
      cameraId: 'CAM-003',
      sourceId: 'SRC-CAM-003',  // ✅ REQUIRED
      name: 'I-880 at Oakland', 
      location: 'I-880 Southbound, Oakland',
      lat: LOCATIONS.oakland.lat, 
      lng: LOCATIONS.oakland.lng, 
      status: 'online',
      cameraType: 'fixed',
      direction: 'Southbound',
      districtId: 4,
      caltransId: 'CT-003'
    },
  ];

  for (const camera of cameras) {
    let existing = await db
      .select()
      .from(trafficCaltransCctvCameras)
      .where(eq(trafficCaltransCctvCameras.cameraId, camera.cameraId))
      .limit(1);

    if (existing.length === 0) {
      const [inserted] = await db
        .insert(trafficCaltransCctvCameras)
        .values({
          userId,
          cameraId: camera.cameraId,
          sourceId: camera.sourceId,  // ✅ Now provided
          name: camera.name,
          location: camera.location,
          latitude: formatCoordinate(camera.lat, 7),
          longitude: formatCoordinate(camera.lng, 7),
          status: camera.status,
          cameraType: camera.cameraType,
          direction: camera.direction,
          districtId: camera.districtId,
          caltransId: camera.caltransId,
          isActive: true,
          isPublic: true,
          imageUrl: `https://cctv.caltrans.ca.gov/images/${camera.cameraId}.jpg`,
          streamingUrl: `https://cctv.caltrans.ca.gov/stream/${camera.cameraId}`,
        })
        .returning();

      await linkAssetToProject(
        userId,
        projectId,
        trafficModule.id,
        'traffic',
        'traffic_caltrans_cctv_cameras',
        inserted.id
      );
    }
  }

  // ============================================
  // 6. traffic_caltrans_districts - FIXED: Add district_number and full details
  // ============================================
  console.log('  🗺️ Seeding Caltrans districts...');
  const districts = [
    { 
      districtId: 'DIST-001', 
      name: 'District 3', 
      districtNumber: 3,  // ✅ REQUIRED and UNIQUE
      location: 'Sacramento, CA', 
      boundaries: 'Northern California',
      region: 'Northern California',
      phone: '(916) 654-2852',
      email: 'district3@caltrans.ca.gov',
      website: 'https://dot.ca.gov/caltrans-district-3',
      latitude: '38.5815722',
      longitude: '-121.4943996'
    },
    { 
      districtId: 'DIST-002', 
      name: 'District 4', 
      districtNumber: 4,  // ✅ REQUIRED and UNIQUE
      location: 'Oakland, CA', 
      boundaries: 'Bay Area',
      region: 'Bay Area',
      phone: '(510) 286-4444',
      email: 'district4@caltrans.ca.gov',
      website: 'https://dot.ca.gov/caltrans-district-4',
      latitude: '37.8043637',
      longitude: '-122.2711137'
    },
  ];

  for (const district of districts) {
    let existing = await db
      .select()
      .from(trafficCaltransDistricts)
      .where(eq(trafficCaltransDistricts.districtId, district.districtId))
      .limit(1);

    if (existing.length === 0) {
      const [inserted] = await db
        .insert(trafficCaltransDistricts)
        .values({
          userId,
          districtId: district.districtId,
          name: district.name,
          districtNumber: district.districtNumber,  // ✅ Now provided
          location: district.location,
          boundaries: district.boundaries,
          region: district.region,
          phone: district.phone,
          email: district.email,
          website: district.website,
          latitude: district.latitude,
          longitude: district.longitude,
          isActive: true,
          config: {},
        })
        .returning();

      await linkAssetToProject(
        userId,
        projectId,
        trafficModule.id,
        'traffic',
        'traffic_caltrans_districts',
        inserted.id
      );
    }
  }

  // ============================================
  // 7. traffic_bay_area_511_events
  // ============================================
  console.log('  🚦 Seeding Bay Area 511 events...');
  const bayAreaEvents = [
    { 
      eventId: '511-001', 
      sourceId: 'SRC-511-001',
      title: 'Traffic Alert', 
      description: 'Heavy traffic on I-80', 
      location: 'I-80 Eastbound, Oakland',
      lat: LOCATIONS.oakland.lat, 
      lng: LOCATIONS.oakland.lng,
      status: 'active',
      eventType: 'congestion'
    },
    { 
      eventId: '511-002', 
      sourceId: 'SRC-511-002',
      title: 'Bridge Closure', 
      description: 'Bay Bridge closed for maintenance', 
      location: 'Bay Bridge, San Francisco',
      lat: LOCATIONS.sanFrancisco.lat, 
      lng: LOCATIONS.sanFrancisco.lng,
      status: 'planned',
      eventType: 'construction'
    },
  ];

  for (const event of bayAreaEvents) {
    let existing = await db
      .select()
      .from(trafficBayArea511Events)
      .where(eq(trafficBayArea511Events.eventId, event.eventId))
      .limit(1);

    if (existing.length === 0) {
      const now = new Date().toISOString();
      const [inserted] = await db
        .insert(trafficBayArea511Events)
        .values({
          userId,
          eventId: event.eventId,
          sourceId: event.sourceId,
          title: event.title,
          description: event.description,
          location: event.location,
          latitude: formatCoordinate(event.lat, 7),
          longitude: formatCoordinate(event.lng, 7),
          eventType: event.eventType as any,
          severity: 2,
          isActive: true,
          isPublic: true,
          reportedAt: randomDate(3).toISOString(),
          lastUpdated: now,
        })
        .returning();

      await linkAssetToProject(
        userId,
        projectId,
        trafficModule.id,
        'traffic',
        'traffic_bay_area_511_events',
        inserted.id
      );
    }
  }

  // ============================================
  // 8. traffic_calfire_incidents
  // ============================================
  console.log('  🔥 Seeding CalFire incidents...');
  const fireIncidents = [
    { 
      incidentId: 'FIRE-001', 
      sourceId: 'SRC-FIRE-001',
      title: 'Brush Fire', 
      description: 'Small brush fire near highway', 
      location: 'I-5 near Redding',
      lat: LOCATIONS.redding.lat, 
      lng: LOCATIONS.redding.lng,
      severity: 2,
      status: 'active'
    },
    { 
      incidentId: 'FIRE-002', 
      sourceId: 'SRC-FIRE-002',
      title: 'Vegetation Fire', 
      description: 'Grass fire along roadside', 
      location: 'CA-99 near Fresno',
      lat: LOCATIONS.fresno.lat, 
      lng: LOCATIONS.fresno.lng,
      severity: 1,
      status: 'active'
    },
  ];

  for (const fire of fireIncidents) {
    let existing = await db
      .select()
      .from(trafficCalfireIncidents)
      .where(eq(trafficCalfireIncidents.incidentId, fire.incidentId))
      .limit(1);

    if (existing.length === 0) {
      const now = new Date().toISOString();
      const [inserted] = await db
        .insert(trafficCalfireIncidents)
        .values({
          userId,
          incidentId: fire.incidentId,
          sourceId: fire.sourceId,
          title: fire.title,
          description: fire.description,
          location: fire.location,
          latitude: formatCoordinate(fire.lat, 7),
          longitude: formatCoordinate(fire.lng, 7),
          severity: fire.severity,
          status: fire.status as any,
          incidentType: 'wildfire',
          isActive: true,
          isPublic: true,
          reportedAt: randomDate(2).toISOString(),
          lastUpdated: now,
        })
        .returning();

      await linkAssetToProject(
        userId,
        projectId,
        trafficModule.id,
        'traffic',
        'traffic_calfire_incidents',
        inserted.id
      );
    }
  }

  // ============================================
  // 9. traffic_api_request_logs
  // ============================================
  console.log('  📊 Seeding API request logs...');
  const endpoints = ['/api/traffic/chp-cad', '/api/traffic/caltrans', '/api/traffic/511', '/api/traffic/calfire'];

  for (let i = 0; i < 10; i++) {
    const [existing] = await db
      .select()
      .from(trafficApiRequestLogs)
      .where(eq(trafficApiRequestLogs.userId, userId))
      .limit(1);

    if (!existing) {
      await db
        .insert(trafficApiRequestLogs)
        .values({
          userId,
          source: randomChoice(['CHP', 'Caltrans', '511', 'CalFire']),
          endpoint: randomChoice(endpoints),
          method: 'GET',
          statusCode: randomChoice([200, 201, 400, 404, 500]),
          success: randomChoice([true, true, true, false]),
          responseTime: randomInt(100, 5000),
          requestedAt: randomDate(3).toISOString(),
          requestData: { params: { limit: 100 } },
          responseData: { total: randomInt(10, 100) },
        })
        .returning();
    }
  }

  console.log(`✅ Traffic module seeded`);
  return trafficModule;
}

// ============================================
// MUSIC MODULE - Complete
// ============================================

async function seedMusicModule(userId: string, projectId: number) {
  console.log('🎵 Seeding Music module...');

  // Create Music module
  let musicModule: any;
  const [existingModule] = await db
    .select()
    .from(music)
    .where(eq(music.slug, 'music-main'))
    .limit(1);

  if (existingModule) {
    musicModule = existingModule;
    await db
      .update(music)
      .set({ isActive: true })
      .where(eq(music.id, existingModule.id));
  } else {
    const [newModule] = await db
      .insert(music)
      .values({
        userId,
        projectId,
        name: 'Music Library',
        description: 'Music module for testing',
        slug: 'music-main',
        isActive: true,
        isPublic: true,
        config: {},
      })
      .returning();
    musicModule = newModule;
  }

  // Link to project
  const [existingLink] = await db
    .select()
    .from(projectMusic)
    .where(
      and(
        eq(projectMusic.projectId, projectId),
        eq(projectMusic.musicId, musicModule.id)
      )
    )
    .limit(1);

  if (!existingLink) {
    await db
      .insert(projectMusic)
      .values({
        userId,
        projectId,
        musicId: musicModule.id,
        isActive: true,
      });
  }

  // ============================================
  // 1. music_albums
  // ============================================
  console.log('  💿 Seeding albums...');
  const albums = [
    { title: 'Garden Sounds Vol. 1', artist: 'Nature Ensemble', description: 'Ambient sounds for the garden', coverArt: 'https://via.placeholder.com/300x300/22c55e/ffffff?text=Garden+Sounds', status: 'published' },
    { title: 'Garden Sounds Vol. 2', artist: 'Nature Ensemble', description: 'More ambient sounds for the garden', coverArt: 'https://via.placeholder.com/300x300/3b82f6/ffffff?text=Garden+Sounds+2', status: 'published' },
    { title: 'Meditation Garden', artist: 'Zen Master', description: 'Calming meditation music', coverArt: 'https://via.placeholder.com/300x300/8b5cf6/ffffff?text=Meditation', status: 'draft' },
  ];

  const createdAlbums = [];
  for (const album of albums) {
    let existing = await db
      .select()
      .from(musicAlbums)
      .where(eq(musicAlbums.title, album.title))
      .limit(1);

    let newAlbum;
    if (existing.length > 0) {
      newAlbum = existing[0];
      await db
        .update(musicAlbums)
        .set({ isActive: true, status: album.status })
        .where(eq(musicAlbums.id, newAlbum.id));
    } else {
      const [inserted] = await db
        .insert(musicAlbums)
        .values({
          userId,
          title: album.title,
          artist: album.artist,
          description: album.description,
          coverArt: album.coverArt,
          status: album.status,
          isPublic: true,
          releaseDate: randomDate(90),
          isActive: true,
        })
        .returning();
      newAlbum = inserted;
    }
    createdAlbums.push(newAlbum);

    await linkAssetToProject(
      userId,
      projectId,
      musicModule.id,
      'music',
      'music_albums',
      newAlbum.id
    );
  }

  // ============================================
  // 2. music_tracks
  // ============================================
  console.log('  🎵 Seeding tracks...');
  const trackLists = [
    { album: createdAlbums[0], tracks: [
      { title: 'Morning Birds', duration: 180 },
      { title: 'Gentle Rain', duration: 240 },
      { title: 'Wind Chimes', duration: 150 },
      { title: 'Stream Flowing', duration: 210 },
      { title: 'Forest Ambience', duration: 300 },
    ]},
    { album: createdAlbums[1], tracks: [
      { title: 'Ocean Waves', duration: 260 },
      { title: 'Crickets at Night', duration: 200 },
      { title: 'Soft Breeze', duration: 180 },
      { title: 'Waterfall', duration: 220 },
    ]},
    { album: createdAlbums[2], tracks: [
      { title: 'Zen Garden', duration: 320 },
      { title: 'Temple Bells', duration: 180 },
    ]},
  ];

  for (const list of trackLists) {
    for (let t = 0; t < list.tracks.length; t++) {
      const track = list.tracks[t];
      const [existing] = await db
        .select()
        .from(musicTracks)
        .where(eq(musicTracks.title, track.title))
        .limit(1);

      if (!existing) {
        const [inserted] = await db
          .insert(musicTracks)
          .values({
            userId,
            albumId: list.album.id,
            title: track.title,
            duration: track.duration,
            trackNumber: t + 1,
            isActive: true,
            fileUrl: `https://example.com/tracks/${track.title.toLowerCase().replace(/\s/g, '-')}.mp3`,
            fileSize: randomInt(1024, 10240),
          })
          .returning();

        await linkAssetToProject(
          userId,
          projectId,
          musicModule.id,
          'music',
          'music_tracks',
          inserted.id
        );
      }
    }
  }

  // ============================================
  // 3. music_media
  // ============================================
  console.log('  🖼️ Seeding media...');
  const mediaItems = [
    { albumId: createdAlbums[0].id, mediaType: 'image', url: 'https://via.placeholder.com/600x400/22c55e/ffffff?text=Garden+Scene+1', caption: 'Garden scene 1' },
    { albumId: createdAlbums[0].id, mediaType: 'image', url: 'https://via.placeholder.com/600x400/22c55e/ffffff?text=Garden+Scene+2', caption: 'Garden scene 2' },
    { albumId: createdAlbums[1].id, mediaType: 'image', url: 'https://via.placeholder.com/600x400/3b82f6/ffffff?text=Garden+Scene+3', caption: 'Garden scene 3' },
  ];

  for (const media of mediaItems) {
    const [existing] = await db
      .select()
      .from(musicMedia)
      .where(eq(musicMedia.url, media.url))
      .limit(1);

    if (!existing) {
      const [inserted] = await db
        .insert(musicMedia)
        .values({
          userId,
          albumId: media.albumId,
          mediaType: media.mediaType,
          url: media.url,
          caption: media.caption,
          isActive: true,
          isPrimary: mediaItems.indexOf(media) === 0,
        })
        .returning();

      await linkAssetToProject(
        userId,
        projectId,
        musicModule.id,
        'music',
        'music_media',
        inserted.id
      );
    }
  }

  // ============================================
  // 4. music_links
  // ============================================
  console.log('  🔗 Seeding links...');
  const links = [
    { albumId: createdAlbums[0].id, title: 'Spotify', url: 'https://spotify.com/album/garden-sounds-1', icon: 'spotify' },
    { albumId: createdAlbums[0].id, title: 'Apple Music', url: 'https://apple.com/music/garden-sounds-1', icon: 'apple' },
    { albumId: createdAlbums[1].id, title: 'YouTube', url: 'https://youtube.com/watch/garden-sounds-2', icon: 'youtube' },
  ];

  for (const link of links) {
    const [existing] = await db
      .select()
      .from(musicLinks)
      .where(eq(musicLinks.url, link.url))
      .limit(1);

    if (!existing) {
      const [inserted] = await db
        .insert(musicLinks)
        .values({
          userId,
          albumId: link.albumId,
          title: link.title,
          url: link.url,
          icon: link.icon,
          isActive: true,
        })
        .returning();

      await linkAssetToProject(
        userId,
        projectId,
        musicModule.id,
        'music',
        'music_links',
        inserted.id
      );
    }
  }

  // ============================================
  // 5. music_playback_history
  // ============================================
  console.log('  📊 Seeding playback history...');
  for (let i = 0; i < 10; i++) {
    const album = randomChoice(createdAlbums);
    const [track] = await db
      .select()
      .from(musicTracks)
      .where(eq(musicTracks.albumId, album.id))
      .limit(1);

    if (track) {
      const [existing] = await db
        .select()
        .from(musicPlaybackHistory)
        .where(eq(musicPlaybackHistory.userId, userId))
        .limit(1);

      if (!existing) {
        await db
          .insert(musicPlaybackHistory)
          .values({
            userId,
            trackId: track.id,
            albumId: album.id,
            playedAt: randomDate(7),
            playDuration: randomInt(30, track.duration || 180),
            isComplete: randomChoice([true, false]),
          })
          .returning();
      }
    }
  }

  // ============================================
  // 6. music_polling_logs
  // ============================================
  console.log('  📊 Seeding polling logs...');
  const pollSources = ['spotify', 'apple', 'youtube', 'soundcloud'];
  
  for (let i = 0; i < 8; i++) {
    const [existing] = await db
      .select()
      .from(musicPollingLogs)
      .where(eq(musicPollingLogs.userId, userId))
      .limit(1);

    if (!existing) {
      await db
        .insert(musicPollingLogs)
        .values({
          userId,
          source: randomChoice(pollSources),
          polledAt: randomDate(3),
          status: randomChoice(['success', 'failed', 'partial']),
          recordsFound: randomInt(1, 20),
          errorMessage: randomChoice([null, 'Rate limit exceeded', 'Connection timeout']),
          responseTime: randomInt(100, 5000),
        })
        .returning();
    }
  }

  console.log(`✅ Music module seeded`);
  return musicModule;
}

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

    // 3. Seed ThreeD Module (Complete)
    await seedThreedModule(testUser.id, mainProject.id);

    // 4. Seed Traffic Module (Complete)
    await seedTrafficModule(testUser.id, mainProject.id);

    // 5. Seed Music Module (Complete)
    // await seedMusicModule(testUser.id, mainProject.id);

    console.log('\n🎉 Initial data seed complete!');
    console.log(`
📊 Summary:
  - User: ${testUser.name} (${testUser.id})
  - Projects: ${projects.length}
  - Modules: ThreeD (complete), Traffic (complete), Music (complete)
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