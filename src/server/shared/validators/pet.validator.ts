import { z } from "zod";

export const petBirthSchema = z.object({
  species: z.enum(["dog", "cat"]),
  name: z.string().min(1, "Имя обязательно").max(50, "Имя слишком длинное"),
});

export const petActionSchema = z.object({
  action: z.enum(["feed", "play", "wash", "sleep", "hug"]),
});

export const petProposeNameSchema = z.object({
  name: z.string().min(1, "Имя обязательно").max(50, "Имя слишком длинное"),
});

export const petConfirmNameSchema = z.object({
  confirm: z.boolean(),
});

export const petSwitchSchema = z.object({
  species: z.enum(["dog", "cat"]),
});