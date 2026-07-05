import { api, unwrap } from "./client";
import { SHOP_CODE } from "@/config/shop";
export const myBookings = async () => unwrap((await api("GET", "/mobile/bookings/my")).data);
export const branches = async () => unwrap((await api("GET", `/mobile/shops/${SHOP_CODE}/branches`)).data);
export const availability = async (branchId: number, date: string) =>
  unwrap((await api("GET", `/mobile/bookings/availability?branch_id=${branchId}&date=${date}`)).data);
export const createBooking = async (b: {
  branch_id: number; booking_date: string; start_time: string; end_time: string; service_type?: string;
}) => {
  const r = await api("POST", "/mobile/bookings", b);
  return { ok: r.status === 200 || r.status === 201, status: r.status, data: unwrap(r.data), message: r.data?.message };
};
export const cancelBooking = async (id: number) => {
  const r = await api("POST", `/mobile/bookings/${id}/cancel`);
  return { ok: r.status === 200, status: r.status, message: r.data?.message };
};
