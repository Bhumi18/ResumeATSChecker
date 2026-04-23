// Quick script to check available Gemini models
import 'dotenv/config';
import { readFileSync } from 'fs';

// Read API key from .env file
let apiKey = process.env.GOOGLE_AI_STUDIO_API_KEY;

if (!apiKey) {
  try {
    const envFile = readFileSync('.env', 'utf-8');
    const match = envFile.match(/GOOGLE_AI_STUDIO_API_KEY=(.+)/);
    if (match) {
      apiKey = match[1].trim();
    }
  } catch (e) {
    console.error('❌ Could not read .env file');
  }
}

if (!apiKey) {
  console.error('❌ GOOGLE_AI_STUDIO_API_KEY not found in .env file');
  process.exit(1);
}

async function listModels() {
  try {
    console.log('🔍 Fetching available models...\n');
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Error:', error);
      return;
    }

    const data = await response.json();
    
    console.log('📋 Available Models:\n');
    console.log('='.repeat(80));
    
    data.models.forEach(model => {
      // Only show models that support generateContent
      if (model.supportedGenerationMethods?.includes('generateContent')) {
        console.log(`\n✅ ${model.name}`);
        console.log(`   Display Name: ${model.displayName}`);
        console.log(`   Description: ${model.description}`);
        console.log(`   Methods: ${model.supportedGenerationMethods.join(', ')}`);
      }
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('\n💡 Copy one of the model names above (e.g., "models/gemini-1.5-flash")');
    console.log('   Use only the part after "models/" in your code\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

listModels();
