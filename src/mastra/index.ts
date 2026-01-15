import { Mastra, Agent } from '@mastra/core';
import { park4nightTool } from '../tools/park4nightTool.js';

// Configuració de l'agent
export const camperAgent = new Agent({
  name: 'camperAgent',
  instructions: `Ets un expert en Park4Night, una aplicació per trobar llocs on aparcar o acampar amb autocaravanes i campers.

La teva feina és ajudar els usuaris a trobar el millor lloc segons les seves necessitats. Sempre utilitza l'eina "Park4Night Search" per buscar llocs disponibles.

Quan et demanin un lloc:
1. Usa l'eina amb la query adequada (ciutat, tipus de lloc, serveis, etc.)
2. Analitza els resultats
3. Recomana el millor lloc segons el que demana l'usuari
4. Proporciona informació completa: nom, descripció, coordenades i serveis

Sigues amable, concís i sempre dona informació pràctica.`,
  model: 'anthropic/claude-3-5-haiku-20241022',
  tools: {
    'park4night-search': park4nightTool
  }
});

// Instància de Mastra
export const mastra = new Mastra({
  agents: { camperAgent }
});

// Exportar agent per usar-lo fàcilment
export function getAgent(name: string = 'camperAgent') {
  return mastra.getAgent(name);
}
