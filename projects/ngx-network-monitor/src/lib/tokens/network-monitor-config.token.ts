import { InjectionToken } from '@angular/core';
import { NetworkMonitorConfig } from '../models/network-monitor-config.model';

export const NETWORK_MONITOR_CONFIG = new InjectionToken<NetworkMonitorConfig>('NETWORK_MONITOR_CONFIG', {
  providedIn: 'root',
  factory: (): NetworkMonitorConfig => ({
    pingUrl: '/assets/ping.txt',
    latencyThreshold: 1800,
    slowConnectionTypes: ['2g', 'slow-2g', '3g'],
    pingIntervalMs: 60000,
    fallbackPingIntervalMs: 10000
  }),
});
