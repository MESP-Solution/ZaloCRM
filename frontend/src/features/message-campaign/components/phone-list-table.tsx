'use client';

import type { Dispatch, SetStateAction } from 'react';
import { useState } from 'react';
import { messageCampaignApi } from '../api/message-campaign-api';
import type { PhoneEntry } from '../types';
import { collectUniquePhoneNumbers, splitPhoneInput } from '../utils/phone-normalization';
import { PhoneImportPanel } from './phone-import-panel';

interface Props {
  entries: PhoneEntry[];
  onEntriesChange: Dispatch<SetStateAction<PhoneEntry[]>>;
}

const MAX_PHONE_ROWS = 5000;

function createAvatarFallback(name: string): string {
  return name.trim().slice(0, 1).toUpperCase() || '?';
}

export function PhoneListTable({ entries, onEntriesChange }: Props) {
  const [listMessage, setListMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function addPhones(rawValues: string[]) {
    const rawPhones = rawValues.flatMap(splitPhoneInput);
    if (rawPhones.length === 0) return;

    setBusy(true);
    setListMessage('');

    try {
      const existingPhoneNumbers = entries.map((entry) => entry.phoneNumber);
      const uniquePhones = collectUniquePhoneNumbers(rawPhones, existingPhoneNumbers);
      const availableSlots = MAX_PHONE_ROWS - entries.length;

      if (availableSlots <= 0) {
        setListMessage(`Tối đa ${MAX_PHONE_ROWS} SĐT mỗi lần import.`);
        return;
      }

      const phonesToLookup = uniquePhones.slice(0, availableSlots);
      if (phonesToLookup.length === 0) {
        setListMessage('Không có SĐT mới để thêm.');
        return;
      }

      const lookupResponse = await messageCampaignApi.findZaloUsers(phonesToLookup);
      const importedEntries: PhoneEntry[] = lookupResponse.results.map((result) => ({
        id: crypto.randomUUID(),
        phoneNumber: result.phoneNumber,
        inputPhoneNumber: result.inputPhoneNumber,
        zaloName: result.zaloName || result.displayName,
        avatarUrl: result.avatarUrl,
      }));
      const skippedCount = uniquePhones.length - phonesToLookup.length + lookupResponse.failedCount;

      if (importedEntries.length === 0) {
        setListMessage('Không tìm thấy tài khoản Zalo cho các SĐT đã nhập.');
        return;
      }

      onEntriesChange((currentEntries) => [...currentEntries, ...importedEntries]);

      if (skippedCount > 0) {
        setListMessage(`Đã thêm ${importedEntries.length} SĐT, bỏ qua ${skippedCount} số không tìm thấy.`);
      } else {
        setListMessage(`Đã thêm ${importedEntries.length} SĐT vào danh sách.`);
      }
    } catch (error) {
      setListMessage(error instanceof Error ? error.message : 'Không thêm được danh sách SĐT.');
    } finally {
      setBusy(false);
    }
  }

  function clearEntries() {
    onEntriesChange([]);
    setListMessage('');
  }

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-gray-950">Danh sách SĐT</h2>
        <p className="mt-1 text-sm text-gray-500">Dán danh sách hoặc import file để thêm SĐT vào chiến dịch.</p>
      </div>

      <PhoneImportPanel busy={busy} onImportError={setListMessage} onAddPhones={addPhones} />

      {listMessage && <div className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{listMessage}</div>}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm text-gray-500">Đã thêm {entries.length} SĐT</span>
        <button
          type="button"
          className="text-sm text-red-600 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
          onClick={clearEntries}
          disabled={entries.length === 0 || busy}
        >
          Xóa danh sách
        </button>
      </div>

      <div className="mt-3 overflow-auto rounded-lg border border-gray-200">
        {entries.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-500">
            Dán SĐT hoặc import file .txt/.csv để bắt đầu.
          </div>
        ) : (
          <table className="w-full min-w-[560px]">
            <thead className="sticky top-0 bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Avatar</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">SĐT</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Zalo name</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td className="px-3 py-2">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 bg-cover bg-center text-xs font-semibold text-gray-500"
                      style={entry.avatarUrl ? { backgroundImage: `url("${entry.avatarUrl}")` } : undefined}
                      aria-label={entry.zaloName || entry.inputPhoneNumber}
                    >
                      {!entry.avatarUrl ? createAvatarFallback(entry.zaloName || entry.inputPhoneNumber) : null}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-900">{entry.inputPhoneNumber}</td>
                  <td className="px-3 py-2 text-sm text-gray-600">{entry.zaloName || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
