import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

// Dades mock de llocs de Park4Night
const MOCK_LOCATIONS = [
  {
    id: 'p4n-001',
    name: 'Càmping Costa Brava Paradise',
    description: 'Càmping tranquil a la Costa Brava amb vistes al mar. Ideal per relaxar-se i gaudir de la platja. Ambient familiar i zones verdes.',
    lat: 41.9794,
    lng: 3.2199,
    services: ['aigua', 'electricitat', 'dutxes', 'WiFi', 'restaurant']
  },
  {
    id: 'p4n-002',
    name: 'Pàrquing Segur BCN Centre',
    description: 'Aparcament al centre de Barcelona, prop de la Sagrada Família. Perfecte per visitar la ciutat. Vigilància 24h.',
    lat: 41.4036,
    lng: 2.1744,
    services: ['vigilància', 'il·luminació', 'WiFi']
  },
  {
    id: 'p4n-003',
    name: 'Àrea Rural Pirineus Tranquils',
    description: 'Àrea natural als Pirineus amb vistes espectaculars a les muntanyes. Entorn molt tranquil, ideal per desconnectar. Senderisme i natura pura.',
    lat: 42.3954,
    lng: 1.5197,
    services: ['aigua', 'WC', 'zona picnic', 'senderisme']
  },
  {
    id: 'p4n-004',
    name: 'Estació de Servei Tarragona Sud',
    description: 'Zona d\'estacionament a l\'estació de servei de l\'autopista. Serveis bàsics i botigues 24h. Perfecte per fer nit ràpida de camí.',
    lat: 41.1189,
    lng: 1.2445,
    services: ['gasolinera', 'botiga', 'WC', 'restaurant']
  },
  {
    id: 'p4n-005',
    name: 'Platja Girona Nord',
    description: 'Aparcament prop de la platja a la Costa Brava Nord. Ambient tranquil i accés directe al mar. Popular entre campers.',
    lat: 42.1267,
    lng: 3.0851,
    services: ['aigua', 'platja', 'dutxes', 'zona picnic']
  }
];

// Schema Zod per validar l'input i output
const park4nightInputSchema = z.object({
  query: z.string().describe('Paraula o frase per buscar en nom o descripció dels llocs')
});

const park4nightOutputSchema = z.object({
  locations: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    lat: z.number(),
    lng: z.number(),
    services: z.array(z.string())
  })),
  total: z.number(),
  query: z.string().optional(),
  message: z.string()
});

// Tool de Mastra per buscar llocs
export const park4nightTool = createTool({
  id: 'park4night-search',
  name: 'Park4Night Search',
  description: 'Cerca llocs per aparcar o acampar filtrant per nom o descripció. Retorna llocs amb coordenades i serveis disponibles.',
  inputSchema: park4nightInputSchema,
  outputSchema: park4nightOutputSchema,

  execute: async ({ context }) => {
    const { query } = context;

    // Si no hi ha query, retorna tots els llocs
    if (!query || query.trim() === '') {
      return {
        locations: MOCK_LOCATIONS,
        total: MOCK_LOCATIONS.length,
        message: 'Tots els llocs disponibles'
      };
    }

    // Filtrar per nom o descripció (case-insensitive)
    const queryLower = query.toLowerCase();
    const filteredLocations = MOCK_LOCATIONS.filter(location =>
      location.name.toLowerCase().includes(queryLower) ||
      location.description.toLowerCase().includes(queryLower)
    );

    return {
      locations: filteredLocations,
      total: filteredLocations.length,
      query: query,
      message: filteredLocations.length > 0
        ? `S'han trobat ${filteredLocations.length} llocs que coincideixen amb "${query}"`
        : `No s'han trobat llocs que coincideixin amb "${query}"`
    };
  }
});
