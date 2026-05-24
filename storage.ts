
import { ContractData } from "./types";

const KEY = "inus_contracts_lite";

export function getContracts(): ContractData[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveContract(data: ContractData) {
  const list = getContracts();
  localStorage.setItem(KEY, JSON.stringify([data, ...list]));
}

export function getContract(id: string) {
  return getContracts().find((x) => x.id === id);
}
