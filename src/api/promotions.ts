import { api, unwrap } from "./client";
export const listPromotions = async () => unwrap((await api("GET", "/mobile/promotions")).data);
