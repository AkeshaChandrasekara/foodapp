import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Notification {
  id: number;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notifications: Notification[] = [];
  private notificationSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationSubject.asObservable();
  private idCounter = 0;

  showSuccess(message: string, duration: number = 3000) {
    this.addNotification({
      id: ++this.idCounter,
      type: 'success',
      message,
      duration
    });
  }

  showError(message: string, duration: number = 4000) {
    this.addNotification({
      id: ++this.idCounter,
      type: 'error',
      message,
      duration
    });
  }

  showInfo(message: string, duration: number = 3000) {
    this.addNotification({
      id: ++this.idCounter,
      type: 'info',
      message,
      duration
    });
  }

  showWarning(message: string, duration: number = 3000) {
    this.addNotification({
      id: ++this.idCounter,
      type: 'warning',
      message,
      duration
    });
  }

  private addNotification(notification: Notification) {
    this.notifications.push(notification);
    this.notificationSubject.next([...this.notifications]);

    // Auto remove after duration
    if (notification.duration) {
      setTimeout(() => {
        this.removeNotification(notification.id);
      }, notification.duration);
    }
  }

  removeNotification(id: number) {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.notificationSubject.next([...this.notifications]);
  }

  clearAll() {
    this.notifications = [];
    this.notificationSubject.next([]);
  }
}
