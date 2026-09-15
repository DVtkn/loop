import { db } from '../db/client.ts';
import { aiInsights, relationshipMetrics } from '../db/schema.ts';
import { eq, and, gte, lte } from "drizzle-orm";
import crypto from "crypto";
import { logger } from "../core/logger.ts";
import { callGroqChat } from "./aiService.ts";
import { AiInsightContent } from "../core/types.ts";
import { getTrends } from "./analytics.ts";

export async function detectRiskZones(metrics: any[]): Promise<string[]> {
  const risks: string[] = [];
  if (metrics.length < 14) return risks;

  // Split last 14 days into two 7-day chunks
  const recent = metrics.slice(-7);
  const previous = metrics.slice(-14, -7);

  const getAvg = (arr: any[], key: string) => 
    arr.reduce((sum, m) => sum + m.radarScores[key], 0) / arr.length;

  const spheres = [
    { key: 'trust', label: 'Доверие' },
    { key: 'communication', label: 'Общение' },
    { key: 'passion', label: 'Страсть' },
    { key: 'sharedValues', label: 'Ценности' },
    { key: 'care', label: 'Забота' },
    { key: 'dailyLife', label: 'Быт' }
  ];

  for (const s of spheres) {
    const prevAvg = getAvg(previous, s.key);
    const currAvg = getAvg(recent, s.key);
    if (prevAvg - currAvg >= 10) {
      risks.push(s.label);
    }
  }

  return risks;
}

export async function generateWeeklyInsight(coupleId: string, contextData: any) {
  if (!db) return null; // Needs DB

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(today.getDate() - 14);

  // 1. Get recent trends
  const recentMetrics = await getTrends(coupleId, 14);
  const risks = await detectRiskZones(recentMetrics);

  const isRiskAlert = risks.length > 0;
  const type = isRiskAlert ? 'risk_alert' : 'weekly';

  // 2. Prepare prompt
  const systemPrompt = `Ты — эмпатичный ИИ-психолог Сова. 
Твоя задача — проанализировать динамику отношений пары за неделю и дать короткий поддерживающий инсайт.
Отвечай СТРОГО валидным JSON без markdown, без обёрток \`\`\`json.
Ожидаемый формат:
{
  "weekSummary": "Краткое резюме настроения и активности недели на 2 предложения",
  "improvements": ["Улучшение 1 (коротко)", "Улучшение 2"],
  "riskZones": ["Зона риска 1", "Зона риска 2"],
  "recommendation": "Одна конкретная практика на неделю по методу Готтмана или ЭФТ (мягко)",
  "conversationStarter": "Вопрос для душевного диалога"
}

Контекст:
Пара: ${contextData.p1Name} и ${contextData.p2Name}.
Уровень доверия за последние 7 дней: ${(recentMetrics[recentMetrics.length - 1] as any)?.radarScores?.trust || 50}/100
Риски по детекции: ${risks.length > 0 ? risks.join(', ') : 'Нет'}.
Важно: Будь поддерживающим, не ставь категоричных диагнозов.`;

  let insightContent: AiInsightContent | null = null;

  try {
    const aiResponse = await callGroqChat([
      { role: "system", content: systemPrompt },
      { role: "user", content: "Сгенерируй отчёт для нашей пары на основе данных." }
    ]);

    if (aiResponse) {
      // Parse JSON from aiResponse, handle potential markdown wrappers
      const cleanJson = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      insightContent = JSON.parse(cleanJson);
    }
  } catch (err: any) {
    logger.info(`Groq generation failed, using fallback: ${err.message}`);
  }

  // Fallback template if generation fails
  if (!insightContent) {
    insightContent = {
      weekSummary: "Эта неделя показала вашу стабильность и взаимное уважение, несмотря на повседневные заботы.",
      improvements: ["Регулярные отметки настроения", "Поддержание контакта"],
      riskZones: risks.length > 0 ? risks : ["Недостаток времени на двоих"],
      recommendation: "Проведите 20 минут в выходные, делясь мыслями без отвлечения на телефоны.",
      conversationStarter: "Какое мгновение на этой неделе заставило тебя улыбнуться, вспоминая нас?"
    };
  }

  // 3. Save to DB
  try {
    await db.insert(aiInsights).values({
      id: crypto.randomUUID(),
      coupleId,
      type,
      content: insightContent,
      periodStart: sevenDaysAgoStr,
      periodEnd: todayStr,
      createdAt: today.toISOString()
    });
    logger.info(`Generated insight for ${coupleId} (${type})`);
  } catch (dbErr: any) {
    logger.info(`Failed to save insight for ${coupleId}: ${dbErr.message}`);
  }

  return { type, content: insightContent, periodStart: sevenDaysAgoStr, periodEnd: todayStr };
}
