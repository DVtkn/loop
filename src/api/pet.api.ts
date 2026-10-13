import { 
  CouplePetState, 
  PetActionResult, 
  PetActionType, 
  PetBirthRequest,
  PetNameProposal,
  PetNameConfirm,
  PetSwitchRequest,
  PetSpecies
} from "../types.ts";

const API_BASE = import.meta.env.VITE_API_BASE || "";

function getErrorMessage(err: any): string {
  return err.error || err.message || "Неизвестная ошибка";
}

async function fetchWithAuth(endpoint: string, options: RequestInit, token: string) {
  const res = await fetch(`${API_BASE}/api/pet${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(getErrorMessage(err));
  }
  return res.json();
}

export async function getPetStateApi(token: string): Promise<CouplePetState> {
  return fetchWithAuth("", { method: "GET" }, token);
}

export async function birthPetApi(data: PetBirthRequest, token: string): Promise<CouplePetState> {
  return fetchWithAuth("/birth", { method: "POST", body: JSON.stringify(data) }, token);
}

export async function performPetActionApi(
  action: PetActionType,
  token: string
): Promise<PetActionResult> {
  return fetchWithAuth("/action", { method: "POST", body: JSON.stringify({ action }) }, token);
}

export async function proposePetNameApi(data: PetNameProposal, token: string): Promise<CouplePetState> {
  return fetchWithAuth("/propose-name", { method: "POST", body: JSON.stringify(data) }, token);
}

export async function confirmPetNameApi(data: PetNameConfirm, token: string): Promise<CouplePetState> {
  return fetchWithAuth("/confirm-name", { method: "POST", body: JSON.stringify(data) }, token);
}

export async function switchPetSpeciesApi(data: PetSwitchRequest, token: string): Promise<CouplePetState> {
  return fetchWithAuth("/switch", { method: "PATCH", body: JSON.stringify(data) }, token);
}