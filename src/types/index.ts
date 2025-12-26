export * from './election';
export * from './contract';

export type NotificationType = 'success' | 'error' | 'info';

export type UserRole = 'admin' | 'user' | null;

export interface NotificationConfig {
    message: string;
    type: NotificationType;
}
