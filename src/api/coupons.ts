import { api, unwrap } from "./client";
export const myCoupons = async () => unwrap((await api("GET", "/mobile/loyalty/coupons")).data);
export const couponHistory = async () => unwrap((await api("GET", "/mobile/coupons/history")).data);
