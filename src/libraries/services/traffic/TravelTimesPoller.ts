// services/TravelTimesPoller.ts
import axios from 'axios';

// Districts with Travel Time data: 3, 8, 11, 12 [citation:2]
const TRAVEL_TIME_DISTRICTS = [3, 8, 11, 12];

export class TravelTimesPoller {
  async fetchTravelTimes(district: number) {
    const url = `https://cwwp2.dot.ca.gov/data/d${district}/tt/ttStatusD${district.toString().padStart(2, '0')}.json`;
    const response = await axios.get(url);
    
    // Travel times include segment speed, travel time, and congestion level
    return response.data.travelTimes || [];
  }
}
