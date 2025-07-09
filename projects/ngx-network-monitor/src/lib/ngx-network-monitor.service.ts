import { Inject, Injectable, NgZone, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject, interval, merge, fromEvent, of } from 'rxjs';
import { catchError, map, startWith, switchMap } from 'rxjs/operators';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { PING_URL } from './tokens/ping-url.token';

export interface NetworkStatus {
  online: boolean;
  latency: number | null;
  effectiveType?: string; // 4g, 3g, 2g, slow-2g (if supported)
  poorConnection: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NgxNetworkMonitorService {
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
    @Inject(PING_URL) private pingUrl: string
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    if (this.isBrowser) {
      this.initMonitoring();
    }
  }

  get networkStatus$() {
    return this.status$.asObservable();
  }

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
      if (!!connection) {
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
      const pollingInterval = connection ? 60000 : 10000;
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

    return this.http.get(this.pingUrl, 
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
      ? (navigator as any).connection ||
          (navigator as any).mozConnection ||
          (navigator as any).webkitConnection
      : null;
  }

  private isPoorConnection(effectiveType: string | undefined, latency: number | null): boolean {
    const slowTypes = ['2g', 'slow-2g', '3g'];
    
    return !navigator.onLine ||
      (effectiveType && slowTypes.includes(effectiveType)) ||
      (latency !== null && latency > 1000);
  }

  runManualCheck(): void {
    this.checkConnection().subscribe((status) => this.updateStatus(status));
  }
}
