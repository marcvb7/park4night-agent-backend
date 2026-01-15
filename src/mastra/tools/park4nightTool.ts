import { createTool } from "@mastra/core";
import { z } from "zod";
import { createClient } from '@supabase/supabase-js';

export const park4nightTool = createTool({
  label: "Cercador Park4Night Diagnòstic",
  schema: z.object({
    location: z.string().describe("Ubicació a cercar"),
  }),
  description: "Eina per buscar llocs i comprovar la connexió.",
  executor: async ({ data }) => {
    // 🚨 LOGS DE DIAGNÒSTIC CRÍTIC
    console.log("------------------------------------------------");
    console.log(`🚀 INTENTANT EXECUTAR EINA PER: ${data.location}`);
    console.log(`🔑 SUPABASE_URL detectada: ${process.env.SUPABASE_URL ? '✅ SÍ' : '❌ NO'}`);
    console.log(`🔑 SUPABASE_KEY detectada: ${process.env.SUPABASE_KEY ? '✅ SÍ' : '❌ NO'}`);
    
    try {
      const supabaseUrl = process.env.SUPABASE_URL || '';
      const supabaseKey = process.env.SUPABASE_KEY || '';
      const supabase = createClient(supabaseUrl, supabaseKey);

      console.log("📡 Connectant amb Supabase...");
      
      const { data: places, error } = await supabase
        .from('places')
        .select('*')
        .limit(3);

      if (error) {
        console.error("❌ ERROR SUPABASE:", JSON.stringify(error));
        return { text: `Error tècnic connectant: ${error.message}` };
      }

      console.log(`✅ ÈXIT! Trobats: ${places?.length} llocs.`);

      if (!places || places.length === 0) {
        return { text: "Connexió correcta, però la base de dades està buida." };
      }

      const list = places.map((p: any) => `- ${p.name} (${p.url})`).join("\n");
      return { text: `Connexió exitosa! He trobat:\n${list}` };

    } catch (err) {
      console.error("💥 CRASH TOTAL:", err);
      return { text: "Error greu al codi." };
    }
  },
});
