import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { getAgent } from './mastra/index.js';
import { createClient } from '@supabase/supabase-js';
import { fetchPlacesByCity, Place } from './services/park4nightAPI.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Supabase client
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

console.log(`🔧 Supabase configured: ${supabaseUrl ? 'YES' : 'NO'}`);

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Park4Night Agent API is running' });
});

// Helper function to save places to database
async function savePlacesToDatabase(places: Place[]) {
  console.log(`💾 Saving ${places.length} places to database...`);

  for (const place of places) {
    try {
      const { error } = await supabase
        .from('places')
        .upsert(
          {
            name: place.name,
            latitude: place.latitude,
            longitude: place.longitude,
            url: place.url,
            description: place.description,
            address: place.address
          },
          { onConflict: 'url' }
        );

      if (error) {
        console.error(`❌ Error saving "${place.name}":`, error.message);
      } else {
        console.log(`✅ Saved: ${place.name}`);
      }
    } catch (error) {
      console.error(`❌ Database error for "${place.name}":`, error);
    }
  }
}

// LAZY LOADING: Search Supabase, if not found, scrape and save
async function searchWithLazyLoading(query: string) {
  try {
    console.log(`\n================================================`);
    console.log(`🔍 LAZY LOADING: Searching for "${query}"`);
    console.log(`================================================`);

    // ============================================
    // STEP 1: DATABASE CHECK (Fast Path)
    // ============================================
    console.log(`\n📊 STEP 1: Checking database...`);

    const searchTerm = `%${query}%`;
    const { data, error, count } = await supabase
      .from('places')
      .select('*', { count: 'exact' })
      .or(`name.ilike.${searchTerm},description.ilike.${searchTerm},address.ilike.${searchTerm}`)
      .limit(5);

    if (error) {
      console.error('❌ Supabase error:', error);
      return null;
    }

    console.log(`📊 Database results: ${data?.length || 0} places found`);

    // ============================================
    // IF FOUND: Return immediately (Fast Path)
    // ============================================
    if (data && data.length > 0) {
      console.log(`✅ FAST PATH: Returning ${data.length} cached results from database`);
      console.log(`================================================\n`);
      return { data, count };
    }

    // ============================================
    // STEP 2: GEOCODE & FETCH FROM API (Slow Path)
    // ============================================
    console.log(`\n🌐 STEP 2: No results in database. Fetching from Park4Night API...`);

    const fetchedPlaces = await fetchPlacesByCity(query, 10);

    if (fetchedPlaces.length === 0) {
      console.log(`❌ No results found from Park4Night API`);
      console.log(`================================================\n`);
      return { data: [], count: 0 };
    }

    console.log(`✅ Fetched ${fetchedPlaces.length} places from Park4Night API`);

    // Step 4: Save to database immediately
    await savePlacesToDatabase(fetchedPlaces);

    console.log(`\n✨ SLOW PATH COMPLETE: Returning ${fetchedPlaces.length} freshly fetched and saved data`);
    console.log(`================================================\n`);

    // Return fetched data in same format as database results
    return { data: fetchedPlaces, count: fetchedPlaces.length };

  } catch (error) {
    console.error('❌ Unexpected error in lazy loading:', error);
    return null;
  }
}

// Format places for display
function formatPlaces(places: any[], count?: number) {
  if (!places || places.length === 0) {
    return '\n\n📍 No he trobat cap lloc a la base de dades que coincideixi amb la teva cerca.';
  }

  let response = `\n\n📍 **He trobat ${places.length} llocs a la base de dades**${count && count > places.length ? ` (total: ${count})` : ''}:\n\n`;

  places.forEach((place, index) => {
    response += `**${index + 1}. ${place.name}**\n`;
    response += `${place.description?.substring(0, 200) || 'Sense descripció'}${place.description?.length > 200 ? '...' : ''}\n`;

    if (place.url) {
      response += `🔗 ${place.url}\n`;
    }
    response += '\n';
  });

  return response;
}

// Detect if message is a NEW search query (not a follow-up question)
function isNewSearchQuery(message: string): boolean {
  const lowerMsg = message.toLowerCase();

  // Follow-up question indicators (return FALSE for these)
  const followUpPatterns = [
    'quina', 'quin', 'quins', 'quines',          // Which one(s)?
    'd\'aquests', 'd\'aquestes', 'aquests', 'aquestes',  // Of these
    'millor', 'pitjor',                          // Better/worse
    'recomanació', 'recomanes', 'recomana',      // Recommend
    'compara', 'diferència',                     // Compare
    'més', 'menys',                              // More/less
    'primer', 'segon', 'tercer',                 // First, second...
  ];

  for (const pattern of followUpPatterns) {
    if (lowerMsg.includes(pattern)) {
      return false; // It's a follow-up question
    }
  }

  // New search indicators (return TRUE for these)
  const searchPatterns = [
    'busco', 'cerca', 'troba', 'trobar',
    'llocs a', 'lloc a', 'places a',
    'càmping', 'camping', 'àrea',
    'on puc', 'hi ha',
    'vull anar', 'necessito'
  ];

  for (const pattern of searchPatterns) {
    if (lowerMsg.includes(pattern)) {
      return true; // It's a new search
    }
  }

  // Default: If it contains a potential city name (capitalized word), assume it's a search
  // This catches "Barcelona", "Manresa", "Girona" etc.
  const hasCapitalizedWord = /\b[A-ZÀÈÉÍÒÓÚÏÜ][a-zàèéíòóúïü]+/.test(message);
  return hasCapitalizedWord;
}

// Extract keywords from message for search
function extractKeywords(message: string): string {
  const lowerMsg = message.toLowerCase();

  // Try to extract location from common patterns
  const locationPatterns = [
    /llocs? (?:a|prop de|a prop de) ([a-zàèéíòóúïü\s]+)/i,
    /(?:busco|cerca|troba|trobar) (?:a|prop de)? ([a-zàèéíòóúïü\s]+)/i,
    /càmpings? (?:a|de) ([a-zàèéíòóúïü\s]+)/i,
    /([A-ZÀÈÉÍÒÓÚÏÜ][a-zàèéíòóúïü]+(?:\s+[A-ZÀÈÉÍÒÓÚÏÜ][a-zàèéíòóúïü]+)?)/  // Capitalized words
  ];

  for (const pattern of locationPatterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  // Fallback: Clean and return first meaningful words
  const cleaned = message
    .replace(/[^\wàèéíòóúïü\s]/gi, '')
    .split(' ')
    .filter(word => word.length > 2 && !['busco', 'cerca', 'troba', 'vull', 'lloc', 'llocs'].includes(word.toLowerCase()))
    .slice(0, 3)
    .join(' ');

  return cleaned || message;
}

// Main chat endpoint with DIRECT Supabase integration
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { message } = req.body;

    // Validate input
    if (!message || typeof message !== 'string') {
      res.status(400).json({
        error: 'Invalid request',
        details: 'Field "message" is required and must be a string'
      });
      return;
    }

    console.log(`💬 User query: "${message}"`);

    // HYBRID STRATEGY: Agent first, then smart fallback
    let agentResponse = '';
    let agentUsedTool = false;

    try {
      const agent = getAgent('camperAgent');
      const result = await agent.generate(message);
      agentResponse = result.text || '';

      // Detect if agent actually called the tool by checking if response contains place data
      agentUsedTool = agentResponse.includes('📍') || agentResponse.includes('🔗') ||
                      agentResponse.toLowerCase().includes('he trobat');

      console.log(`🤖 Agent response: ${agentResponse.substring(0, 100)}...`);
      console.log(`🔧 Agent used tool: ${agentUsedTool}`);
    } catch (agentError) {
      console.error('Agent error:', agentError);
      agentResponse = 'Ho sento, he tingut un problema processant la teva petició.';
    }

    // Smart fallback: If agent didn't use tool AND looks like a NEW search query
    let finalResponse = agentResponse;

    if (!agentUsedTool && isNewSearchQuery(message)) {
      console.log(`🎯 SMART FALLBACK: Detected new search query without tool usage`);

      // Extract keywords for search
      const keywords = extractKeywords(message);
      console.log(`🔍 Searching with keywords: "${keywords}"`);

      // Query with Lazy Loading
      const searchResult = await searchWithLazyLoading(keywords);

      if (searchResult && searchResult.data && searchResult.data.length > 0) {
        const placesInfo = formatPlaces(searchResult.data, searchResult.count);
        finalResponse = agentResponse + placesInfo;
        console.log(`✅ Enhanced with ${searchResult.data.length} places from fallback search`);
      }
    } else if (!agentUsedTool) {
      console.log(`💡 Follow-up question detected, using agent response only`);
    }

    // Return response
    res.json({
      response: finalResponse,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error processing chat request:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Park4Night Agent API running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`💬 Chat endpoint: POST http://localhost:${PORT}/api/chat`);
  console.log(`🗄️ Supabase: ${supabaseUrl ? 'Connected' : 'NOT configured'}`);
});
