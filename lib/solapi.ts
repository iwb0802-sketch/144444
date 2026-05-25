import crypto from "crypto";

function makeAuthorization(apiKey: string, apiSecret: string) {
  const date = new Date().toISOString();
  const salt = crypto.randomBytes(16).toString("hex");
  const signature = crypto
    .createHmac("sha256", apiSecret)
    .update(date + salt)
    .digest("hex");

  return `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`;
}

export async function sendSolapiSms(toRaw: string, text: string) {
  const apiKey = process.env.SOLAPI_API_KEY || "";
  const apiSecret = process.env.SOLAPI_API_SECRET || "";
  const from = (process.env.SOLAPI_FROM || "").replace(/[^0-9]/g, "");
  const to = String(toRaw || "").replace(/[^0-9]/g, "");

  if (!apiKey || !apiSecret || !from || !to) {
    return {
      ok: false,
      message: "SOLAPI 환경변수 또는 전화번호가 없습니다.",
      debug: { hasApiKey: !!apiKey, hasApiSecret: !!apiSecret, hasFrom: !!from, hasTo: !!to }
    };
  }

  const res = await fetch("https://api.solapi.com/messages/v4/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": makeAuthorization(apiKey, apiSecret)
    },
    body: JSON.stringify({
      message: { to, from, text }
    })
  });

  const result = await res.json().catch(() => ({}));

  if (!res.ok) {
    console.error("SOLAPI send failed", result);
    return { ok: false, result };
  }

  return { ok: true, result };
}
