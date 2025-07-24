declare module 'web-push' {
  export interface PushSubscription {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  }

  export interface SendResult {
    statusCode: number;
    body: string;
    headers: { [key: string]: string };
  }

  export interface VapidKeys {
    publicKey: string;
    privateKey: string;
  }

  export function generateVAPIDKeys(): VapidKeys;
  
  export function setVapidDetails(
    subject: string,
    publicKey: string,
    privateKey: string
  ): void;
  
  export function sendNotification(
    subscription: PushSubscription,
    payload?: string | Buffer | null,
    options?: {
      headers?: { [key: string]: string };
      gcmAPIKey?: string;
      vapidDetails?: {
        subject: string;
        publicKey: string;
        privateKey: string;
      };
      TTL?: number;
      contentEncoding?: string;
      proxy?: string;
      agent?: any;
      timeout?: number;
    }
  ): Promise<SendResult>;
}