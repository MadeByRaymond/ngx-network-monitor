import { Inject, Injectable, NgZone, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject, interval, merge, fromEvent, of } from 'rxjs';
import { catchError, map, startWith, switchMap } from 'rxjs/operators';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { NETWORK_MONITOR_CONFIG } from './tokens/network-monitor-config.token';
import { NetworkMonitorConfig } from './models/network-monitor-config.model';

export interface NetworkStatus {
  online: boolean;
  latency: number | null;
  effectiveType?: string; // 4g, 3g, 2g, slow-2g (if supported)
  poorConnection: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NetworkMonitorService {
  private status$ = new BehaviorSubject<NetworkStatus>({
    online: true,
    latency: null,
    effectiveType: undefined,
    poorConnection: false,
  });
  
  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    private ngZone: NgZone,
    @Inject(PLATFORM_ID) platformId: Object,
    @Inject(NETWORK_MONITOR_CONFIG) private config: NetworkMonitorConfig
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    if (this.isBrowser) {
      this.initMonitoring();
    }

    this.config = { 
      // Ensuring default config merging.
      // To prevent overwrites of defaults of missing configurations to `undefined`
      pingUrl: '/assets/ping.txt',
      latencyThreshold: 1800,
      slowConnectionTypes: ['2g', 'slow-2g', '3g'],
      pingIntervalMs: 60000,
      fallbackPingIntervalMs: 10000,
      ...config
    };
  }



  /**
   * Observe network status changes / updates
   */
  get networkStatus$() {
    return this.status$.asObservable();
  }

  /**
   * Get the network current status. This returns a snapshot of the current value
   */
  get currentStatus(): NetworkStatus { // Exposing current status snapshot
    return this.status$.value;
  }

  private initMonitoring() {
    // ⬇ Take logic out of Angular with runOutsideAngular for performance
    this.ngZone.runOutsideAngular(() => {
      // Online/offline events
      merge(
        fromEvent(window, 'online'),
        fromEvent(window, 'offline')
      ).subscribe(() => {
        const status = this.status$.value;
        this.updateStatus({
          ...status,
          online: navigator.onLine,
        })
      });

      // Listen for connection type change
      const connection = this.getNavigatorConnection();
      const hasConnection = (!!connection && !!connection?.addEventListener)
      if (hasConnection) {
        connection.addEventListener('change', (e:any) => {
          const current = this.status$.value;
          this.updateStatus({
            ...current,
            effectiveType: e.currentTarget.effectiveType,
            poorConnection: this.isPoorConnection(e.currentTarget.effectiveType, current.latency),
          })
        });
      }

      // Fallback Periodic connection checks
      // every one min if navigator connection is available
      // 10 seconds otherwise
      const pollingInterval = hasConnection ? this.config.pingIntervalMs : this.config.fallbackPingIntervalMs;
      interval(pollingInterval)
        .pipe(startWith(0), switchMap(() => this.checkConnection()))
        .subscribe((status) => this.updateStatus(status));

    });
  }

  private updateStatus(value:NetworkStatus){
    const prev = this.status$.value;
    if (JSON.stringify(prev) !== JSON.stringify(value)){ //Emit only if status changed

      // ⬇ Bring it back into Angular so UI can update
      this.ngZone.run(() => {
        this.status$.next(value);
      });
    }
  }

  private checkConnection() {
    const connection = this.getNavigatorConnection();
    const effectiveType = connection?.effectiveType;
    const startTime = performance.now();

    return this.http.get(this.config.pingUrl!, 
      { responseType: 'text', headers: new HttpHeaders({ 'X-Heartbeat': 'true' }) }
    ).pipe(
      map(() => {
        const latency = performance.now() - startTime;
        const online = true;
        const poorConnection = this.isPoorConnection(effectiveType, latency);
        return { online, latency, effectiveType, poorConnection };
      }),
      catchError(() =>
        of({
          online: false,
          latency: null,
          effectiveType,
          poorConnection: true,
        })
      )
    );
  }

  private getNavigatorConnection(): any {
    return this.isBrowser
      ? (navigator as any)?.connection ||
          (navigator as any)?.mozConnection ||
          (navigator as any)?.webkitConnection
      : null;
  }

  private isPoorConnection(effectiveType: string | undefined, latency: number | null): boolean {
    return !navigator.onLine ||
      (effectiveType && this.config.slowConnectionTypes?.includes(effectiveType)) ||
      (latency !== null && latency > (this.config?.latencyThreshold || 1800));
  }

  /**
   * Manually trigger a network status check. This accepts an optional callback which returns the new status
   */
  runManualCheck(callback?:(status:NetworkStatus) => void) {
    this.checkConnection().subscribe((status) => {
      this.updateStatus(status);
      
      !!callback && callback(status)
    });
  }
}
