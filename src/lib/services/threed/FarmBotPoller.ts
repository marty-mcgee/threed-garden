// src/lib/services/threed/FarmBotPoller.ts
import { db } from '@/lib/db/client';
import { threedFarmbots, threedFarmbotLogs } from '@/lib/schema';
import { eq, desc, sql } from 'drizzle-orm';

export interface FarmBotDevice {
  id: number;
  name: string;
  timezone: string;
  last_seen: string;
  mqtt: string;
  throttled_until: string;
  timezone_offset: string;
}

export interface FarmBotSensor {
  id: number;
  pin: number;
  label: string;
  mode: number;
  value: number;
  unit: string;
}

export interface FarmBotLog {
  id: number;
  type: string;
  message: string;
  created_at: string;
  meta: {
    type: string;
    major_version: number;
    minor_version: number;
    patch_version: number;
  };
}

export class FarmBotPoller {
  private pollingActive = false;
  private lastPollTime: Date | null = null;
  private lastPollStats: any = null;
  private apiToken: string;
  private apiUrl: string;
  private deviceId: string;
  
  constructor() {
    this.apiToken = process.env.FARMBOT_API_TOKEN || '';
    this.apiUrl = process.env.FARMBOT_API_URL || 'https://my.farmbot.io/api';
    this.deviceId = process.env.FARMBOT_DEVICE_ID || '';
    
    if (!this.apiToken) {
      console.warn('⚠️ FARMBOT_API_TOKEN not set in environment variables');
    }
    if (!this.deviceId) {
      console.warn('⚠️ FARMBOT_DEVICE_ID not set in environment variables');
    }
  }
  
  // Make authenticated request to FarmBot API
  private async farmbotFetch(endpoint: string, options: RequestInit = {}): Promise<any> {
    if (!this.apiToken) {
      throw new Error('FarmBot API token not configured');
    }
    
    const url = `${this.apiUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      throw new Error(`FarmBot API error: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }
  
  // Get device info
  async getDeviceInfo(): Promise<FarmBotDevice | null> {
    try {
      console.log(`  📡 Fetching device info...`);
      const data = await this.farmbotFetch(`/devices/${this.deviceId}`);
      return {
        id: data.id,
        name: data.name,
        timezone: data.timezone,
        last_seen: data.last_seen,
        mqtt: data.mqtt,
        throttled_until: data.throttled_until,
        timezone_offset: data.timezone_offset,
      };
    } catch (error) {
      console.error(`  ❌ Error fetching device info:`, error);
      return null;
    }
  }
  
  // Get sensor data
  async getSensorData(): Promise<FarmBotSensor[]> {
    try {
      console.log(`  📡 Fetching sensor data...`);
      const data = await this.farmbotFetch(`/devices/${this.deviceId}/sensors`);
      return data.map((sensor: any) => ({
        id: sensor.id,
        pin: sensor.pin,
        label: sensor.label,
        mode: sensor.mode,
        value: sensor.value,
        unit: sensor.unit || '',
      }));
    } catch (error) {
      console.error(`  ❌ Error fetching sensor data:`, error);
      return [];
    }
  }
  
  // Get point data (plants, weeds, etc.)
  async getPoints(): Promise<any[]> {
    try {
      console.log(`  📡 Fetching points data...`);
      const data = await this.farmbotFetch(`/devices/${this.deviceId}/points`);
      return data;
    } catch (error) {
      console.error(`  ❌ Error fetching points:`, error);
      return [];
    }
  }
  
  // Get recent logs
  async getLogs(limit: number = 50): Promise<FarmBotLog[]> {
    try {
      console.log(`  📡 Fetching recent logs...`);
      const data = await this.farmbotFetch(`/devices/${this.deviceId}/logs?limit=${limit}`);
      return data.map((log: any) => ({
        id: log.id,
        type: log.type,
        message: log.message,
        created_at: log.created_at,
        meta: log.meta,
      }));
    } catch (error) {
      console.error(`  ❌ Error fetching logs:`, error);
      return [];
    }
  }
  
  // Get plant data from FarmBot points
  async getPlants(): Promise<any[]> {
    const points = await this.getPoints();
    return points.filter((point: any) => point.pointer_type === 'Plant');
  }
  
  // Save FarmBot device to database
  async saveDeviceToDatabase(deviceInfo: FarmBotDevice): Promise<void> {
    const existing = await db
      .select()
      .from(threedFarmbots)
      .where(eq(threedFarmbots.deviceId, this.deviceId))
      .limit(1);
    
    const now = new Date();
    const lastSeen = deviceInfo.last_seen ? new Date(deviceInfo.last_seen) : now;
    
    if (existing.length > 0) {
      // Update existing
      await db
        .update(threedFarmbots)
        .set({
          name: deviceInfo.name,
          status: this.determineStatus(lastSeen),
          lastSeen: lastSeen,
          updatedAt: now,
        })
        .where(eq(threedFarmbots.deviceId, this.deviceId));
      console.log(`  ✅ Updated FarmBot device: ${deviceInfo.name}`);
    } else {
      // Insert new
      await db.insert(threedFarmbots).values({
        deviceId: this.deviceId,
        name: deviceInfo.name,
        status: this.determineStatus(lastSeen),
        lastSeen: lastSeen,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      console.log(`  ✅ Added new FarmBot device: ${deviceInfo.name}`);
    }
  }
  
  // Determine status based on last seen time
  private determineStatus(lastSeen: Date): string {
    const now = new Date();
    const minutesSinceLastSeen = (now.getTime() - lastSeen.getTime()) / (1000 * 60);
    
    if (minutesSinceLastSeen < 5) return 'online';
    if (minutesSinceLastSeen < 15) return 'maintenance';
    return 'offline';
  }
  
  // Save sensor readings to logs
  async saveSensorReadings(sensors: FarmBotSensor[]): Promise<void> {
    for (const sensor of sensors) {
      // Check if we have a recent reading (within last hour)
      const recent = await db
        .select()
        .from(threedFarmbotLogs)
        .where(sql`${threedFarmbotLogs.farmbotId} = ${this.deviceId} 
          AND ${threedFarmbotLogs.eventType} = 'sensor' 
          AND ${threedFarmbotLogs.message} LIKE ${`%${sensor.label}%`}
          AND ${threedFarmbotLogs.loggedAt} > NOW() - INTERVAL '1 hour'`)
        .limit(1);
      
      if (recent.length === 0) {
        await db.insert(threedFarmbotLogs).values({
          farmbotId: parseInt(this.deviceId),
          eventType: 'sensor',
          status: 'success',
          message: `${sensor.label}: ${sensor.value} ${sensor.unit}`,
          sensorData: sensor,
          loggedAt: new Date(),
          createdAt: new Date(),
        });
      }
    }
    console.log(`  📊 Saved ${sensors.length} sensor readings`);
  }
  
  // Save logs to database
  async saveLogs(logs: FarmBotLog[]): Promise<void> {
    let newCount = 0;
    
    for (const log of logs) {
      // Check if we already have this log
      const existing = await db
        .select()
        .from(threedFarmbotLogs)
        .where(sql`${threedFarmbotLogs.message} = ${log.message} 
          AND ${threedFarmbotLogs.loggedAt} > NOW() - INTERVAL '1 hour'`)
        .limit(1);
      
      if (existing.length === 0) {
        await db.insert(threedFarmbotLogs).values({
          farmbotId: parseInt(this.deviceId),
          eventType: log.type || 'info',
          status: log.type === 'error' ? 'error' : 'success',
          message: log.message,
          sensorData: log,
          loggedAt: new Date(log.created_at),
          createdAt: new Date(),
        });
        newCount++;
      }
    }
    
    if (newCount > 0) {
      console.log(`  📝 Saved ${newCount} new logs`);
    }
  }
  
  // Sync all FarmBot data
  async syncFarmBot(): Promise<{ success: boolean; stats?: any; error?: string }> {
    if (this.pollingActive) {
      return { success: false, error: 'Polling already in progress' };
    }
    
    this.pollingActive = true;
    const startTime = Date.now();
    
    try {
      console.log(`\n🤖 Starting FarmBot sync at ${new Date().toISOString()}`);
      
      // Fetch all data in parallel
      const [deviceInfo, sensors, logs, plants] = await Promise.all([
        this.getDeviceInfo(),
        this.getSensorData(),
        this.getLogs(100),
        this.getPlants(),
      ]);
      
      if (!deviceInfo) {
        throw new Error('Failed to fetch device info');
      }
      
      // Save to database
      await this.saveDeviceToDatabase(deviceInfo);
      await this.saveSensorReadings(sensors);
      await this.saveLogs(logs);
      
      // Process plants from FarmBot (optional: sync with your plantings table)
      console.log(`  🌱 Found ${plants.length} plants in FarmBot`);
      
      const duration = Date.now() - startTime;
      this.lastPollTime = new Date();
      this.lastPollStats = { 
        deviceName: deviceInfo.name,
        status: this.determineStatus(new Date(deviceInfo.last_seen)),
        sensorsCount: sensors.length,
        logsCount: logs.length,
        plantsCount: plants.length,
        duration,
      };
      
      console.log(`✅ FarmBot sync complete:`);
      console.log(`  Device: ${deviceInfo.name} (${this.lastPollStats.status})`);
      console.log(`  Sensors: ${sensors.length}, Logs: ${logs.length}, Plants: ${plants.length}`);
      
      return {
        success: true,
        stats: this.lastPollStats,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ FarmBot sync error:', error);
      return { success: false, error: String(error) };
    } finally {
      this.pollingActive = false;
    }
  }
  
  // Send a command to FarmBot
  async sendCommand(command: string, args: any = {}): Promise<any> {
    if (!this.apiToken) {
      throw new Error('FarmBot API token not configured');
    }
    
    try {
      console.log(`  📡 Sending command: ${command}`);
      const result = await this.farmbotFetch(`/devices/${this.deviceId}/commands`, {
        method: 'POST',
        body: JSON.stringify({ command, args }),
      });
      console.log(`  ✅ Command sent successfully`);
      return result;
    } catch (error) {
      console.error(`  ❌ Command failed:`, error);
      throw error;
    }
  }
  
  // Water command
  async water(durationMs: number = 60000): Promise<any> {
    return this.sendCommand('water', { duration_ms: durationMs });
  }
  
  // Move to absolute position
  async moveAbsolute(x: number, y: number, z: number): Promise<any> {
    return this.sendCommand('move_absolute', { location: { x, y, z } });
  }
  
  // Move relative
  async moveRelative(x: number, y: number, z: number): Promise<any> {
    return this.sendCommand('move_relative', { x, y, z });
  }
  
  // Take a photo
  async takePhoto(): Promise<any> {
    return this.sendCommand('photo', {});
  }
  
  // Emergency stop
  async emergencyStop(): Promise<any> {
    return this.sendCommand('emergency_stop', {});
  }
  
  // Get current position
  async getCurrentPosition(): Promise<any> {
    return this.sendCommand('get_current_position', {});
  }
  
  // Toggle pin (e.g., turn on/off a peripheral)
  async togglePin(pin: number, value: number): Promise<any> {
    return this.sendCommand('toggle_pin', { pin_number: pin, value });
  }
  
  async getStats() {
    const farmbot = await db
      .select()
      .from(threedFarmbots)
      .where(eq(threedFarmbots.deviceId, this.deviceId))
      .limit(1);
    
    const recentLogs = await db
      .select()
      .from(threedFarmbotLogs)
      .where(sql`${threedFarmbotLogs.farmbotId} = ${this.deviceId}`)
      .orderBy(desc(threedFarmbotLogs.loggedAt))
      .limit(10);
    
    const sensorReadings = await db
      .select()
      .from(threedFarmbotLogs)
      .where(sql`${threedFarmbotLogs.farmbotId} = ${this.deviceId} AND ${threedFarmbotLogs.eventType} = 'sensor'`)
      .orderBy(desc(threedFarmbotLogs.loggedAt))
      .limit(20);
    
    return {
      device: farmbot[0] || null,
      recentLogs,
      sensorReadings,
      lastPoll: this.lastPollTime,
      lastPollStats: this.lastPollStats
    };
  }
  
  isPollingActive(): boolean {
    return this.pollingActive;
  }
}