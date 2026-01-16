import { createTool } from "@mastra/core";
import { z } from "zod";
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fetchPlacesByCity, Place } from '../../services/park4nightAPI.js';

// Carregar variables d'entorn
dotenv.config();

// Configurar Supabase client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';

console.log(`🔧 Park4Night Tool Init: ${supabaseUrl ? '✅ URL OK' : '❌ NO URL'} | ${supabaseKey ? '✅ KEY OK' : '❌ NO KEY'}`);

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Save places to Supabase database
 */
async function savePlacesToDatabase(places: Place[]): Promise<void> {
  console.log(`💾 Saving ${places.length} places to database...`);

  for (const place of places) {
    try {
      const { error } = await supabase
        .from('places')
        .upsert(
          {
            name: place.name,
            latitude: place.latitude,
            longitude: place.longitude,
            url: place.url,
            description: place.description,
            address: place.address
          },
          { onConflict: 'url' }
        );

      if (error) {
        console.error(`❌ Error saving "${place.name}":`, error.message);
      } else {
        console.log(`✅ Saved: ${place.name}`);
      }
    } catch (error) {
      console.error(`❌ Database error for "${place.name}":`, error);
    }
  }
}

/**
 * Format places for response
 */
function formatPlacesResponse(places: any[], location: string): string {
  let response = `He trobat ${places.length} llocs per a "${location}":\n\n`;

  places.forEach((place, index) => {
    response += `${index + 1}. **${place.name}**\n`;
    response += `   📍 ${place.description?.substring(0, 150) || 'Sense descripció'}...\n`;

    if (place.latitude && place.longitude) {
      response += `   🗺️ Coordenades: ${place.latitude}, ${place.longitude}\n`;
    }

    if (place.url) {
      response += `   🔗 Més info: ${place.url}\n`;
    }

    response += '\n';
  });

  return response;
}

export const park4nightTool = createTool({
  label: "Park4Night Search - Smart Fetch",
  schema: z.object({
    location: z.string().describe("Ubicació, paraula clau o tipus de lloc a cercar"),
  }),
  description: "Cerca llocs per aparcar o acampar. Primer busca a la base de dades local. Si no hi ha resultats, usa geocoding i l'API de Park4Night per obtenir dades en temps real i les guarda.",

  executor: async ({ data }) => {
    console.log("================================================");
    console.log(`🔍 LAZY LOADING: Cercant llocs per: "${data.location}"`);
    console.log("================================================");

    try {
      if (!supabaseUrl || !supabaseKey) {
        console.error("❌ Credencials de Supabase no configurades");
        return {
          text: "Error de configuració: No es pot connectar a la base de dades. Contacta amb l'administrador."
        };
      }

      // ============================================
      // STEP 1: DATABASE CHECK (Fast Path)
      // ============================================
      console.log("\n📊 STEP 1: Checking database...");

      const searchTerm = `%${data.location}%`;
      const { data: places, error, count } = await supabase
        .from('places')
        .select('*', { count: 'exact' })
        .or(`name.ilike.${searchTerm},description.ilike.${searchTerm},address.ilike.${searchTerm}`)
        .limit(10);

      if (error) {
        console.error("❌ ERROR SUPABASE:", error);
        return {
          text: `Error consultant la base de dades: ${error.message}`
        };
      }

      console.log(`📊 Database results: ${places?.length || 0} places found (total in DB: ${count})`);

      // ============================================
      // IF FOUND IN DATABASE: Return immediately
      // ============================================
      if (places && places.length > 0) {
        console.log("✅ FAST PATH: Returning cached results from database");
        return { text: formatPlacesResponse(places, data.location) };
      }

      // ============================================
      // STEP 2: GEOCODE & FETCH FROM API (Slow Path)
      // ============================================
      console.log("\n🌐 STEP 2: No results in database. Fetching from Park4Night API...");

      const fetchedPlaces = await fetchPlacesByCity(data.location, 10);

      if (fetchedPlaces.length === 0) {
        console.log("❌ No results found from Park4Night API");
        return {
          text: `No he trobat cap lloc que coincideixi amb "${data.location}". Prova amb una altra paraula clau o ubicació més específica.`
        };
      }

      console.log(`✅ Fetched ${fetchedPlaces.length} places from Park4Night API`);

      // Save to database immediately
      await savePlacesToDatabase(fetchedPlaces);

      // ============================================
      // STEP 3: Return Fresh Data
      // ============================================
      console.log("\n✨ SLOW PATH COMPLETE: Returning freshly fetched and saved data");
      console.log("================================================\n");

      return { text: formatPlacesResponse(fetchedPlaces, data.location) };

    } catch (err) {
      console.error("💥 UNEXPECTED ERROR:", err);
      return {
        text: `Error inesperat durant la cerca: ${err instanceof Error ? err.message : 'Unknown error'}. Si us plau, prova de nou.`
      };
    }
  },
});
