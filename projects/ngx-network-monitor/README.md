# ngx-network-monitor

> A lightweight Angular service to monitor network status: online/offline, connection quality (2G/3G/4G/5G), and ping latency.

![npm](https://img.shields.io/npm/v/ngx-network-monitor)
![Angular](https://img.shields.io/badge/angular-compatible-brightgreen)
![NPM Downloads](https://img.shields.io/npm/d18m/ngx-network-monitor)
![License](https://img.shields.io/npm/l/ngx-network-monitor)

**The best way to quickly integrate network monitoring with Angular.**
Note that this package has been optimized to work best with Angular, but you can still use [network-monitor-js](https://www.npmjs.com/package/network-monitor-js) for your project if your prefer to work with vanilla JS/TS.

---

## 🚀 Features

- ✅ Detects `online`/`offline` events using the browser API
- ✅ Measures latency using configurable ping endpoint
- ✅ Monitors effective connection type (`5g`, `4g`, `3g`, etc.)
- ✅ Flags poor connections automatically
- ✅ SSR-compatible & fully configurable via `NetworkMonitorConfig`
- ✅ Simple setup with `ng add` (auto-generates a ping file)

---

## 📦 Installation

```bash
npm install ngx-network-monitor
```
Or using Angular CLI:

```bash
ng add ngx-network-monitor
```
This will create a ping file in `src/assets/ping.txt` for you, assuming _`src/assets/**`_ is a static file directory.

---

## 🔧 Setup
By default, the service pings `/assets/ping.txt` every few seconds (depending on browser connection support). You can customize the ping URL to a different static file, endpoint or url:

```ts
import { NetworkMonitorConfig, NETWORK_MONITOR_CONFIG } from 'ngx-network-monitor';

@NgModule({
  providers: [
    {
      provide: NETWORK_MONITOR_CONFIG,
      useValue: {
        pingUrl: '/your-api/ping',
        poorConnectionLatency: 1800, // ms
        // ...other configuration settings
      } as NetworkMonitorConfig
    }
  ]
})
export class AppModule {}
```
### Additional Configurations:
Additional configuration settings can be provided to customize how network connection is monitored:
| Property                      | Description | Required? | Default |
| ----------------------------- | ----------- | -------- | ------- |
| pingUrl  | The URL to ping when checking connectivity. This should point to a small, cacheable file (e.g. a static file, endpoint or url) | optional | `/assets/ping.txt` |
| latencyThreshold  | The latency threshold (in milliseconds) above which the connection is considered "slow" | optional | `1800` ms |
| slowConnectionTypes  | List of `effectiveType` values that should be treated as slow connections | optional | `['slow-2g', '2g', '3g']` |
| pingIntervalMs  | Default ping interval (in milliseconds) when the browser supports [Network Information API](https://developer.mozilla.org/en-US/docs/Web/API/Network_Information_API) | optional | `60000` (60 seconds) |
| fallbackPingIntervalMs  | Default ping interval (in milliseconds) when the browser does `NOT` support Network Information API. As a result, this should ping much more frequently than `pingIntervalMs`. <br/><br/> Many browsers E.g: Firefox, Safari, IE, etc and devices E.g: macOS, iOS, etc, will fallback to this as Network Information API is typically not supported on them | optional | `10000` (10 seconds) |

<i>💡 Tip: Importing `NetworkMonitorConfig` in your useValue ensures type-safety and IntelliSense autocompletion when setting configuration properties.</i>


### ✅ Requirements for Ping Endpoint
Make sure your ping endpoint, url or file:
- Returns a `200` or `204` response
- Supports CORS (if it's on a different domain)
- Responds quickly

---

## 🧠 Usage

Inject the service and subscribe to network status changes:
```ts
import { NetworkMonitorService, NetworkStatus } from 'ngx-network-monitor';

export class StatusComponent {
  status: NetworkStatus | null = null;

  constructor(private monitor: NetworkMonitorService) {
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
import { NetworkMonitorService, NetworkStatus } from 'ngx-network-monitor';

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

  constructor(private monitor: NetworkMonitorService) {
    this.monitor.networkStatus$.subscribe((status) => {
      this.status = status;
    });
  }
  
  get currentStatus() {
    return this.monitor.currentStatus
  }

  runManualCheck(){
    this.monitor.runManualCheck((newStatus) => {
      // Do anything with new status E.g:
      this.status = newStatus;
    })
  }
}
```

---

## 🔑 Additional Properties 

| Property                      | Description                                               |
| ----------------------------- | --------------------------------------------------------- |
| *.currentStatus               | Gets the current network status                           |
| *.runManualCheck(`callback?`)  | Triggers the network status check manually and accepts an optional callback which returns the new status |

---

## 📁 Assets (for default setup)
Ensure this file exists in your app **_as a static file_** if using the default ping path:
```bash
/assets/ping.txt
```

If you prefer to ping a different static file / endpoint / url, you can change the default value as mentioned in the "🔧 Setup" section: 

```ts
import { NETWORK_MONITOR_CONFIG } from 'ngx-network-monitor';

@NgModule({
  providers: [
    {
      provide: NETWORK_MONITOR_CONFIG,
      useValue: { pingUrl: '/your-api/ping' }
    }
  ]
})
export class AppModule {}
```
---

## ⚙️ Configuration Summary

| Feature         | Customizable       | Default                              |
| --------------- | ------------------ | ------------------------------------ |
| Ping URL        | ✅ `pingUrl`  | `/assets/ping.txt`              |
| Ping Interval   | ✅ auto-adjusts `pingIntervalMs` or `fallbackPingIntervalMs`    | 10s (no connection API) / 60s (with) |
| Connection Type | ✅ uses browser API | Based on `navigator.connection`      |
| Poor Connection | ✅ auto-detected    | Slow type or latency > 1800ms        |

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

Apache-2.0 © MadeByRaymond (Daniel Obiekwe)

---

## ❤️ Support

If you find this package helpful, you can support our projects here:

[![Buy Me a Smoothie](https://img.buymeacoffee.com/button-api/?text=Buy%20Me%20a%20Smoothie&emoji=🍹&slug=MadeByRaymond&button_colour=FFDD00&font_colour=000000&font_family=Comic&outline_colour=000000&coffee_colour=ffffff)](https://www.buymeacoffee.com/MadeByRaymond)
