import 'dotenv/config';
import { getAgent } from './mastra/index.js';

async function testAgent() {
  console.log('🚀 Iniciant test de l\'agent Park4Night...\n');

  try {
    // Obtenir l'agent
    const agent = getAgent('camperAgent');

    // Query de test
    const userQuery = 'Busco un lloc tranquil per dormir prop dels Pirineus amb serveis bàsics';
    console.log(`📝 Query: "${userQuery}"\n`);

    // Generar resposta
    console.log('🤖 L\'agent està processant...\n');
    const response = await agent.generate(userQuery);

    // Mostrar resposta
    console.log('✅ Resposta de l\'agent:');
    console.log('─'.repeat(50));
    console.log(response.text);
    console.log('─'.repeat(50));

    console.log('\n✨ Test completat amb èxit!');
  } catch (error) {
    console.error('❌ Error durant el test:', error);
    process.exit(1);
  }
}

// Executar test
testAgent();
