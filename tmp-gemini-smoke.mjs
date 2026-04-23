import 'dotenv/config';

const key = process.env.GOOGLE_AI_STUDIO_API_KEY;
if (!key) {
  console.error('NO_KEY: GOOGLE_AI_STUDIO_API_KEY is not set in this process');
  process.exit(2);
}

const model = process.argv[2] || 'gemini-2.5-flash';
const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
  model
)}:generateContent?key=${encodeURIComponent(
  key
)}`;

const res = await fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contents: [
      {
        parts: [
          {
            text: [
              'You must return VALID JSON only (no prose, no markdown).',
              'Return exactly this JSON object and nothing else:',
              '{"ok":true}',
            ].join('\n'),
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 256,
      responseMimeType: 'application/json',
    },
  }),
});

const text = await res.text();
console.log('STATUS', res.status, res.statusText);
console.log(text.slice(0, 2000));

if (!res.ok) process.exit(1);
