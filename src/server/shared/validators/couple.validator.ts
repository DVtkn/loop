import { z } from "zod";
import { loginSchema } from "./auth.validator.ts";

export const coupleSyncSchema = z.object({
  login1: loginSchema,
  login2: loginSchema.optional().nullable(),
  coupleId: z.string().optional().nullable(),
  payload: z.record(z.string(), z.unknown()),
});

export const inviteCodeSchema = z.object({});

export const joinInviteSchema = z.object({
  code: z.string().min(6, "Код слишком короткий").max(20, "Код слишком длинный"),
});
