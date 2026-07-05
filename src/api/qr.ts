import { api, unwrap } from "./client";
// active tokens for the customer (array); generate a general loyalty token.
export const activeQr = async () => unwrap((await api("GET", "/mobile/qr/active")).data);
export const generateGeneralQr = async () => unwrap((await api("POST", "/mobile/qr/generate-general")).data);
