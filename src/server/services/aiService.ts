import { db, isSqlConfigured } from '../db/client.ts';
import { chatMessages } from '../db/schema.ts';
import { logger } from '../core/logger.ts';
import { readEmergencyFile, writeEmergencyFile } from './storageService.ts';
import crypto from 'crypto';

const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL_NAME = 'qwen/qwen3.8-27b';

export async function callGroqChat(
  messages: Array<{ role: string; content: string }>
): Promise<string | null> {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) {
    logger.warn('GROQ_API_KEY не задан в окружении (.env)');
    return "Я рядом и готова поддержать вашу пару! Настройте ключ Groq, чтобы включить глубокий психологический анализ. 🦉";
  }

  // Attempt up to 2 times (with short delay on retry)
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await fetch(GROQ_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          messages,
          model: MODEL_NAME,
          temperature: 0.5,
          max_tokens: 650,
          stream: false,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          logger.info(`Ответ Groq успешно получен (модель: ${MODEL_NAME})`);
          return content;
        }
      }

      const errText = await response.text();
      logger.warn(`Groq ${MODEL_NAME} статус ${response.status} (попытка ${attempt}/2): ${errText.slice(0, 150)}`);

      if (attempt === 1 && (response.status === 429 || response.status >= 500)) {
        await new Promise((r) => setTimeout(r, 700));
        continue;
      }
    } catch (err: unknown) {
      logger.warn(`[Groq API Exception] попытка ${attempt}/2:`, undefined, err);
      if (attempt === 1) {
        await new Promise((r) => setTimeout(r, 700));
      }
    }
  }

  // Warm, empathetic fallback for couple chat resilience
  return "Я сейчас внимательно обдумываю ваши слова и сонастраиваюсь с атмосферой вашей пары. Задайте мне вопрос ещё раз через полминуты или поделитесь, что именно вы сейчас чувствуете — я рядом и слушаю вас. 🦉💚";
}

export async function saveAIMessageToDb(
  userLogin: string | undefined,
  prompt: string,
  reply: string
): Promise<void> {
  if (!userLogin) return;
  const cleanLogin = String(userLogin).toLowerCase().replace(/^@/, '');
  const now = new Date().toISOString();

  const userMsg = {
    id: crypto.randomUUID(),
    coupleId: `ai_${cleanLogin}`,
    senderLogin: cleanLogin,
    role: 'partner1',
    content: prompt,
    isRead: true,
    createdAt: now,
  };

  const aiMsg = {
    id: crypto.randomUUID(),
    coupleId: `ai_${cleanLogin}`,
    senderLogin: 'ai_owl',
    role: 'ai',
    content: reply,
    isRead: true,
    createdAt: new Date(Date.now() + 100).toISOString(),
  };

  if (isSqlConfigured() && db) {
    try {
      await db.insert(chatMessages).values([userMsg, aiMsg]);
      return;
    } catch (err: unknown) {
      logger.error('Сбой сохранения ИИ-сообщений в PostgreSQL', err, { login: cleanLogin });
    }
  }

  const store = readEmergencyFile();
  if (!store.chatMessages) store.chatMessages = [];
  store.chatMessages.push(userMsg, aiMsg);
  writeEmergencyFile(store);
}
