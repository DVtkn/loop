import { GoogleGenAI } from '@google/genai';
import { db, isSqlConfigured } from '../db/client.ts';
import { chatMessages } from '../db/schema.ts';
import { logger } from '../core/logger.ts';
import { readEmergencyFile, writeEmergencyFile } from './storageService.ts';
import crypto from 'crypto';

const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL_NAME = 'qwen/qwen3.8-27b';
const GEMINI_MODEL_NAME = 'gemini-4-hydrogen';

export interface AiChatResult {
  reply: string;
  provider: 'gemini' | 'groq' | 'fallback';
}

async function callGeminiChat(
  messages: Array<{ role: string; content: string }>
): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const systemParts: string[] = [];
  const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

  for (const m of messages) {
    const text = String(m.content || '').trim();
    if (!text) continue;
    if (m.role === 'system') {
      systemParts.push(text);
    } else {
      contents.push({
        role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
        parts: [{ text }],
      });
    }
  }

  if (contents.length === 0) {
    contents.push({ role: 'user', parts: [{ text: 'Привет' }] });
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
  });

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents,
      config: {
        ...(systemParts.length > 0 ? { systemInstruction: systemParts.join('\n\n') } : {}),
        temperature: 0.5,
        maxOutputTokens: 700,
      },
    });
    const text = response.text?.trim();
    if (text) {
      logger.info(`Ответ Gemini успешно получен (модель: ${GEMINI_MODEL_NAME})`);
      return text;
    }
  } catch (err: unknown) {
    logger.warn(`[Gemini API Exception] модель ${GEMINI_MODEL_NAME}:`, undefined, err);
  }
  return null;
}

async function callGroqApi(
  messages: Array<{ role: string; content: string }>
): Promise<string | null> {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) return null;

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
          model: GROQ_MODEL_NAME,
          temperature: 0.5,
          max_tokens: 650,
          stream: false,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          logger.info(`Ответ Groq успешно получен (модель: ${GROQ_MODEL_NAME})`);
          return content;
        }
      }

      const errText = await response.text();
      logger.warn(`Groq ${GROQ_MODEL_NAME} статус ${response.status} (попытка ${attempt}/2): ${errText.slice(0, 150)}`);

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
  return null;
}

export async function callAIChatDetailed(
  messages: Array<{ role: string; content: string }>
): Promise<AiChatResult> {
  if (!process.env.GEMINI_API_KEY && !process.env.GROQ_API_KEY) {
    logger.warn('GEMINI_API_KEY и GROQ_API_KEY не заданы в окружении');
    return {
      reply: "Я рядом и готова поддержать вашу пару! Настройте GEMINI_API_KEY или GROQ_API_KEY на сервере, чтобы включить глубокий психологический анализ. 🦉",
      provider: 'fallback',
    };
  }

  const geminiReply = await callGeminiChat(messages);
  if (geminiReply) {
    return { reply: geminiReply, provider: 'gemini' };
  }

  const groqReply = await callGroqApi(messages);
  if (groqReply) {
    return { reply: groqReply, provider: 'groq' };
  }

  return {
    reply: "Я сейчас внимательно обдумываю ваши слова и сонастраиваюсь с атмосферой вашей пары. Задайте мне вопрос ещё раз через полминуты или поделитесь, что именно вы сейчас чувствуете — я рядом и слушаю вас. 🦉💚",
    provider: 'fallback',
  };
}

export async function callGroqChat(
  messages: Array<{ role: string; content: string }>
): Promise<string | null> {
  const result = await callAIChatDetailed(messages);
  return result.reply;
}

export async function checkAiHealth(): Promise<{ ok: boolean; provider?: string; message?: string; upstreamStatus?: number }> {
  if (process.env.GEMINI_API_KEY) {
    const reply = await callGeminiChat([{ role: 'user', content: 'ping' }]);
    if (reply) {
      return { ok: true, provider: `gemini (${GEMINI_MODEL_NAME})` };
    }
  }

  if (process.env.GROQ_API_KEY) {
    try {
      const response = await fetch(GROQ_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'ping' }],
          model: GROQ_MODEL_NAME,
          max_tokens: 10,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.choices?.[0]?.message?.content) {
          return { ok: true, provider: data.model || GROQ_MODEL_NAME };
        }
      }
      return { ok: false, message: 'AI upstream returned error', upstreamStatus: response.status };
    } catch {
      return { ok: false, message: 'Network error reaching AI provider' };
    }
  }

  return { ok: false, message: 'Neither GEMINI_API_KEY nor GROQ_API_KEY is configured' };
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
