import { InjectionToken } from '@angular/core';

export const PING_URL = new InjectionToken<string>('PING_URL', {
  providedIn: 'root',
  factory: () => '/assets/ping.txt', // Default fallback
});
