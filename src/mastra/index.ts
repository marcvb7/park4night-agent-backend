import { Mastra, Agent } from '@mastra/core';
// CORRECCIÓ CLAU: './' (mateixa carpeta) i afegim '.js'
import { park4nightTool } from './tools/park4nightTool.js';

// CHIVATO: Això ens dirà als logs si l'eina s'ha carregat
console.log("🔧 DEBUG: Intentant carregar l'eina Park4Night...");
console.log("🔧 DEBUG: Estat de l'eina:", park4nightTool ? "✅ CARREGADA" : "❌ FALLIDA");

export const camperAgent = new Agent({
  name: 'camperAgent',
  instructions: `Ets un expert assistent de Park4Night amb accés DIRECTE a la base de dades.

MANDATORY WORKFLOW per CADA petició:
1. PRIMER: Crida SEMPRE park4nightTool amb el paràmetre "location" = paraula clau de la cerca
2. DESPRÉS: Mostra els resultats EXACTES sense modificar-los

EXEMPLES D'ÚS CORRECTE:
Q: "Busco llocs prop de Barcelona"
A: [CRIDES park4nightTool amb location="Barcelona"] → [MOSTRES resultats]

Q: "Càmpings amb WiFi"
A: [CRIDES park4nightTool amb location="camping WiFi"] → [MOSTRES resultats]

Q: "Pirineus tranquils"
A: [CRIDES park4nightTool amb location="Pirineus tranquils"] → [MOSTRES resultats]

⚠️ CRÍTIC: NO responguis MAI sense cridar primer la tool. Tota la informació ve de la base de dades.`,
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
