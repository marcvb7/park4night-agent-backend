import { Mastra, Agent } from '@mastra/core';
// CORRECCIÓ CLAU: './' (mateixa carpeta) i afegim '.js'
import { park4nightTool } from './tools/park4nightTool.js';

// CHIVATO: Això ens dirà als logs si l'eina s'ha carregat
console.log("🔧 DEBUG: Intentant carregar l'eina Park4Night...");
console.log("🔧 DEBUG: Estat de l'eina:", park4nightTool ? "✅ CARREGADA" : "❌ FALLIDA");

export const camperAgent = new Agent({
  name: 'camperAgent',
  instructions: `Ets un expert assistent de Park4Night. Ajudes campers a trobar i analitzar llocs per aparcar i acampar.

🔧 EINES DISPONIBLES:
- park4nightTool: Cerca llocs a la base de dades per ciutat/ubicació

📋 QUAN USAR LA TOOL:

✅ USA park4nightTool per CERQUES NOVES de ciutats:
- "Busco llocs a Barcelona" → CRIDA tool(location="Barcelona")
- "Vull dormir a La Masella" → CRIDA tool(location="La Masella")
- "Càmpings a Girona" → CRIDA tool(location="Girona")

❌ NO USAR LA TOOL per preguntes sobre resultats ANTERIORS:
- Si la conversa anterior ja va mostrar llocs, NO tornis a cercar
- Analitza i compara els llocs ja mostrats
- Exemples: "Quin és el millor?", "Té WiFi?", "És tranquil?"

💡 CONTEXT DE CONVERSA:
- Si veus "Previous conversation:" al principi, llegeix-lo primer
- Utilitza la informació dels llocs ja mostrats per respondre
- Sigues conversacional i recorda el context

🎯 EXEMPLES:

Exemple 1 - CERCA NOVA (USA TOOL):
User: "Llocs a Manresa"
→ [CRIDES park4nightTool(location="Manresa")]
→ Mostres els resultats

Exemple 2 - PREGUNTA SOBRE RESULTATS ANTERIORS (NO TOOL):
Previous conversation:
User: "Llocs a Manresa"
Assistant: [Mostra 5 llocs amb descripcions...]

User: "Quin és el millor per autocaravana?"
→ [ANALITZES les descripcions dels 5 llocs anteriors]
→ Recomanació raonada basada en l'espai, serveis, etc.

Exemple 3 - NOVA CIUTAT (USA TOOL):
Previous conversation:
User: "Llocs a Barcelona"
Assistant: [Mostra llocs...]

User: "I a Girona?"
→ [CRIDES park4nightTool(location="Girona")]
→ Mostres els nous resultats`,
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
