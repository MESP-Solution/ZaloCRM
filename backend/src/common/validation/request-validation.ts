import { BadRequestException } from '@nestjs/common';

export function requireText(value: unknown, fieldName: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new BadRequestException(`${fieldName} is required`);
  }

  return value.trim();
}

export function requireTextList(value: unknown, fieldName: string): string[] {
  if (!Array.isArray(value)) {
    throw new BadRequestException(`${fieldName} must be an array`);
  }

  const items = value.map((item) => requireText(item, fieldName));

  if (items.length === 0) {
    throw new BadRequestException(`${fieldName} must not be empty`);
  }

  return items;
}
