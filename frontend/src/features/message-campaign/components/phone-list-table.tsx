'use client';

import type { Dispatch, SetStateAction } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { customerContactsApi, type CustomerContactDto } from '../api/customer-contacts-api';
import type { PhoneEntry } from '../types';
import { collectUniquePhoneNumbers, splitPhoneInput } from '../utils/phone-normalization';
import { PhoneImportPanel } from './phone-import-panel';

interface Props {
  selectedIds: Set<string>;
  onSelectedIdsChange: Dispatch<SetStateAction<Set<string>>>;
  onSelectedEntriesChange: (entries: PhoneEntry[]) => void;
  onTotalChange: (total: number) => void;
}

const PAGE_SIZE = 50;
const MAX_PHONE_ROWS = 5000;

function contactToEntry(c: CustomerContactDto): PhoneEntry {
  return {
    id: c.id,
    phoneNumber: c.phone,
    inputPhoneNumber: c.phone,
    zaloName: c.zaloName ?? '',
    avatarUrl: c.avatarUrl ?? '',
    zaloUid: c.zaloUid ?? '',
    gender: c.gender,
  };
}

function createAvatarFallback(name: string): string {
  return name.trim().slice(0, 1).toUpperCase() || '?';
}

export function PhoneListTable({ selectedIds, onSelectedIdsChange: setSelectedIds, onSelectedEntriesChange, onTotalChange }: Props) {
  const selectedContactsRef = useRef(new Map<string, PhoneEntry>());
  const [listMessage, setListMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [displayContacts, setDisplayContacts] = useState<CustomerContactDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchPage = useCallback(async (searchVal: string, pageVal: number) => {
    setLoading(true);
    try {
      const res = await customerContactsApi.list({
        search: searchVal || undefined,
        page: pageVal,
        limit: PAGE_SIZE,
      });
      setDisplayContacts(res.data);
      setTotal(res.total);
    } catch {
      setDisplayContacts([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPage(debouncedSearch, page);
  }, [debouncedSearch, page, fetchPage]);

  useEffect(() => {
    onTotalChange(total);
  }, [total, onTotalChange]);

  async function addPhones(rawValues: string[]) {
    const rawPhones = rawValues.flatMap(splitPhoneInput);
    if (rawPhones.length === 0) return;

    setBusy(true);
    setListMessage('');

    try {
      const existingPhones = displayContacts.map((c) => c.phone);
      const uniquePhones = collectUniquePhoneNumbers(rawPhones, existingPhones);
      const availableSlots = MAX_PHONE_ROWS - total;

      if (availableSlots <= 0) {
        setListMessage(`Tối đa ${MAX_PHONE_ROWS} SĐT.`);
        return;
      }

      const phonesToLookup = uniquePhones.slice(0, availableSlots);
      if (phonesToLookup.length === 0) {
        setListMessage('Không có SĐT mới để thêm.');
        return;
      }

      const lookupResponse = await customerContactsApi.lookup(
        phonesToLookup.map((p) => p.lookupPhoneNumber),
      );

      const skippedCount = uniquePhones.length - phonesToLookup.length + lookupResponse.failedCount;

      if (lookupResponse.results.length === 0) {
        setListMessage('Không tìm thấy tài khoản Zalo cho các SĐT đã nhập.');
        return;
      }

      if (skippedCount > 0) {
        setListMessage(`Đã thêm ${lookupResponse.results.length} SĐT, bỏ qua ${skippedCount} số.`);
      } else {
        setListMessage(`Đã thêm ${lookupResponse.results.length} SĐT.`);
      }

      await fetchPage(debouncedSearch, page);
    } catch (error) {
      setListMessage(error instanceof Error ? error.message : 'Không thêm được danh sách SĐT.');
    } finally {
      setBusy(false);
    }
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return;
    setBusy(true);
    try {
      await customerContactsApi.bulkDelete(Array.from(selectedIds));
      selectedContactsRef.current.clear();
      setSelectedIds(new Set());
      onSelectedEntriesChange([]);
      setListMessage(`Đã xóa ${selectedIds.size} SĐT.`);
      await fetchPage(debouncedSearch, page);
    } catch (error) {
      setListMessage(error instanceof Error ? error.message : 'Không xóa được.');
    } finally {
      setBusy(false);
    }
  }

  async function clearEntries() {
    if (!window.confirm('Bạn chắc chắn muốn xóa tất cả SĐT?')) return;
    setBusy(true);
    try {
      await customerContactsApi.clearAll();
      selectedContactsRef.current.clear();
      setSelectedIds(new Set());
      onSelectedEntriesChange([]);
      setListMessage('');
      await fetchPage(debouncedSearch, 1);
      setPage(1);
    } catch (error) {
      setListMessage(error instanceof Error ? error.message : 'Không xóa được.');
    } finally {
      setBusy(false);
    }
  }

  function emitSelectedEntries() {
    onSelectedEntriesChange(Array.from(selectedContactsRef.current.values()));
  }

  function toggleSelect(id: string) {
    const ref = selectedContactsRef.current;
    if (ref.has(id)) {
      ref.delete(id);
    } else {
      const contact = displayContacts.find((c) => c.id === id);
      if (contact) ref.set(id, contactToEntry(contact));
    }
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    emitSelectedEntries();
  }

  function toggleSelectAll() {
    const allSelected = displayContacts.length > 0 && displayContacts.every((c) => selectedIds.has(c.id));
    const ref = selectedContactsRef.current;
    for (const contact of displayContacts) {
      if (allSelected) ref.delete(contact.id);
      else ref.set(contact.id, contactToEntry(contact));
    }
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const contact of displayContacts) {
        if (allSelected) next.delete(contact.id);
        else next.add(contact.id);
      }
      return next;
    });
    emitSelectedEntries();
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const allPageSelected = displayContacts.length > 0 && displayContacts.every((c) => selectedIds.has(c.id));

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-gray-950">Danh sách SĐT</h2>
        <p className="mt-1 text-sm text-gray-500">Dán danh sách hoặc import file để thêm SĐT vào chiến dịch.</p>
      </div>

      <PhoneImportPanel busy={busy} onImportError={setListMessage} onAddPhones={addPhones} />

      {listMessage && <div className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{listMessage}</div>}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{total} SĐT</span>
          {selectedIds.size > 0 && (
            <button
              type="button"
              className="rounded-md bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
              onClick={handleBulkDelete}
              disabled={busy}
            >
              Xóa {selectedIds.size} đã chọn
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Tìm SĐT hoặc tên..."
            className="rounded-md border border-gray-200 px-2.5 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            type="button"
            className="text-sm text-red-600 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
            onClick={clearEntries}
            disabled={total === 0 || busy}
          >
            Xóa tất cả
          </button>
        </div>
      </div>

      <div className="mt-3 overflow-auto rounded-lg border border-gray-200">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
          </div>
        ) : displayContacts.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-500">
            {search ? 'Không tìm thấy kết quả.' : 'Dán SĐT hoặc import file .txt/.csv để bắt đầu.'}
          </div>
        ) : (
          <table className="w-full min-w-[560px]">
            <thead className="sticky top-0 bg-gray-50">
              <tr>
                <th className="w-10 px-3 py-2">
                  <input
                    type="checkbox"
                    checked={allPageSelected}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Avatar</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">SĐT</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Zalo name</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Giới tính</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayContacts.map((contact) => (
                <tr key={contact.id} className={selectedIds.has(contact.id) ? 'bg-blue-50' : ''}>
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(contact.id)}
                      onChange={() => toggleSelect(contact.id)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 bg-cover bg-center text-xs font-semibold text-gray-500"
                      style={contact.avatarUrl ? { backgroundImage: `url("${contact.avatarUrl}")` } : undefined}
                      aria-label={contact.zaloName || contact.phone}
                    >
                      {!contact.avatarUrl ? createAvatarFallback(contact.zaloName || contact.phone) : null}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-900">{contact.phone}</td>
                  <td className="px-3 py-2 text-sm text-gray-600">{contact.zaloName || '-'}</td>
                  <td className="px-3 py-2 text-sm text-gray-600">
                    {contact.gender === 0 ? 'Nam' : contact.gender === 1 ? 'Nữ' : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-2 flex items-center justify-between">
          <button
            type="button"
            className="text-sm text-blue-600 hover:underline disabled:opacity-50"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Trang trước
          </button>
          <span className="text-xs text-gray-500">Trang {page}/{totalPages}</span>
          <button
            type="button"
            className="text-sm text-blue-600 hover:underline disabled:opacity-50"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Trang sau
          </button>
        </div>
      )}
    </section>
  );
}
