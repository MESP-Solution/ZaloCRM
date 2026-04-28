'use client';

import { useRef, useState } from 'react';
import type { PhoneEntry } from '../types';

interface Props {
  entries: PhoneEntry[];
  onEntriesChange: (entries: PhoneEntry[]) => void;
}

export function PhoneListTable({ entries, onEntriesChange }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [manualPhone, setManualPhone] = useState('');

  const allSelected = entries.length > 0 && entries.every((e) => e.selected);
  const selectedCount = entries.filter((e) => e.selected).length;

  function toggleSelectAll() {
    const newVal = !allSelected;
    onEntriesChange(entries.map((e) => ({ ...e, selected: newVal })));
  }

  function toggleSelect(id: string) {
    onEntriesChange(entries.map((e) => (e.id === id ? { ...e, selected: !e.selected } : e)));
  }

  function addManualPhone() {
    const phone = manualPhone.trim();
    if (!phone) return;
    if (entries.some((e) => e.phoneNumber === phone)) {
      setManualPhone('');
      return;
    }
    onEntriesChange([
      ...entries,
      { id: crypto.randomUUID(), phoneNumber: phone, name: '', selected: true },
    ]);
    setManualPhone('');
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split(/[\r\n]+/).filter(Boolean);
      const existing = new Set(entries.map((e) => e.phoneNumber));
      const newEntries: PhoneEntry[] = [];

      for (const line of lines) {
        const phone = line.trim().replace(/[^0-9+]/g, '');
        if (phone && !existing.has(phone)) {
          existing.add(phone);
          newEntries.push({ id: crypto.randomUUID(), phoneNumber: phone, name: '', selected: true });
        }
      }

      onEntriesChange([...entries, ...newEntries]);
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function removeSelected() {
    onEntriesChange(entries.filter((e) => !e.selected));
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-950">
          Danh sách SĐT <span className="text-sm font-normal text-gray-500">({entries.length})</span>
        </h2>
      </div>

      {/* Add phone controls */}
      <div className="mb-3 flex items-center gap-2">
        <input
          type="text"
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
          placeholder="Nhập số điện thoại..."
          value={manualPhone}
          onChange={(e) => setManualPhone(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addManualPhone()}
        />
        <button
          type="button"
          className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          onClick={addManualPhone}
        >
          Thêm
        </button>
        <input ref={fileInputRef} type="file" accept=".txt,.csv" className="hidden" onChange={handleFileUpload} />
        <button
          type="button"
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          onClick={() => fileInputRef.current?.click()}
        >
          Import
        </button>
      </div>

      {/* Bulk bar */}
      {selectedCount > 0 && (
        <div className="mb-3 flex items-center gap-3 rounded-lg bg-blue-50 px-3 py-2">
          <span className="text-xs font-medium text-blue-800">Đã chọn {selectedCount}</span>
          <button className="text-xs text-red-600 hover:underline" onClick={removeSelected}>
            Xóa đã chọn
          </button>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-auto rounded-lg border border-gray-200">
        {entries.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-500">
            Chưa có SĐT nào. Thêm thủ công hoặc import từ file .txt/.csv
          </div>
        ) : (
          <table className="w-full">
            <thead className="sticky top-0 bg-gray-50">
              <tr>
                <th className="w-10 px-3 py-2">
                  <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} />
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Số điện thoại</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Tên</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {entries.map((entry) => (
                <tr key={entry.id} className={entry.selected ? 'bg-blue-50/50' : ''}>
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={entry.selected}
                      onChange={() => toggleSelect(entry.id)}
                    />
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-900">{entry.phoneNumber}</td>
                  <td className="px-3 py-2 text-sm text-gray-500">{entry.name || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
