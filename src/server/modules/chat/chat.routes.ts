import { Router } from "express";
import { validateBody } from "../../shared/middleware/validation.ts";
import { requireAuth, AuthenticatedRequest } from "../../shared/middleware/auth.middleware.ts";
import { requirePairOwnership, isUserInCouple } from "../../shared/middleware/requirePairOwnership.ts";
import { aiLimiter } from "../../shared/middleware/rateLimiter.ts";
import { findUserByLogin } from "../../services/storageService.ts";
import {
  chatMessageCreateSchema,
  aiChatMessageSchema,
  aiReportSchema,
  aiDateIdeaSchema,
} from "../../shared/validators/chat.validator.ts";
import {
  getCoupleChatMessages,
  saveChatMessage,
  getAIMessages,
  callGroqChat,
  saveAIMessageToDb,
} from "./chat.service.ts";
import { sendSSEEventToUser } from "../../shared/utils/sse.ts";
import { recordCoupleEvent } from "../realtime/realtime.service.ts";
import { sendPushToUser } from "../../services/pushService.ts";
import { evaluateSafetyRisk } from "./safety.filter.ts";
import { calculateCoupleAnalysis } from "../../../utils/psychologyEngine.ts";
import { logger } from "../../shared/utils/logger.ts";

export const chatRouter = Router();

// 1. GET chat history (supports both /api/chat/messages, /api/chat/messages/:coupleId, and mode=together|solo)
chatRouter.get(["/messages", "/messages/:coupleId", "/message"], requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const userLogin = req.user?.login;
    if (!userLogin) {
      return res.status(401).json({ error: "Необходима авторизация" });
    }

    const cleanUser = userLogin.toLowerCase().trim().replace(/^@/, "");
    const mode = String(req.query.mode || "").toLowerCase();

    // If solo mode requested
    if (mode === "solo") {
      const messages = await getAIMessages(cleanUser);
      return res.json({ messages });
    }

    let coupleId = String(req.params.coupleId || req.query.coupleId || "").trim();
    if (!coupleId) {
      const userInDb = await findUserByLogin(cleanUser);
      const partner = userInDb?.partnerLogin ? userInDb.partnerLogin.toLowerCase().trim().replace(/^@/, "") : null;
      coupleId = partner ? [cleanUser, partner].sort().join("_") : cleanUser;
    }

    // IDOR protection
    if (!isUserInCouple(coupleId, userLogin)) {
      return res.status(403).json({ error: "Нет доступа к данной переписке" });
    }

    const messages = await getCoupleChatMessages(coupleId);
    return res.json({ messages });
  } catch (err) {
    logger.error("Ошибка получения сообщений чата", err);
    return res.status(500).json({ error: "Ошибка загрузки чата" });
  }
});

// 2. POST send chat message (supports /api/chat/messages and /api/chat/message + real-time SSE broadcast)
chatRouter.post(["/messages", "/message"], requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const userLogin = req.user?.login;
    if (!userLogin) {
      return res.status(401).json({ error: "Необходима авторизация" });
    }

    const cleanUser = userLogin.toLowerCase().trim().replace(/^@/, "");
    let { coupleId, senderLogin, content, role, mode } = req.body || {};

    if (!content || typeof content !== "string" || !content.trim()) {
      return res.status(400).json({ error: "Сообщение не может быть пустым" });
    }

    if (!coupleId) {
      const userInDb = await findUserByLogin(cleanUser);
      const partner = userInDb?.partnerLogin ? userInDb.partnerLogin.toLowerCase().trim().replace(/^@/, "") : null;
      coupleId = partner ? [cleanUser, partner].sort().join("_") : cleanUser;
    }

    // IDOR protection
    if (!isUserInCouple(coupleId, userLogin)) {
      return res.status(403).json({ error: "Нет доступа к данной переписке" });
    }

    const cleanSender = String(senderLogin || cleanUser).toLowerCase().trim().replace(/^@/, "");
    const isAiRole = role === "ai" || cleanSender === "ai" || cleanSender === "ai_owl";

    if (!isAiRole && cleanSender !== cleanUser) {
      return res.status(403).json({ error: "Нельзя отправлять сообщения от чужого имени" });
    }

    const assignedSender = isAiRole ? "ai" : cleanUser;
    const assignedRole = isAiRole ? "ai" : (role || "partner1");

    const message = await saveChatMessage({
      coupleId,
      senderLogin: assignedSender,
      content: content.trim(),
      role: assignedRole,
    });

    // Realtime broadcast via SSE to all parties in this couple
    try {
      const targets = coupleId.split("_").map((p: string) => p.toLowerCase().trim().replace(/^@/, ""));
      targets.forEach((targetLogin: string) => {
        if (targetLogin && targetLogin !== "ai") {
          sendSSEEventToUser(targetLogin, "chat_message", { message, coupleId, mode: mode || "together" });
          sendSSEEventToUser(targetLogin, "new_message", { message, coupleId, mode: mode || "together" });
          if (targetLogin !== cleanSender) {
            recordCoupleEvent({
              coupleId,
              targetLogin,
              senderLogin: cleanSender,
              eventType: "chat_message",
              payload: { message, coupleId, mode: mode || "together" },
            }).catch(() => {});

            // Send real system Web Push to partner
            sendPushToUser(targetLogin, {
              title: `@${cleanSender}`,
              body: content.trim().length > 90 ? content.trim().slice(0, 87) + "..." : content.trim(),
              icon: "/icon.svg",
              tag: `chat-${coupleId}`,
              url: "/",
            }).catch(() => {});
          }
        }
      });
    } catch (sseErr) {
      logger.warn("Сбой SSE бродкаста сообщения чата", { error: String(sseErr) });
    }

    return res.status(201).json({ message, status: "sent" });
  } catch (err) {
    logger.error("Ошибка сохранения сообщения чата", err);
    return res.status(500).json({ error: "Ошибка отправки сообщения" });
  }
});

export const aiRouter = Router();

aiRouter.get("/health", async (req, res) => {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) {
    return res.status(503).json({ status: "error", message: "GROQ_API_KEY is not configured" });
  }

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: "ping" }],
        model: "qwen/qwen3.8-27b",
        max_tokens: 10,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[Groq Health Check Failed]:", response.status, errText);
      return res.status(503).json({
        status: "error",
        message: "Groq API is currently unavailable",
        upstreamStatus: response.status,
      });
    }

    const data = await response.json();
    if (data.choices?.[0]?.message?.content) {
      return res.json({ status: "ok", provider: data.model || "groq" });
    } else {
      return res.status(503).json({ status: "error", message: "Empty response from Groq" });
    }
  } catch (error) {
    console.error("[Groq Error during health check]:", error);
    return res.status(503).json({ status: "error", message: "Network error reaching Groq" });
  }
});

aiRouter.get("/messages/:login", requireAuth, requirePairOwnership, async (req: AuthenticatedRequest, res, next) => {
  try {
    const login = String(req.params.login || "").toLowerCase().replace(/^@/, "");
    const messages = await getAIMessages(login);
    return res.json({ messages });
  } catch (err) {
    logger.error("Ошибка загрузки сообщений ИИ", err);
    return res.status(500).json({ error: "Ошибка сервера" });
  }
});

aiRouter.post("/chat", aiLimiter, requireAuth, validateBody(aiChatMessageSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { messages, userLogin: bodyLogin } = req.body;
    const coupleContext = req.body.context || req.body.coupleContext;
    const currentPartner = req.body.currentPartner;
    const callerLogin = req.user?.login || bodyLogin;

    const partnerName = currentPartner?.name || "Партнёр";
    const partner2Name = coupleContext?.user2?.name || "Второй партнёр";

    const lastUserMessage = messages[messages.length - 1];
    const lastUserText = lastUserMessage?.content || "";

    // 1. P0 Safety Intervention Filter (Emergency, Suicide, Violence)
    const safetyCheck = evaluateSafetyRisk(lastUserText);
    if (safetyCheck.hasRisk) {
      const notice = safetyCheck.systemNotice || "Кризисная помощь";
      await saveAIMessageToDb(callerLogin, lastUserText, notice);
      return res.status(200).json({
        reply: notice,
        isSafetyIntervention: true,
        mode: "crisis_intervention",
      });
    }

    // 2. Off-topic Guardrail check
    const offTopicKeywords = [
      "шкаф", "код", "программ", "python", "javascript", "машин", "ремонт",
      "рецепт", "пирог", "президент", "политик", "забудь", "игнорируй"
    ];
    if (offTopicKeywords.some((k) => lastUserText.toLowerCase().includes(k))) {
      return res.json({
        reply: "Я семейный психолог Сова и специализируюсь исключительно на отношениях, чувствах и гармонии в паре.\n\nФизические и технические инструкции лучше посмотреть в руководстве пользователя. А если в процессе совместного дела возникло недопонимание — я с радостью помогу всё экологично уладить! О чём в отношениях вы хотите поговорить?",
        mode: "fallback_guardrail",
      });
    }

    const systemPrompt = `Ты — Сова, опытный, бережный и доказательный семейный психолог приложения для пар Loop.

ТВОЙ СТИЛЬ:
- Говори как настоящий чуткий психотерапевт: спокойно, поддерживающе, структурно и предельно ЛАКОНИЧНО.
- БЕЗ ВОДЫ И ШАБЛОННЫХ ВСТУПЛЕНИЙ: сразу переходи к сути вопроса.
- ДЛИНА ОТВЕТА: строго 70–130 слов (2-3 коротких смысловых блока). Ответ должен легко считываться с экрана смартфона за 20 секунд.

ФОРМАТИРОВАНИЕ ОТВЕТА:
- Используй только обычный текст, абзацы и эмодзи.
- КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО использовать Markdown-таблицы, блоки кода или HTML-теги.
- Отвечай строго как эмпатичный собеседник в мессенджере.

СМЫСЛОВАЯ СТРУКТУРА ОТВЕТА:
1. **Взгляд психолога** (1–2 ёмких предложения: валидация чувств и корень динамики в паре).
2. **Практика / Готовая фраза** (1–2 точечных шага с конкретным речевым шаблоном в кавычках: «...», например по методу Готтмана или Я-высказыванию).
3. **Вопрос для вас** (1 точный, глубокий вопрос для диалога с собой или партнёром).

КАТЕГОРИЧЕСКИЕ ЗАПРЕТЫ:
- ❌ КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНЫ любые таблицы (никаких символов «|---|---|» или ASCII-колонок).
- ❌ ЗАПРЕЩЕНЫ длинные простыни текста, банальности («вам просто нужно поговорить») и заумная терминология.
- ❌ ЗАПРЕЩЕН ОФФТОП (программирование, рецепты, политика, ремонт): вежливо откажись в одно тёплое предложение и верни тему к отношениям и чувствам.

Контекст пары:
- Собеседник: ${partnerName}
- Партнёр: ${partner2Name}
- Дней вместе: ${coupleContext?.daysTogether || 1}
- Язык любви ${partnerName}: ${coupleContext?.user1?.loveLanguage || "не указан"}
- Язык любви ${partner2Name}: ${coupleContext?.user2?.loveLanguage || "не указан"}`;

    const groqMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((m: any) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.content,
      })),
    ];

    const groqReply = await callGroqChat(groqMessages);
    if (groqReply) {
      await saveAIMessageToDb(callerLogin, lastUserText, groqReply);
      return res.json({ reply: groqReply, mode: "openrouter" });
    }

    return res.status(503).json({
      error: "ИИ временно недоступен. Попробуйте позже.",
      mode: "error",
    });
  } catch (err: unknown) {
    console.error("[OpenRouter Gemma Error]:", err);
    return res.status(503).json({
      error: "ИИ временно недоступен. Попробуйте позже.",
      mode: "error",
    });
  }
});

aiRouter.post("/generate-report", aiLimiter, requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const coupleProfile = req.body?.coupleProfile || req.body?.coupleData?.coupleProfile || {
      partner1: { name: "Партнёр 1" },
      partner2: { name: "Партнёр 2" },
    };
    const pulseHistory = req.body?.pulseHistory || req.body?.coupleData?.pulseHistory || [];
    const tests = req.body?.tests || req.body?.coupleData?.tests || [];

    // 100% Deterministic Rule-based Psychology Engine (Zero LLM Hallucinations, <10ms response)
    const report = calculateCoupleAnalysis(coupleProfile, pulseHistory, tests);

    return res.status(200).json({
      success: true,
      title: report.archetypeTitle,
      summary: report.summary,
      strengths: report.strengths.map((s) => s.title),
      growthZones: report.growthZones.map((g) => g.title),
      gottmanTips: report.growthZones[0]?.gottmanExercise || "Практикуйте ежедневный 15-минутный ритуал «Разгрузка после рабочего дня».",
      report,
      source: "deterministic_engine",
    });
  } catch (err: unknown) {
    logger.error("Ошибка детерминированной генерации отчета пары", err);
    return res.status(500).json({ error: "FAILED_TO_GENERATE_DETERMINISTIC_REPORT" });
  }
});


aiRouter.post("/date-idea", aiLimiter, requireAuth, validateBody(aiDateIdeaSchema), async (req, res, next) => {
  try {
    const { budget, vibe, location, coupleProfile } = req.body;
    const prompt = `Придумай оригинальное свидание для пары в Loop:
Бюджет: ${budget || "умеренный"}
Атмосфера: ${vibe || "романтичная"}
Локация: ${location || "в городе или дома"}
Профиль: ${JSON.stringify(coupleProfile || {})}

Верни строго JSON:
{
  "title": "название свидания",
  "tagline": "короткий цепляющий слоган",
  "description": "описание сценария на 2-3 предложения",
  "prepSteps": ["шаг 1", "шаг 2"],
  "conversationStarters": ["вопрос для пары 1", "вопрос для пары 2"]
}`;

    const groqReply = await callGroqChat([
      { role: "system", content: "Ты — креативный продюсер свиданий и психолог отношений. Отвечай валидным JSON." },
      { role: "user", content: prompt },
    ]);

    if (groqReply) {
      try {
        const clean = groqReply.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        return res.json(JSON.parse(clean));
      } catch (err: unknown) {
        logger.warn("Сбой парсинга JSON ответа Groq для свидания", undefined, err);
      }
    }

    return res.json({
      title: "Гастрономическое путешествие вслепую",
      tagline: "Вкус, доверие и новые тактильные впечатления",
      description: "Один из вас надевает повязку на глаза, а второй угощает заранее подготовленными необычными вкусами (сыры, ягоды, шоколад с солью). Затем меняетесь ролями.",
      prepSteps: ["Купить 4-5 контрастных закусок", "Подготовить мягкую повязку на глаза", "Включить медленный джаз или эмбиент"],
      conversationStarters: ["Какой момент наших отношений был для тебя самым вкусным и ярким?", "Какое блюдо или поездка больше всего запомнились нам обоим?"],
    });
  } catch (err: unknown) {
    logger.error("Ошибка генерации свидания", err);
    return res.status(500).json({ error: "Ошибка генерации свидания" });
  }
});
