import { logger } from "../lib/logger.js";

const AT_API_KEY = process.env.AT_API_KEY ?? "";
const AT_USERNAME = process.env.AT_USERNAME ?? "sandbox";
const AT_BASE_URL = AT_USERNAME === "sandbox"
  ? "https://api.sandbox.africastalking.com"
  : "https://api.africastalking.com";

export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendSMS(to: string, message: string): Promise<SMSResult> {
  if (!AT_API_KEY || AT_API_KEY === "") {
    logger.warn({ to, message }, "Africa's Talking API key not configured — SMS not sent");
    return { success: false, error: "AT_API_KEY non configuré" };
  }

  const phone = to.startsWith("+") ? to : `+241${to.replace(/^0/, "")}`;

  try {
    const params = new URLSearchParams({
      username: AT_USERNAME,
      to: phone,
      message,
      from: "GaboTerroir",
    });

    const response = await fetch(`${AT_BASE_URL}/version1/messaging`, {
      method: "POST",
      headers: {
        apiKey: AT_API_KEY,
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const data = await response.json() as { SMSMessageData?: { Recipients?: { messageId: string; status: string }[] } };
    const recipient = data.SMSMessageData?.Recipients?.[0];

    if (recipient?.status === "Success") {
      logger.info({ to: phone, messageId: recipient.messageId }, "SMS sent successfully");
      return { success: true, messageId: recipient.messageId };
    }

    logger.warn({ to: phone, data }, "SMS sending failed");
    return { success: false, error: `Statut: ${recipient?.status}` };
  } catch (err) {
    logger.error({ err, to }, "SMS send error");
    return { success: false, error: String(err) };
  }
}

export async function sendBulkSMS(recipients: string[], message: string): Promise<SMSResult[]> {
  return Promise.all(recipients.map((tel) => sendSMS(tel, message)));
}
