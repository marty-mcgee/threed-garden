// lib/services/traffic/CaltransCCTVPoller.ts
import axios from 'axios';
import { db } from '@/lib/db/client';
import { trafficCaltransCctvCameras, trafficCaltransDistricts } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export class CaltransCCTVPoller {
  async fetchDistrictCameras(district: number) {
    const url = `https://cwwp2.dot.ca.gov/data/d${district}/cctv/cctv.json`;
    
    try {
      const response = await axios.get(url, { timeout: 15000 });
      
      if (response.data?.cctv) {
        for (const camera of response.data.cctv) {
          await this.upsertCamera(district, camera);
        }
      }
      return { district, count: response.data?.cctv?.length || 0 };
    } catch (error) {
      console.error(`Failed to fetch CCTV for district ${district}:`, error);
      return { district, count: 0, error };
    }
  }

  private async upsertCamera(district: number, camera: any) {
    if (camera.index === undefined || camera.index === null) {
      throw new Error(`Caltrans District ${district} camera is missing an index`);
    }

    const externalCameraId = `d${district}-${String(camera.index)}`;
    const isInService = camera.inService === true || camera.inService === 'true';
    const parseCoordinate = (value: unknown) => {
      const parsed = typeof value === 'number' ? value : parseFloat(String(value));
      return Number.isFinite(parsed) ? String(parsed) : null;
    };

    const [districtRecord] = await db
      .select({ id: trafficCaltransDistricts.id })
      .from(trafficCaltransDistricts)
      .where(eq(trafficCaltransDistricts.districtNumber, district))
      .limit(1);

    const cameraData = {
      cameraId: externalCameraId,
      sourceId: externalCameraId,
      name:
        camera.location?.locationName ||
        camera.location?.nearbyPlace ||
        `Caltrans District ${district} Camera ${String(camera.index)}`,
      description: camera.location?.nearbyPlace || null,
      latitude: parseCoordinate(camera.location?.latitude),
      longitude: parseCoordinate(camera.location?.longitude),
      county: camera.location?.county || null,
      cameraType: 'cctv',
      direction: camera.location?.direction || null,
      imageUrl: camera.imageData?.static?.currentImageURL || null,
      status: isInService ? 'active' : 'inactive',
      districtId: districtRecord?.id || null,
      caltransId: String(camera.index),
      rawData: camera,
      isActive: isInService,
      isPublic: true,
    };

    const existing = await db
      .select()
      .from(trafficCaltransCctvCameras)
      .where(eq(trafficCaltransCctvCameras.cameraId, externalCameraId))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(trafficCaltransCctvCameras)
        .set(cameraData)
        .where(eq(trafficCaltransCctvCameras.cameraId, externalCameraId));
    } else {
      await db.insert(trafficCaltransCctvCameras).values(cameraData);
    }
  }
}
