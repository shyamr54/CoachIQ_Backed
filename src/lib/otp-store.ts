import NodeCache from "node-cache";

import { config } from "./config";

interface OtpEntry {
  otp: string;
  phone: string;
}

const otpStore = new NodeCache({
  stdTTL: config.otpTtlSeconds,
  checkperiod: Math.max(60, Math.floor(config.otpTtlSeconds / 2))
});

function buildOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function issueOtp(phone: string) {
  const otp = buildOtp();
  otpStore.set<OtpEntry>(phone, { otp, phone });
  return {
    otp,
    ttlSeconds: config.otpTtlSeconds
  };
}

export function verifyOtp(phone: string, otp: string) {
  const stored = otpStore.get<OtpEntry>(phone);

  if (!stored || stored.otp !== otp) {
    return false;
  }

  otpStore.del(phone);
  return true;
}

