// src/services/pushNotificationService.js

const VAPID_PUBLIC_KEY = 'BIh1Cog1kzc4ODVY6FSxAlRno07/AiYgysXsqrPCp/LfpsOkhxwo+LjgDcsyoL2HesYbuk4t6Bq2NFNlfX3Ac/s=';

class PushNotificationService {
  constructor() {
    this.registration = null;
    this.subscription = null;
    this.userId = 'default-user';
  }

  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  isSupported() {
    return (
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  }

  async requestPermission() {
    if (!this.isSupported()) {
      console.error('Push notifications are not supported');
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  async registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service Worker is not supported');
    }

    try {
      this.registration = await navigator.serviceWorker.register('/service-worker.js');
      console.log('Service Worker registered:', this.registration);
      
      await navigator.serviceWorker.ready;
      console.log('Service Worker is ready');
      
      return this.registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      throw error;
    }
  }

  async subscribe() {
    try {
      if (!this.registration) {
        this.registration = await this.registerServiceWorker();
      }

      const existingSubscription = await this.registration.pushManager.getSubscription();
      if (existingSubscription) {
        console.log('Already subscribed:', existingSubscription);
        this.subscription = existingSubscription;
        return existingSubscription;
      }

      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      console.log('Push subscription created:', subscription);
      this.subscription = subscription;

      await this.sendSubscriptionToBackend(subscription);

      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      throw error;
    }
  }

  async sendSubscriptionToBackend(subscription) {
    try {
      const response = await fetch('http://localhost:8000/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: this.userId,
          subscription: subscription.toJSON()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send subscription to backend');
      }

      const data = await response.json();
      console.log('Subscription sent to backend:', data);
      return data;
    } catch (error) {
      console.error('Error sending subscription to backend:', error);
      throw error;
    }
  }

  async unsubscribe() {
    try {
      if (!this.subscription) {
        const registration = await navigator.serviceWorker.ready;
        this.subscription = await registration.pushManager.getSubscription();
      }

      if (this.subscription) {
        await this.subscription.unsubscribe();
        console.log('Unsubscribed from push notifications');

        await fetch('http://localhost:8000/unsubscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ user_id: this.userId })
        });

        this.subscription = null;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
      throw error;
    }
  }

  async sendTestNotification() {
    try {
      const response = await fetch(`http://localhost:8000/send-test-notification?user_id=${this.userId}`, {
        method: 'POST'
      });

      const data = await response.json();
      console.log('Test notification sent:', data);
      return data;
    } catch (error) {
      console.error('Failed to send test notification:', error);
      throw error;
    }
  }

  async getUpcomingReminders() {
    try {
      const response = await fetch(`http://localhost:8000/upcoming-reminders/${this.userId}`);
      const data = await response.json();
      return data.reminders || [];
    } catch (error) {
      console.error('Failed to get upcoming reminders:', error);
      return [];
    }
  }

  async schedulePlanReminders(planId) {
    try {
      const response = await fetch(
        `http://localhost:8000/schedule-plan-reminders/${planId}?user_id=${this.userId}`,
        { method: 'POST' }
      );

      if (!response.ok) {
        throw new Error('Failed to schedule reminders');
      }

      const data = await response.json();
      console.log('Plan reminders scheduled:', data);
      return data;
    } catch (error) {
      console.error('Failed to schedule plan reminders:', error);
      throw error;
    }
  }

  async enablePushNotifications() {
    try {
      if (!this.isSupported()) {
        throw new Error('مرورگر شما از Push Notification پشتیبانی نمی‌کند');
      }

      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        throw new Error('کاربر مجوز نداد');
      }

      await this.registerServiceWorker();

      await this.subscribe();

      setTimeout(() => {
        this.sendTestNotification();
      }, 1000);

      return {
        success: true,
        message: 'Push Notifications فعال شد!'
      };
    } catch (error) {
      console.error('Failed to enable push notifications:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async checkStatus() {
    try {
      const permission = Notification.permission;
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = registration 
        ? await registration.pushManager.getSubscription()
        : null;

      return {
        permission,
        hasServiceWorker: !!registration,
        isSubscribed: !!subscription,
        subscription
      };
    } catch (error) {
      console.error('Failed to check status:', error);
      return {
        permission: 'default',
        hasServiceWorker: false,
        isSubscribed: false
      };
    }
  }
}

const pushNotificationService = new PushNotificationService();
export default pushNotificationService;