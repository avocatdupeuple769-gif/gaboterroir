import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

// How notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerPushToken(userId: string): Promise<string | null> {
  if (!Device.isDevice && Platform.OS !== 'web') {
    console.log('Push notifications require a physical device');
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permission denied');
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: '0710c44c-5c81-4c1f-b074-25efcbd54d43',
    });
    const token = tokenData.data;

    // Save token to Firestore
    try {
      await updateDoc(doc(db, 'users', userId), { pushToken: token });
    } catch (e) {
      console.warn('Failed to save push token:', e);
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('gaboTerroir', {
        name: 'GaboTerroir',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#1B6B3A',
        sound: 'default',
      });
    }

    return token;
  } catch (e) {
    console.warn('Error registering push token:', e);
    return null;
  }
}

// Send push notification via Expo Push API
async function sendExpoPush(token: string, title: string, body: string, data?: object) {
  if (!token || !token.startsWith('ExponentPushToken')) return;
  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        to: token,
        title,
        body,
        data: data ?? {},
        sound: 'default',
        priority: 'high',
        channelId: 'gaboTerroir',
      }),
    });
  } catch (e) {
    console.warn('Push send failed:', e);
  }
}

// Fetch user's push token from Firestore
async function getUserToken(userId: string): Promise<string | null> {
  try {
    const { getDoc, doc: firestoreDoc } = await import('firebase/firestore');
    const snap = await getDoc(firestoreDoc(db, 'users', userId));
    return snap.exists() ? (snap.data()?.pushToken ?? null) : null;
  } catch {
    return null;
  }
}

// ---- Notification triggers ----

export async function notifySellerNewOrder(
  sellerId: string,
  buyerName: string,
  productName: string,
  amount: number
) {
  const token = await getUserToken(sellerId);
  if (token) {
    await sendExpoPush(
      token,
      '🛒 Nouvelle commande !',
      `${buyerName} a commandé "${productName}" — ${amount.toLocaleString('fr-FR')} FCFA`,
      { type: 'new_order', sellerId }
    );
  }
}

export async function notifyBuyerSellerConfirmed(
  buyerId: string,
  productName: string,
  vendeurNom: string
) {
  const token = await getUserToken(buyerId);
  if (token) {
    await sendExpoPush(
      token,
      '✅ Commande confirmée par le vendeur',
      `${vendeurNom} a confirmé votre commande de "${productName}". Livraison en cours.`,
      { type: 'seller_confirmed', buyerId }
    );
  }
}

export async function notifyBuyerDeliveryReady(
  buyerId: string,
  productName: string,
  codeEscrow: string
) {
  const token = await getUserToken(buyerId);
  if (token) {
    await sendExpoPush(
      token,
      '📦 Livraison arrivée !',
      `"${productName}" vous a été livré. Entrez votre code séquestre ${codeEscrow} pour confirmer.`,
      { type: 'delivery_ready', buyerId }
    );
  }
}

export async function notifySellerPaymentReleased(
  sellerId: string,
  productName: string,
  amount: number
) {
  const token = await getUserToken(sellerId);
  if (token) {
    await sendExpoPush(
      token,
      '💰 Paiement libéré !',
      `L'acheteur a confirmé la réception de "${productName}". ${amount.toLocaleString('fr-FR')} FCFA déposés dans votre wallet.`,
      { type: 'payment_released', sellerId }
    );
  }
}

// Local notification (no token needed — immediate in-app alert)
export async function scheduleLocalNotification(title: string, body: string) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: 'default' },
      trigger: null,
    });
  } catch (e) {
    console.warn('Local notification failed:', e);
  }
}
