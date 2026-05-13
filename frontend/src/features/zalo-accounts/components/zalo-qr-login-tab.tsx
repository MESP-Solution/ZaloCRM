'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { appConfig } from '../../../config/app-config';
import { zaloAccountsApi } from '../api/zalo-accounts-api';
import type { QrLoginState } from '../types';

interface Props {
  onSuccess: () => void;
}

interface ScannedInfo {
  avatar: string;
  displayName: string;
}

function buildWsUrl(): string {
  const apiUrl = appConfig.apiBaseUrl;
  const base = apiUrl.replace(/\/api\/?$/, '').replace(/^http/, 'ws');
  return `${base}/ws/zalo-qr`;
}

export function ZaloQrLoginTab({ onSuccess }: Props) {
  const [state, setState] = useState<QrLoginState>('idle');
  const [qrImage, setQrImage] = useState('');
  const [scannedInfo, setScannedInfo] = useState<ScannedInfo | null>(null);
  const [error, setError] = useState('');
  const [proxyUrl, setProxyUrl] = useState('');

  const wsRef = useRef<WebSocket | null>(null);
  const accountIdRef = useRef<string | null>(null);

  const cleanup = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (accountIdRef.current) {
      zaloAccountsApi.cancelQrLogin().catch(() => {});
      accountIdRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  async function handleStart() {
    setError('');
    setState('loading');
    setQrImage('');
    setScannedInfo(null);

    try {
      const result = await zaloAccountsApi.loginWithQr({
        proxyUrl: proxyUrl || undefined,
      });
      accountIdRef.current = result.accountId;
      connectWebSocket(result.accountId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start QR login');
      setState('error');
    }
  }

  function connectWebSocket(accountId: string) {
    const ws = new WebSocket(buildWsUrl());
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ event: 'subscribe', data: { accountId } }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        handleWsEvent(msg);
      } catch {
        // ignore malformed
      }
    };

    ws.onerror = () => {
      setError('WebSocket connection failed');
      setState('error');
    };

    ws.onclose = () => {
      wsRef.current = null;
    };
  }

  function handleWsEvent(msg: { event: string; data: Record<string, unknown> }) {
    switch (msg.event) {
      case 'qr_code':
        setQrImage(msg.data.image as string);
        setState('qr_ready');
        break;

      case 'qr_scanned':
        setScannedInfo({
          avatar: msg.data.avatar as string,
          displayName: msg.data.displayName as string,
        });
        setState('scanned');
        break;

      case 'qr_expired':
        setState('expired');
        break;

      case 'qr_declined':
        setState('declined');
        setError('Yêu cầu đăng nhập bị từ chối trên điện thoại');
        break;

      case 'login_result':
        if (msg.data.success) {
          setState('success');
          accountIdRef.current = null;
          setTimeout(onSuccess, 800);
        } else {
          setError((msg.data.error as string) || 'Login failed');
          setState('error');
        }
        break;
    }
  }

  async function handleRetry() {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (accountIdRef.current) {
      try {
        await zaloAccountsApi.cancelQrLogin();
      } catch {
        // ignore cancel errors
      }
      accountIdRef.current = null;
    }
    handleStart();
  }

  return (
    <div className="space-y-4">
      {state === 'idle' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Proxy URL (tùy chọn)
            </label>
            <input
              type="url"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-600"
              value={proxyUrl}
              onChange={(e) => setProxyUrl(e.target.value)}
              placeholder="http://user:pass@proxy.example.com:8080"
            />
          </div>
          <button
            className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700"
            onClick={handleStart}
          >
            Tạo mã QR
          </button>
          <p className="text-center text-xs text-gray-500">
            Mở Zalo trên điện thoại, quét mã QR để đăng nhập
          </p>
        </>
      )}

      {state === 'loading' && (
        <div className="flex flex-col items-center gap-3 py-8">
          <div className="size-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
          <p className="text-sm text-gray-500">Đang tạo mã QR...</p>
        </div>
      )}

      {state === 'qr_ready' && qrImage && (
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-lg border-2 border-blue-100 bg-white p-3">
            <img
              src={`data:image/png;base64,${qrImage}`}
              alt="QR Code"
              className="size-56"
            />
          </div>
          <p className="text-sm text-gray-600">
            Mở <span className="font-medium">Zalo</span> trên điện thoại &rarr; Quét mã QR
          </p>
        </div>
      )}

      {state === 'scanned' && scannedInfo && (
        <div className="flex flex-col items-center gap-4 py-4">
          <img
            src={scannedInfo.avatar}
            alt={scannedInfo.displayName}
            className="size-16 rounded-full object-cover"
          />
          <p className="text-sm font-medium text-gray-900">{scannedInfo.displayName}</p>
          <div className="flex items-center gap-2">
            <div className="size-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
            <p className="text-sm text-gray-500">Đang xác nhận trên điện thoại...</p>
          </div>
        </div>
      )}

      {state === 'success' && (
        <div className="flex flex-col items-center gap-3 py-8">
          <div className="flex size-12 items-center justify-center rounded-full bg-green-100 text-green-600">
            <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm font-medium text-green-700">Đăng nhập thành công!</p>
        </div>
      )}

      {(state === 'error' || state === 'expired' || state === 'declined') && (
        <div className="flex flex-col items-center gap-4 py-6">
          <div className="rounded-lg bg-red-50 px-4 py-3 text-center text-sm text-red-600">
            {state === 'expired' ? 'Mã QR đã hết hạn' : error || 'Đã xảy ra lỗi'}
          </div>
          <button
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            onClick={handleRetry}
          >
            Thử lại
          </button>
        </div>
      )}
    </div>
  );
}
