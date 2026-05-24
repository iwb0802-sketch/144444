type OtpRecord = {
  code: string;
  expiresAt: number;
  verified: boolean;
};

const globalForOtp = globalThis as unknown as {
  otpStore?: Map<string, OtpRecord>;
};

export const otpStore = globalForOtp.otpStore ?? new Map<string, OtpRecord>();
globalForOtp.otpStore = otpStore;

export function normalizePhone(phone: string) {
  return String(phone || "").replace(/[^0-9]/g, "");
}

export function createOtp(phone: string) {
  const normalized = normalizePhone(phone);
  const code = String(Math.floor(100000 + Math.random() * 900000));
  otpStore.set(normalized, {
    code,
    expiresAt: Date.now() + 3 * 60 * 1000,
    verified: false
  });
  return code;
}

export function verifyOtp(phone: string, code: string) {
  const normalized = normalizePhone(phone);
  const record = otpStore.get(normalized);
  if (!record) return { ok: false, message: "인증번호를 먼저 발송해주세요." };
  if (Date.now() > record.expiresAt) {
    otpStore.delete(normalized);
    return { ok: false, message: "인증번호가 만료되었습니다. 다시 발송해주세요." };
  }
  if (record.code !== String(code || "").trim()) {
    return { ok: false, message: "인증번호가 올바르지 않습니다." };
  }
  record.verified = true;
  otpStore.set(normalized, record);
  return { ok: true };
}

export function isOtpVerified(phone: string) {
  const normalized = normalizePhone(phone);
  const record = otpStore.get(normalized);
  if (!record) return false;
  if (Date.now() > record.expiresAt) {
    otpStore.delete(normalized);
    return false;
  }
  return record.verified;
}

export function clearOtp(phone: string) {
  otpStore.delete(normalizePhone(phone));
}
