# ngx-network-monitor

> A lightweight Angular service to monitor network status: online/offline, connection quality (2G/3G/4G/5G), and ping latency.

![npm](https://img.shields.io/npm/v/ngx-network-monitor)
![Angular](https://img.shields.io/badge/angular-compatible-brightgreen)
![License](https://img.shields.io/npm/l/ngx-network-monitor)

---

## 🚀 Features

- ✅ Detects `online`/`offline` events using the browser API
- ✅ Measures latency using configurable ping endpoint
- ✅ Monitors effective connection type (`5g`, `4g`, `3g`, etc.)
- ✅ Flags poor connections automatically
- ✅ SSR-compatible & configurable with `InjectionToken`

---

## 📦 Installation

```bash
npm install ngx-network-monitor
```
Or using Angular CLI:

```bash
ng add ngx-network-monitor
```
This will create a ping file in `src/assets/ping.txt` for you.

---

## 🔧 Setup
By default, the service pings `/assets/ping.txt` every few seconds (depending on browser connection support). You can customize the ping URL to a different static file, endpoint or url:

```ts
import { PING_URL } from 'ngx-network-monitor';

@NgModule({
  providers: [
    { provide: PING_URL, useValue: '/your-api/ping' }
  ]
})
export class AppModule {}
```

### ✅ Requirements for Ping Endpoint
Make sure your ping endpoint, url or file:
- Returns a `200` or `204` response
- Supports CORS (if it's on a different domain)
- Responds quickly

---

## 🧠 Usage

Inject the service and subscribe to network status changes:
```ts
import { NgxNetworkMonitorService, NetworkStatus } from 'ngx-network-monitor';

export class StatusComponent {
  status: NetworkStatus | null = null;

  constructor(private monitor: NgxNetworkMonitorService) {
    this.monitor.networkStatus$.subscribe((status) => {
      this.status = status;
    });
  }
}
```

---

### Full Usage Example:
```ts
import { Component } from '@angular/core';
import { NgxNetworkMonitorService, NetworkStatus } from 'ngx-network-monitor';

@Component({
  selector: 'app-status',
  template: `
    <div *ngIf="status">
      <p>✅ Online: {{ status.online }}</p>
      <p>⏱️ Latency: {{ status.latency }}ms</p>
      <p>📶 Connection Type: {{ status.effectiveType || 'unknown' }}</p>
      <p>⚠️ Poor Connection: {{ status.poorConnection }}</p>
    </div>
  `
})
export class StatusComponent {
  status: NetworkStatus | null = null;

  constructor(private monitor: NgxNetworkMonitorService) {
    this.monitor.networkStatus$.subscribe((status) => {
      this.status = status;
    });
  }
}
```

---

## 📁 Assets (for default setup)
Ensure this file exists in your app if using the default ping path:
```bash
src/assets/ping.txt
```

If you prefer to ping a different static file / endpoint / url, you can change the default value as mentioned in the "🔧 Setup" section: 

```ts
import { PING_URL } from 'ngx-network-monitor';

@NgModule({
  providers: [
    { provide: PING_URL, useValue: '/your-api/ping' }
  ]
})
export class AppModule {}
```
---

## ⚙️ Configuration Summary

| Feature         | Customizable       | Default                              |
| --------------- | ------------------ | ------------------------------------ |
| Ping URL        | ✅ `PING_URL` token | `/assets/ping.txt`              |
| Ping Interval   | ✅ auto-adjusts     | 10s (no connection API) / 60s (with) |
| Connection Type | ✅ uses browser API | Based on `navigator.connection`      |
| Poor Connection | ✅ auto-detected    | Slow type or latency > 1000ms        |

---

## 🧪 Development

```bash
# Run tests
ng test ngx-network-monitor

# Build for production
ng build ngx-network-monitor
```

---

## 🔒 License

MIT © MadeByRaymond
