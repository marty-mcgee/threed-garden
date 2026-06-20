// services/CCTVPoller.ts
import axios from 'axios';
import { db } from '@/lib/db/client';
import { cctvCameras } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export class CCTVPoller {
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
    const cameraData = {
      index: camera.index,
      district,
      locationName: camera.location?.locationName,
      nearbyPlace: camera.location?.nearbyPlace,
      latitude: camera.location?.latitude ? parseFloat(camera.location.latitude) : null,
      longitude: camera.location?.longitude ? parseFloat(camera.location.longitude) : null,
      direction: camera.location?.direction,
      county: camera.location?.county,
      route: camera.location?.route,
      inService: camera.inService === 'true',
      currentImageUrl: camera.imageData?.static?.currentImageURL,
      lastUpdated: new Date(`${camera.recordTimestamp?.recordDate}T${camera.recordTimestamp?.recordTime}`),
      rawData: camera,
    };

    const existing = await db
      .select()
      .from(cctvCameras)
      .where(eq(cctvCameras.index, camera.index))
      .limit(1);

    if (existing.length > 0) {
      await db.update(cctvCameras).set(cameraData).where(eq(cctvCameras.index, camera.index));
    } else {
      await db.insert(cctvCameras).values(cameraData);
    }
  }
}