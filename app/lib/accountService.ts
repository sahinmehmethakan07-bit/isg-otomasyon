/**
 * accountService.ts — Müşteri Hesap Yönetimi
 *
 * Firestore rules'ı bypass etmek için tüm işlemler
 * Firebase Admin SDK kullanan API route'ları üzerinden yapılır.
 */

import { auth } from "../../lib/firebase";
import type { PlanId } from "./plans";

export type Account = {
  id: string;
  name: string;
  plan: PlanId;
  companyIds: string[];
  createdAt: any;
};

async function getToken(): Promise<string> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("Oturum doğrulaması gerekli.");
  return token;
}

export async function getAllAccounts(): Promise<Account[]> {
  const token = await getToken();
  const res = await fetch("/api/admin/accounts", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Hesaplar yüklenemedi.");
  return data.accounts as Account[];
}

export async function createAccount(payload: {
  name: string;
  plan: PlanId;
  companyIds: string[];
}): Promise<Account> {
  const token = await getToken();
  const res = await fetch("/api/admin/accounts", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Hesap oluşturulamadı.");
  return data.account as Account;
}

export async function updateAccount(
  id: string,
  patch: Partial<Pick<Account, "name" | "plan" | "companyIds">>
): Promise<void> {
  const token = await getToken();
  const res = await fetch(`/api/admin/accounts/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(patch),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Hesap güncellenemedi.");
}

export async function deleteAccount(id: string): Promise<void> {
  const token = await getToken();
  const res = await fetch(`/api/admin/accounts/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Hesap silinemedi.");
}
