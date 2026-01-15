import { Mastra, Agent } from '@mastra/core';
// CORRECCIÓ AQUÍ: Posem './' en lloc de '../' perquè la carpeta tools està al costat
import { park4nightTool } from './tools/park4nightTool';

export const camperAgent = new Agent({
  name: 'camperAgent',
  instructions: `Ets un expert assistent de viatge per a campers i autocaravanes.

  LA TEVA REGLA D'OR:
  NO t'inventis mai llocs. Les dades han de sortir EXCLUSIVAMENT de l'eina "park4nightTool".
  
  Quan l'usuari et pregunti per llocs (sigui quina sigui la ubicació):
  1. EXECUTA SEMPRE l'eina 'park4nightTool'.
  2. Si l'eina et torna llocs (encara que siguin d'Alemanya o França), MOSTRA'LS.
  3. Digues: "Això és el que he trobat a la base de dades actualment:".
  
  Si l'eina falla o no torna res, digues honestament: "No he pogut connectar amb la base de dades."`,
  model: 'anthropic/claude-3-5-haiku-20241022',
  tools: {
    park4nightTool: park4nightTool
  }
});

export const mastra = new Mastra({
  agents: { camperAgent }
});

export function getAgent(name: string = 'camperAgent') {
  return mastra.getAgent(name);
}
