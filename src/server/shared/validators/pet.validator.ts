import { z } from "zod";

export const petActionSchema = z.object({
  action: z.enum(["feed", "play", "sleep", "pet"]),
});

export const petRenameSchema = z.object({
  name: z.string().min(1, "Имя обязательно").max(20, "Имя слишком длинное (макс. 20 символов)"),
});
