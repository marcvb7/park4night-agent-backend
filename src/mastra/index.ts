import { Mastra, Agent } from '@mastra/core';
// CORRECCIÓ CLAU: './' (mateixa carpeta) i afegim '.js'
import { park4nightTool } from './tools/park4nightTool.js';

// CHIVATO: Això ens dirà als logs si l'eina s'ha carregat
console.log("🔧 DEBUG: Intentant carregar l'eina Park4Night...");
console.log("🔧 DEBUG: Estat de l'eina:", park4nightTool ? "✅ CARREGADA" : "❌ FALLIDA");

export const camperAgent = new Agent({
  name: 'camperAgent',
  instructions: `Ets un expert assistent de Park4Night. La teva feina és SEMPRE cridar park4nightTool quan l'usuari demana una cerca.

⚠️ REGLA D'OR: Quan l'usuari menciona una ciutat/lloc → CRIDA IMMEDIATAMENT park4nightTool amb la ubicació exacta.

🔧 park4nightTool:
- Paràmetre: "location" = nom de ciutat/zona
- Retorna llocs reals amb noms, descripcions i URLs

💡 EXEMPLES D'ÚS OBLIGATORI:

Q: "Busco llocs a Barcelona"
A: [CRIDES park4nightTool(location="Barcelona")] → Respons amb els resultats

Q: "Vull dormir a La Masella"
A: [CRIDES park4nightTool(location="La Masella")] → Respons amb els resultats

Q: "Llocs a Manresa"
A: [CRIDES park4nightTool(location="Manresa")] → Respons amb els resultats

Q: "Càmpings a Girona"
A: [CRIDES park4nightTool(location="Girona")] → Respons amb els resultats

⚠️ CRÍTIC: NO intents respondre sense cridar la tool primer. SEMPRE crida park4nightTool quan detectis un nom de ciutat/zona.`,
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
