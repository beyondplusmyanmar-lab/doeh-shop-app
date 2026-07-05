import { api, unwrap } from "./client";
import { consumer } from "./consumer";
import { DoehApiError } from "@beyondplusmm/doeh-consumer-sdk";

// W3: the edge-published loyalty surface rides the consumer SDK; coupons and
// join are not published yet and stay on the raw Core-direct seam. Screens
// see the exact same shapes as before (the SDK unwraps the same envelope).
export const getSettings = () => consumer.loyalty.settings();
export const getBalance = () => consumer.loyalty.balance();
export const getTransactions = async () => (await consumer.loyalty.transactions({ limit: 10 })).transactions;
export const getCoupons = async () => unwrap((await api("GET", "/mobile/loyalty/coupons")).data);
export const joinShop = async (code: string) => api("POST", `/mobile/shops/${code}/join`);
export const redeem = async (points: number) => {
  try {
    const data = await consumer.loyalty.redeem({ points });
    return { ok: true, status: 200, data, message: undefined as string | undefined };
  } catch (e) {
    const apiErr = e instanceof DoehApiError ? e : null;
    const message =
      (apiErr?.body as { message?: string } | undefined)?.message ??
      (e instanceof Error ? e.message : String(e));
    return { ok: false, status: apiErr?.status ?? 0, data: undefined, message };
  }
};
