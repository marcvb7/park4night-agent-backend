import { createTool } from "@mastra/core";
import { z } from "zod";
import { createClient } from '@supabase/supabase-js';

// 1. Connectem amb la Base de Dades
// Si no troba les claus (per exemple en local si no tens .env), no petarà de cop.
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export const park4nightTool = createTool({
  label: "Cercador Park4Night Real",
  schema: z.object({
    location: z.string().describe("La ubicació on l'usuari vol buscar llocs"),
  }),
  description: "Busca llocs per pernoctar a la base de dades real de Park4Night.",
  executor: async ({ data }) => {
    console.log(`🔎 Agent cercant a Supabase per: ${data.location}`);

    // 2. Fem la consulta a Supabase (demanem els últims 5 llocs guardats)
    // Ordenem per 'created_at' descendent per veure els nous que has 'robat' avui
    const { data: places, error } = await supabase
      .from('places')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error("❌ Error Supabase:", error);
      return { text: "Ho sento, he tingut un error connectant amb la base de dades." };
    }

    if (!places || places.length === 0) {
      return { text: "No he trobat cap lloc a la base de dades actualment. Assegura't que l'scraper ha guardat dades." };
    }

    // 3. Formategem la resposta perquè l'Agent l'entengui
    const resultsText = places.map((p: any) => {
      // Netegem una mica el text si és massa llarg
      const desc = p.description ? p.description.substring(0, 150) + '...' : 'Sense descripció';
      return `- 🚐 **${p.name}**\n  🔗 [Veure a Park4Night](${p.url})\n  📝 ${desc}`;
    }).join("\n\n");

    return {
      text: `He trobat aquests llocs REALS a la teva base de dades:\n\n${resultsText}`
    };
  },
});