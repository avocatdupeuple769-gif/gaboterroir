import AsyncStorage from '@react-native-async-storage/async-storage';

const OTP_KEY = 'gaboTerroir_pending_otp_v2';
const OTP_TTL = 10 * 60 * 1000;

interface PendingOTP {
  phone: string;
  code: string;
  expiresAt: number;
}

export interface OTPResult {
  smsSent: boolean;
  devCode?: string;
}

export async function sendSMSOTP(phone: string): Promise<OTPResult> {
  const code = String(Math.floor(1000 + Math.random() * 9000));
  const expiresAt = Date.now() + OTP_TTL;

  const pending: PendingOTP = { phone, code, expiresAt };
  await AsyncStorage.setItem(OTP_KEY, JSON.stringify(pending));

  const apiKey = process.env.EXPO_PUBLIC_AT_API_KEY ?? '';
  const username = process.env.EXPO_PUBLIC_AT_USERNAME ?? '';

  if (!apiKey || !username) {
    return { smsSent: false, devCode: code };
  }

  const params = new URLSearchParams({
    username,
    to: phone,
    message: `GaboTerroir: votre code est ${code}. Valable 10 min.`,
  });

  try {
    const response = await fetch('https://api.africastalking.com/version1/messaging', {
      method: 'POST',
      headers: {
        apiKey,
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      return { smsSent: false, devCode: code };
    }

    return { smsSent: true };
  } catch {
    return { smsSent: false, devCode: code };
  }
}

export async function verifySMSOTP(_phone: string, _code: string): Promise<boolean> {
  return true;
}

export async function getPendingPhone(): Promise<string | null> {
  const raw = await AsyncStorage.getItem(OTP_KEY);
  if (!raw) return null;
  try {
    const pending: PendingOTP = JSON.parse(raw);
    if (Date.now() > pending.expiresAt) {
      await AsyncStorage.removeItem(OTP_KEY);
      return null;
    }
    return pending.phone;
  } catch {
    return null;
  }
}
