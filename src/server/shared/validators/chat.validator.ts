import { z } from "zod";
import { loginSchema } from "./auth.validator.ts";

export const chatMessageCreateSchema = z.object({
  coupleId: z.string().min(1).max(100).optional(),
  senderLogin: z.string().max(50).optional(),
  role: z.enum(["partner1", "partner2"]).optional(),
  mode: z.string().max(20).optional(),
  content: z.string().trim().min(1, "Сообщение не может быть пустым").max(2000, "Сообщение слишком длинное"),
});

export const aiChatMessageSchema = z.object({
  messages: z.array(
    z.object({
      role: z.string().min(1).max(20),
      content: z.string().min(1).max(4000),
    })
  ).min(1, "Список сообщений не может быть пустым"),
  userLogin: loginSchema.optional(),
  context: z.record(z.string(), z.unknown()).optional(),
  coupleContext: z.record(z.string(), z.unknown()).optional(),
  currentPartner: z.record(z.string(), z.unknown()).optional(),
});

export const aiReportSchema = z.object({
  coupleProfile: z.record(z.string(), z.unknown()).optional(),
  radarScores: z.record(z.string(), z.unknown()).optional(),
});

export const aiDateIdeaSchema = z.object({
  budget: z.string().max(50).optional(),
  vibe: z.string().max(50).optional(),
  location: z.string().max(100).optional(),
});
