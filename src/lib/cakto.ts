interface CaktoSubscription {
  id: string;
  status: 'active' | 'inactive' | 'cancelled';
  plan: string;
  expires_at: string;
  subscriber_id: string;
}

interface CaktoApiResponse {
  success: boolean;
  data?: CaktoSubscription;
  error?: string;
}

const CAKTO_API_KEY = 'a9a9632c-0d1f-4886-ae83-af3213a68c0d';
const CAKTO_BASE_URL = 'https://api.cakto.com.br/v1';

export class CaktoService {
  private static async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    try {
      const response = await fetch(`${CAKTO_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Authorization': `Bearer ${CAKTO_API_KEY}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        console.warn(`Cakto API warning: ${response.status} - ${response.statusText}`);
        // Return null instead of throwing to prevent blocking
        return null;
      }

      return await response.json();
    } catch (error) {
      console.warn('Cakto API not available, continuing without subscription sync:', error);
      // Return null instead of throwing to prevent blocking
      return null;
    }
  }

  static async checkSubscription(email: string): Promise<CaktoApiResponse> {
    try {
      const response = await this.makeRequest(`/subscriptions/check?email=${encodeURIComponent(email)}`);
      
      if (!response) {
        return {
          success: false,
          error: 'Cakto API not available'
        };
      }

      return {
        success: true,
        data: response.subscription
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  static async getSubscriptionByEmail(email: string): Promise<CaktoSubscription | null> {
    try {
      const result = await this.checkSubscription(email);
      return result.success ? result.data || null : null;
    } catch (error) {
      console.warn('Error getting subscription, continuing without:', error);
      return null;
    }
  }

  static async syncSubscriptionStatus(email: string): Promise<boolean> {
    try {
      const subscription = await this.getSubscriptionByEmail(email);
      
      if (!subscription) {
        return false;
      }

      return subscription.status === 'active';
    } catch (error) {
      console.warn('Error syncing subscription, continuing without:', error);
      return false;
    }
  }
}