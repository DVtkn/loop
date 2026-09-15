import 'dotenv/config';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';

async function verifyAI() {
  if (!GROQ_API_KEY) {
    console.error('[ERROR] GROQ_API_KEY is not set in environment or .env file.');
    process.exit(1);
  }

  console.log('Verifying Groq API connection...');
  try {
    const response = await fetch(GROQ_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'ping' }],
        model: 'qwen/qwen3.8-27b',
        max_tokens: 10,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[ERROR] Ошибка Groq: status ${response.status}`);
      console.error(`Response body: ${errorText}`);
      process.exit(1);
    }

    const data = await response.json();
    const generatedText = data.choices?.[0]?.message?.content;
    const modelName = data.model || 'unknown';

    if (generatedText) {
      console.log(`[SUCCESS] Groq API активен и готов к работе! Ответ: ${generatedText} (модель: ${modelName})`);
      process.exit(0);
    } else {
      console.error('[ERROR] Empty response content from Groq');
      console.error(JSON.stringify(data, null, 2));
      process.exit(1);
    }
  } catch (error) {
    console.error('[ERROR] Ошибка Groq:', error);
    process.exit(1);
  }
}

verifyAI();
