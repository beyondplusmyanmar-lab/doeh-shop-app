import { api, unwrap } from "./client";
import { session } from "@/store/session";
export async function login(email: string, password: string) {
  const r = await api("POST", "/mobile/auth/login", { email, password });
  const d = unwrap(r.data);
  const token = d?.token ?? r.data?.token;
  if (token) await session.set(token);
  return { ok: r.status === 200 && !!token, token, customer: d?.customer, status: r.status, raw: r.data };
}
export async function logout() { await session.clear(); }
export const me = async () => unwrap((await api("GET", "/mobile/auth/me")).data);
