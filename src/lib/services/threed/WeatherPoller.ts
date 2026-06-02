// src/lib/services/threed/WeatherPoller.ts
import { db } from '@/lib/db/client';
import { threedWeatherLogs } from '@/lib/auth/schema';
import { desc, sql } from 'drizzle-orm';

export class WeatherPoller {
  private pollingActive = false;
  private lastPollTime: Date | null = null;
  private lastPollStats: any = null;
  
  // OpenWeatherMap API key (you'll need to add this to your .env)
  private apiKey: string;
  
  constructor() {
    this.apiKey = process.env.OPENWEATHER_API_KEY || '';
    if (!this.apiKey) {
      console.warn('OPENWEATHER_API_KEY not set in environment variables');
    }
  }
  
  // Fetch current weather for your garden location
  async fetchCurrentWeather(lat: number = 39.3, lon: number = -123.5): Promise<any> {
    if (!this.apiKey) {
      console.error('Cannot fetch weather: No API key');
      return null;
    }
    
    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${this.apiKey}`;
      console.log(`[${new Date().toISOString()}] Fetching current weather...`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      // Transform OpenWeatherMap data to your schema
      return {
        temperature: data.main?.temp || null,
        humidity: data.main?.humidity || null,
        windSpeed: data.wind?.speed || null,
        rainfallInches: data.rain?.['1h'] ? data.rain['1h'] / 25.4 : 0, // mm to inches
        recordedAt: new Date(),
        source: 'openweathermap',
        rawData: data,
      };
      
    } catch (error) {
      console.error('Weather API error:', error);
      return null;
    }
  }
  
  // Fetch forecast data
  async fetchForecast(lat: number = 39.3, lon: number = -123.5): Promise<any[]> {
    if (!this.apiKey) {
      console.error('Cannot fetch forecast: No API key');
      return [];
    }
    
    try {
      const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=imperial&appid=${this.apiKey}`;
      console.log(`[${new Date().toISOString()}] Fetching weather forecast...`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      const forecasts = [];
      for (const item of data.list || []) {
        forecasts.push({
          temperature: item.main?.temp || null,
          humidity: item.main?.humidity || null,
          rainfallInches: item.rain?.['3h'] ? item.rain['3h'] / 25.4 : 0,
          recordedAt: new Date(item.dt * 1000),
          source: 'openweathermap',
          rawData: item,
        });
      }
      
      return forecasts;
      
    } catch (error) {
      console.error('Forecast API error:', error);
      return [];
    }
  }
  
  // Save weather data to database
  async saveWeatherData(weatherData: any): Promise<boolean> {
    try {
      await db.insert(threedWeatherLogs).values({
        temperature: weatherData.temperature,
        humidity: weatherData.humidity,
        rainfallInches: weatherData.rainfallInches,
        windSpeed: weatherData.windSpeed,
        recordedAt: weatherData.recordedAt,
        frostWarning: weatherData.temperature < 32,
        heatWarning: weatherData.temperature > 90,
        droughtWarning: weatherData.rainfallInches === 0 && weatherData.temperature > 80,
        source: weatherData.source || 'api',
        rawData: weatherData.rawData,
        createdAt: new Date(),
      });
      return true;
    } catch (error) {
      console.error('Error saving weather data:', error);
      return false;
    }
  }
  
  // Poll current weather
  async pollCurrentWeather(): Promise<{ success: boolean; stats?: any; error?: string }> {
    if (this.pollingActive) {
      return { success: false, error: 'Polling already in progress' };
    }
    
    this.pollingActive = true;
    const startTime = Date.now();
    
    try {
      console.log(`\n🌤️ Starting Weather poll at ${new Date().toISOString()}`);
      
      const weatherData = await this.fetchCurrentWeather();
      
      if (!weatherData) {
        return { success: false, error: 'Failed to fetch weather data' };
      }
      
      const saved = await this.saveWeatherData(weatherData);
      
      const duration = Date.now() - startTime;
      this.lastPollTime = new Date();
      this.lastPollStats = { 
        saved: saved,
        temperature: weatherData.temperature,
        duration,
      };
      
      console.log(`✅ Weather poll complete: ${saved ? 'Data saved' : 'Save failed'}`);
      console.log(`  Temperature: ${weatherData.temperature}°F, Humidity: ${weatherData.humidity}%`);
      
      return {
        success: saved,
        stats: this.lastPollStats,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Weather polling error:', error);
      return { success: false, error: String(error) };
    } finally {
      this.pollingActive = false;
    }
  }
  
  async getStats() {
    const total = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(threedWeatherLogs);
    
    const avgTemp = await db
      .select({ avg: sql<number>`AVG(${threedWeatherLogs.temperature})` })
      .from(threedWeatherLogs);
    
    const avgHumidity = await db
      .select({ avg: sql<number>`AVG(${threedWeatherLogs.humidity})` })
      .from(threedWeatherLogs);
    
    const frostDays = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(threedWeatherLogs)
      .where(sql`${threedWeatherLogs.frostWarning} = true`);
    
    const heatDays = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(threedWeatherLogs)
      .where(sql`${threedWeatherLogs.heatWarning} = true`);
    
    const recent = await db
      .select()
      .from(threedWeatherLogs)
      .orderBy(desc(threedWeatherLogs.recordedAt))
      .limit(1);
    
    return {
      total: total[0]?.count || 0,
      avgTemperatureF: avgTemp[0]?.avg || 0,
      avgHumidityPercent: avgHumidity[0]?.avg || 0,
      frostDays: frostDays[0]?.count || 0,
      heatDays: heatDays[0]?.count || 0,
      lastReading: recent[0] || null,
      lastPoll: this.lastPollTime,
      lastPollStats: this.lastPollStats
    };
  }
  
  isPollingActive(): boolean {
    return this.pollingActive;
  }
}