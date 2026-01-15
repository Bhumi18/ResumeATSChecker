# ✅ Updated to Google AI Studio

## Changes Made

### 1. Environment Variables
Updated `.env.example` with:
```env
VITE_GOOGLE_AI_STUDIO_API_KEY=your_api_key
```

**Get your API key from**: https://aistudio.google.com/app/apikey

### 2. AI Models Configured

| Model | Purpose | Usage |
|-------|---------|-------|
| `gemini-2.0-flash-exp` | Fast analysis & feedback | Primary model |
| `gemini-2.0-flash-exp` | Deep rewrite & premium | Fallback/Premium |
| `text-embedding-004` | Semantic matching | Embeddings |

### 3. Updated Files

#### [app/lib/ai-analyzer.ts](app/lib/ai-analyzer.ts)
- ✅ Removed OpenAI integration
- ✅ Added `generateEmbedding()` for text-embedding-004
- ✅ Added `cosineSimilarity()` for semantic matching
- ✅ Updated `analyzeWithGeminiFlash()` for fast analysis
- ✅ Updated `analyzeWithGeminiPro()` for deep analysis
- ✅ Added `analyzeResumeFast()` - explicit fast analysis
- ✅ Added `analyzeResumePremium()` - explicit premium analysis
- ✅ Updated `analyzeResume()` with automatic fallback logic

#### [.env.example](.env.example)
- ✅ Changed `VITE_OPENAI_API_KEY` → `VITE_GOOGLE_AI_STUDIO_API_KEY`
- ✅ Removed Google AI references
- ✅ Added model documentation

#### [app/routes/upload.tsx](app/routes/upload.tsx)
- ✅ Updated to pass `usePremium` parameter
- ✅ Changed model tracking to use returned `modelUsed` value

## Model Selection Logic

### Automatic Mode (Default)
```typescript
analyzeResume(file, jobTitle, jobDescription, false)
```
1. Try Gemini Flash first (fast, cost-effective)
2. If Flash fails → Automatic fallback to Gemini Pro
3. If all fail → Use mock data

### Premium Mode
```typescript
analyzeResume(file, jobTitle, jobDescription, true)
```
- Uses Gemini Pro directly (comprehensive analysis)

## New Functions Available

### 1. Generate Embeddings
```typescript
const embedding = await generateEmbedding("Resume text here");
// Returns: number[] | null
```

### 2. Calculate Similarity
```typescript
const similarity = cosineSimilarity(vector1, vector2);
// Returns: number (0-1)
```

### 3. Fast Analysis
```typescript
const result = await analyzeResumeFast(file, jobTitle, jobDescription);
// Uses: gemini-2.0-flash-exp
```

### 4. Premium Analysis
```typescript
const result = await analyzeResumePremium(file, jobTitle, jobDescription);
// Uses: gemini-2.0-flash-exp
```

## Usage Examples

### Basic Usage
```typescript
import { analyzeResume } from './lib/ai-analyzer';

// Fast analysis (default)
const result = await analyzeResume(pdfFile);

// With job details
const result = await analyzeResume(
  pdfFile,
  "Software Engineer",
  "Job description text..."
);

// Premium analysis
const result = await analyzeResume(
  pdfFile,
  "Software Engineer",
  "Job description text...",
  true
);
```

### Semantic Matching
```typescript
import { generateEmbedding, cosineSimilarity } from './lib/ai-analyzer';

// Generate embeddings
const resumeEmbedding = await generateEmbedding(resumeText);
const jobEmbedding = await generateEmbedding(jobDescription);

// Calculate match score
if (resumeEmbedding && jobEmbedding) {
  const matchScore = cosineSimilarity(resumeEmbedding, jobEmbedding);
  console.log(`Match: ${(matchScore * 100).toFixed(1)}%`);
}
```

## API Rate Limits

Google AI Studio Free Tier:
- **Gemini Flash**: 15 RPM, 1M TPM, 1500 RPD
- **Gemini Pro**: 2 RPM, 32K TPM, 50 RPD  
- **Embeddings**: 1500 RPM

## Error Handling

The system automatically:
1. Tries Gemini Flash first
2. Falls back to Gemini Pro if Flash fails
3. Falls back to mock data if all models fail
4. Logs all errors to console

## Configuration

### Environment Setup
1. Create `.env` file
2. Add: `VITE_GOOGLE_AI_STUDIO_API_KEY=your_key_here`
3. Restart dev server

### Model Priority
Edit `GEMINI_MODELS` in [ai-analyzer.ts](app/lib/ai-analyzer.ts):
```typescript
const GEMINI_MODELS = {
  FLASH: 'gemini-2.0-flash-exp',
  PRO: 'gemini-2.0-flash-exp',
  EMBEDDING: 'text-embedding-004',
} as const;
```

## Next Steps

1. **Get API Key**: https://aistudio.google.com/app/apikey
2. **Add to .env**: `VITE_GOOGLE_AI_STUDIO_API_KEY=your_key`
3. **Test**: Upload a resume and check console logs
4. **Monitor**: Watch for model usage in console

## Benefits

✅ **Cost-effective**: Free tier is generous  
✅ **Fast**: Flash model is very quick  
✅ **Reliable**: Auto-fallback between models  
✅ **Semantic**: Embeddings for advanced matching  
✅ **Flexible**: Can use fast or premium analysis  

## Troubleshooting

### "API key not configured"
- Check `.env` file exists
- Verify variable name: `VITE_GOOGLE_AI_STUDIO_API_KEY`
- Restart dev server

### "Rate limit exceeded"
- Wait a moment
- System will auto-fallback to Pro
- Check daily limits

### "Failed to analyze"
- Check API key is valid
- Verify internet connection
- System will use mock data

## Model Comparison

| Feature | Flash | Pro |
|---------|-------|-----|
| Speed | ⚡ Very Fast | 🐌 Slower |
| Quality | ✅ Good | ⭐ Excellent |
| Cost | 💰 Lower | 💰💰 Higher |
| Default | ✅ Yes | ❌ No |
| Fallback | → Pro | → Mock |

Your ATS checker is now powered by Google AI Studio! 🚀
