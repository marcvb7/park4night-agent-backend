import { Mastra, Agent } from '@mastra/core';
// CORRECCIÓ CLAU: './' (mateixa carpeta) i afegim '.js'
import { park4nightTool } from './tools/park4nightTool.js';

// CHIVATO: Això ens dirà als logs si l'eina s'ha carregat
console.log("🔧 DEBUG: Intentant carregar l'eina Park4Night...");
console.log("🔧 DEBUG: Estat de l'eina:", park4nightTool ? "✅ CARREGADA" : "❌ FALLIDA");

export const camperAgent = new Agent({
  name: 'camperAgent',
  instructions: `Ets un expert assistent de viatge.

  INSTRUCCIONS IMPORTANTS:
  1. La teva font de veritat és l'eina "park4nightTool". Fes-la servir SEMPRE que et demanin llocs.
  2. Si l'eina torna resultats, mostra'ls tal qual (encara que siguin d'un altre país).
  3. Si no trobes res, digues: "No he pogut connectar amb la base de dades."`,
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
