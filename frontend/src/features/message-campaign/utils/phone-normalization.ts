const PHONE_SPLIT_PATTERN = /[\s,;\n\r\t]+/;

export interface ParsedPhoneNumber {
  inputPhoneNumber: string;
  lookupPhoneNumber: string;
}

export function normalizeVietnamPhone(value: string): string {
  const cleaned = value.trim().replace(/[^\d+]/g, '');

  if (cleaned.startsWith('+84')) {
    return `84${cleaned.slice(3)}`;
  }

  if (cleaned.startsWith('0084')) {
    return `84${cleaned.slice(4)}`;
  }

  if (cleaned.startsWith('0')) {
    return `84${cleaned.slice(1)}`;
  }

  return cleaned.replace(/^\+/, '');
}

export function splitPhoneInput(input: string): string[] {
  return input
    .split(PHONE_SPLIT_PATTERN)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function collectUniquePhoneNumbers(
  rawPhones: string[],
  existingPhoneNumbers: string[],
): ParsedPhoneNumber[] {
  const seen = new Set(existingPhoneNumbers);
  const uniquePhones: ParsedPhoneNumber[] = [];

  for (const rawPhone of rawPhones) {
    const inputPhoneNumber = rawPhone.trim();
    const lookupPhoneNumber = normalizeVietnamPhone(rawPhone);
    if (!inputPhoneNumber || !lookupPhoneNumber || seen.has(lookupPhoneNumber)) {
      continue;
    }

    seen.add(lookupPhoneNumber);
    uniquePhones.push({ inputPhoneNumber, lookupPhoneNumber });
  }

  return uniquePhones;
}
