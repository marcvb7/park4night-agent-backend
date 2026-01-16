import axios from 'axios';

// Park4Night API response type
export interface Park4NightPlace {
  id: string;
  titre: string; // The actual name field in the API
  name?: string;
  description_fr?: string;
  description_en?: string;
  description?: string;
  latitude: string | number;
  longitude: string | number;
  adresse?: string;
  [key: string]: any; // For other fields we might not use
}

// Our standardized place format
export interface Place {
  id?: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  address?: string;
  url?: string;
}

// Nominatim geocoding response
interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

/**
 * Step 2: Geocode a city name to coordinates using Nominatim (OpenStreetMap)
 */
export async function geocodeCity(cityName: string): Promise<{ lat: number; lon: number } | null> {
  try {
    console.log(`🌍 Geocoding: "${cityName}"`);

    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: cityName,
        format: 'json',
        limit: 1
      },
      headers: {
        'User-Agent': 'Park4NightAgent/1.0'
      },
      timeout: 10000
    });

    if (response.data && response.data.length > 0) {
      const result: NominatimResult = response.data[0];
      const lat = parseFloat(result.lat);
      const lon = parseFloat(result.lon);

      console.log(`✅ Geocoded "${cityName}" to: ${lat}, ${lon}`);
      console.log(`   Location: ${result.display_name}`);

      return { lat, lon };
    } else {
      console.log(`❌ No geocoding results for "${cityName}"`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Geocoding error for "${cityName}":`, error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * Step 3: Fetch places from Park4Night API using coordinates
 */
export async function fetchPark4NightPlaces(lat: number, lon: number, limit: number = 10): Promise<Place[]> {
  try {
    console.log(`🚀 Calling Park4Night API for coordinates: ${lat}, ${lon}`);

    const response = await axios.get('https://guest.park4night.com/services/V4.1/lieuxGetFilter.php', {
      params: {
        latitude: lat,
        longitude: lon
      },
      timeout: 15000
    });

    if (!response.data) {
      console.log('❌ No data returned from Park4Night API');
      return [];
    }

    // The API might return an object with a places array, or directly an array
    // We'll handle both cases
    let places: Park4NightPlace[] = [];

    if (Array.isArray(response.data)) {
      places = response.data;
    } else if (response.data.lieux) {
      places = response.data.lieux;
    } else if (response.data.places) {
      places = response.data.places;
    } else {
      console.log('⚠️ Unexpected API response format:', Object.keys(response.data));
      places = [];
    }

    console.log(`✅ Park4Night API returned ${places.length} places`);

    // Map to our format and limit results
    const mappedPlaces: Place[] = places.slice(0, limit).map(p => ({
      id: p.id || String(p.id),
      name: p.titre || p.name || 'Unknown place',
      description: p.description_en || p.description_fr || p.description || 'No description available',
      latitude: parseFloat(String(p.latitude)),
      longitude: parseFloat(String(p.longitude)),
      address: p.adresse || p.address || undefined,
      url: p.id ? `https://park4night.com/en/place/${p.id}` : undefined
    }));

    return mappedPlaces;

  } catch (error) {
    console.error('❌ Park4Night API error:', error instanceof Error ? error.message : error);
    return [];
  }
}

/**
 * Complete flow: Geocode city name and fetch places from Park4Night
 */
export async function fetchPlacesByCity(cityName: string, limit: number = 10): Promise<Place[]> {
  console.log(`\n🔍 Fetching places for city: "${cityName}"`);

  // Step 2: Geocode
  const coords = await geocodeCity(cityName);
  if (!coords) {
    console.log('❌ Cannot proceed without coordinates');
    return [];
  }

  // Step 3: Fetch from Park4Night API
  const places = await fetchPark4NightPlaces(coords.lat, coords.lon, limit);

  console.log(`✅ Found ${places.length} places for "${cityName}"`);

  return places;
}
