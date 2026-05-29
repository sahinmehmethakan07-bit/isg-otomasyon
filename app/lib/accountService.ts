/**
 * accountService.ts — Müşteri Hesap Yönetimi
 *
 * Her müşteri bir "account" — adı, paketi ve bağlı firmaları var.
 * Kullanıcılar accountId ile hesaba bağlanır.
 */

import { db } from "../../lib/firebase";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import type { PlanId } from "./plans";

export type Account = {
  id: string;
  name: string;
  plan: PlanId;
  companyIds: string[];
  createdAt: any;
};

export async function getAllAccounts(): Promise<Account[]> {
  const snap = await getDocs(collection(db, "accounts"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Account));
}

export async function createAccount(data: {
  name: string;
  plan: PlanId;
  companyIds: string[];
}): Promise<Account> {
  const ref = doc(collection(db, "accounts"));
  const payload = {
    name: data.name,
    plan: data.plan,
    companyIds: data.companyIds,
    createdAt: serverTimestamp(),
  };
  await setDoc(ref, payload);
  return { id: ref.id, ...payload };
}

export async function updateAccount(
  id: string,
  data: Partial<Pick<Account, "name" | "plan" | "companyIds">>
): Promise<void> {
  await updateDoc(doc(db, "accounts", id), data as any);
}

export async function deleteAccount(id: string): Promise<void> {
  await deleteDoc(doc(db, "accounts", id));
}
