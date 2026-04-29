'use client';

import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';

interface Props {
  busy: boolean;
  onImportError: (message: string) => void;
  onAddPhones: (rawPhones: string[]) => Promise<void>;
}

const MAX_IMPORT_FILE_BYTES = 1024 * 1024;

export function PhoneImportPanel({ busy, onImportError, onAddPhones }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bulkPhones, setBulkPhones] = useState('');

  async function addBulkPhones() {
    if (busy || !bulkPhones.trim()) return;
    await onAddPhones([bulkPhones]);
    setBulkPhones('');
  }

  async function handleFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || busy) return;

    if (file.size > MAX_IMPORT_FILE_BYTES) {
      onImportError('File import tối đa 1MB.');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const text = String(readerEvent.target?.result ?? '');
      void onAddPhones([text]);
    };
    reader.readAsText(file);
    event.target.value = '';
  }

  return (
    <div className="space-y-3">
      <textarea
        className="block min-h-32 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 disabled:bg-gray-50"
        placeholder="Dán 1 hoặc nhiều SĐT, mỗi dòng một số hoặc ngăn cách bằng dấu phẩy..."
        value={bulkPhones}
        onChange={(event) => setBulkPhones(event.target.value)}
        disabled={busy}
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={addBulkPhones}
          disabled={busy}
        >
          {busy ? 'Đang thêm...' : 'Thêm danh sách'}
        </button>
        <input ref={fileInputRef} type="file" accept=".txt,.csv" className="hidden" onChange={handleFileUpload} />
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => fileInputRef.current?.click()}
          disabled={busy}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Import .txt/.csv
        </button>
      </div>
    </div>
  );
}
