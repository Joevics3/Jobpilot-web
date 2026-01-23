import * as admin from 'firebase-admin';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client to access secrets
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function getFirebaseCredentials() {
  // Fetch secrets from Supabase Vault
  const { data: privateKeyData } = await supabase.rpc('vault_get_secret', {
    secret_name: 'FIREBASE_PRIVATE_KEY'
  });
  
  const { data: clientEmailData } = await supabase.rpc('vault_get_secret', {
    secret_name: 'FIREBASE_CLIENT_EMAIL'
  });

  return {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    clientEmail: clientEmailData?.secret || '',
    privateKey: privateKeyData?.secret || '',
  };
}

// Initialize Firebase Admin
let firebaseInitialized = false;

async function initializeFirebaseAdmin() {
  if (!firebaseInitialized && !admin.apps.length) {
    const credentials = await getFirebaseCredentials();
    
    admin.initializeApp({
      credential: admin.credential.cert(credentials),
    });
    
    firebaseInitialized = true;
  }
}

export async function getMessaging() {
  await initializeFirebaseAdmin();
  return admin.messaging();
}

export async function sendNotification(
  token: string,
  title: string,
  body: string,
  data?: { [key: string]: string }
) {
  try {
    const messaging = await getMessaging();
    
    const message = {
      token,
      notification: {
        title,
        body,
      },
      data: data || {},
      webpush: {
        notification: {
          icon: '/android-chrome-192x192.png',
          badge: '/android-chrome-192x192.png',
          vibrate: [200, 100, 200],
        },
      },
    };

    const response = await messaging.send(message);
    console.log('✅ Notification sent:', response);
    return { success: true, messageId: response };
  } catch (error) {
    console.error('❌ Error sending notification:', error);
    return { success: false, error };
  }
}
