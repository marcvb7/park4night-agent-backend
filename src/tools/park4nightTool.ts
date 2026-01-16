import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Carregar variables d'entorn
dotenv.config();

// Configurar Supabase client
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('⚠️ WARNING: SUPABASE_URL or SUPABASE_KEY not configured');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Schema Zod per validar l'input i output
const park4nightInputSchema = z.object({
  query: z.string().describe('Paraula o frase per buscar en nom o descripció dels llocs')
});

const park4nightOutputSchema = z.object({
  locations: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    lat: z.number().nullable(),
    lng: z.number().nullable(),
    services: z.array(z.string()),
    url: z.string().optional()
  })),
  total: z.number(),
  query: z.string().optional(),
  message: z.string()
});

// Tool de Mastra per buscar llocs (REAL DATA from Supabase)
export const park4nightTool = createTool({
  id: 'park4night-search',
  name: 'Park4Night Search',
  description: 'Cerca llocs per aparcar o acampar filtrant per nom o descripció. Retorna llocs reals de la base de dades de Park4Night.',
  inputSchema: park4nightInputSchema,
  outputSchema: park4nightOutputSchema,

  execute: async ({ context }) => {
    const { query } = context;

    try {
      let supabaseQuery = supabase
        .from('places')
        .select('*', { count: 'exact' });

      // Si hi ha query, filtrar per nom o descripció
      if (query && query.trim() !== '') {
        const searchTerm = `%${query}%`;
        supabaseQuery = supabaseQuery.or(`name.ilike.${searchTerm},description.ilike.${searchTerm}`);
      }

      // Limitar resultats a 20
      supabaseQuery = supabaseQuery.limit(20);

      const { data, error, count } = await supabaseQuery;

      if (error) {
        console.error('❌ Supabase error:', error);
        return {
          locations: [],
          total: 0,
          query: query,
          message: `Error consultant la base de dades: ${error.message}`
        };
      }

      if (!data || data.length === 0) {
        return {
          locations: [],
          total: 0,
          query: query,
          message: query
            ? `No s'han trobat llocs que coincideixin amb "${query}"`
            : 'No hi ha llocs disponibles a la base de dades'
        };
      }

      // Transformar les dades de Supabase al format esperat
      const locations = data.map((place: any) => ({
        id: place.id.toString(),
        name: place.name || 'Sense nom',
        description: place.description || 'Sense descripció',
        lat: place.latitude,
        lng: place.longitude,
        services: place.services ? (Array.isArray(place.services) ? place.services : []) : [],
        url: place.url
      }));

      const message = query
        ? `S'han trobat ${data.length} llocs que coincideixen amb "${query}" (total a la BD: ${count})`
        : `Tots els llocs disponibles: ${data.length} resultats`;

      return {
        locations,
        total: count || data.length,
        query: query,
        message
      };

    } catch (error) {
      console.error('❌ Unexpected error in park4nightTool:', error);
      return {
        locations: [],
        total: 0,
        query: query,
        message: `Error inesperat: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
});
