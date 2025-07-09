import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NetworkMonitorService, NetworkStatus } from './network-monitor.service';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PING_URL } from './tokens/ping-url.token';
import { NgZone, PLATFORM_ID } from '@angular/core';

describe('NetworkMonitorService', () => {
  let service: NetworkMonitorService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        NetworkMonitorService,
        { provide: PING_URL, useValue: '/assets/ping.txt' },
        { provide: PLATFORM_ID, useValue: 'browser' }, // simulate browser environment
        NgZone
      ]
    });

    service = TestBed.inject(NetworkMonitorService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should use the injected ping URL', fakeAsync(() => {
    const sub = service.networkStatus$.subscribe((status: NetworkStatus) => {
      if (status.latency !== null) {
        expect(status.online).toBeTrue();
        expect(status.poorConnection).toBeFalse();
      }
    });

    const req = httpMock.expectOne('/assets/ping.txt');
    expect(req.request.method).toBe('GET');
    req.flush('pong');

    tick(1000); // simulate passage of time
    sub.unsubscribe();
  }));

  it('should detect poor connection on error', fakeAsync(() => {
    const sub = service.networkStatus$.subscribe((status: NetworkStatus) => {
      if (status.latency === null) {
        expect(status.online).toBeFalse();
        expect(status.poorConnection).toBeTrue();
      }
    });

    const req = httpMock.expectOne('/assets/ping.txt');
    req.error(new ProgressEvent('Network error'));

    tick(1000);
    sub.unsubscribe();
  }));

  afterEach(() => {
    httpMock.verify();
  });
});
