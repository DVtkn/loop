import { CouplePetState, PetActionResult, PetActionType } from "../types.ts";

const API_BASE = "";

export async function getPetStateApi(token: string): Promise<CouplePetState> {
  const res = await fetch(`${API_BASE}/api/pet/state`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Ошибка получения состояния питомца");
  }
  return res.json();
}

export async function performPetActionApi(
  action: PetActionType,
  token: string
): Promise<PetActionResult> {
  const res = await fetch(`${API_BASE}/api/pet/action`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ action }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Ошибка выполнения действия");
  }
  return res.json();
}

export async function renamePetApi(name: string, token: string): Promise<CouplePetState> {
  const res = await fetch(`${API_BASE}/api/pet/rename`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Ошибка переименования питомца");
  }
  return res.json();
}
