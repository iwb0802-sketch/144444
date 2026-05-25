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
    const missing = [
      !apiKey ? "SOLAPI_API_KEY" : "",
      !apiSecret ? "SOLAPI_API_SECRET" : "",
      !from ? "SOLAPI_FROM" : "",
      !to ? "수신번호" : ""
    ].filter(Boolean).join(", ");

    return {
      ok: false,
      message: `문자 발송 설정이 부족합니다: ${missing}`
    };
  }

  try {
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
      const reason =
        result?.errorMessage ||
        result?.message ||
        result?.errorCode ||
        JSON.stringify(result);

      return {
        ok: false,
        message: `Solapi 발송 실패: ${reason}`,
        result
      };
    }

    return { ok: true, result };
  } catch (error) {
    console.error("SOLAPI network failed", error);
    return {
      ok: false,
      message: `Solapi 요청 오류: ${String(error)}`
    };
  }
}
