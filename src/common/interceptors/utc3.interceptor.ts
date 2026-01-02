import { Injectable, NestInterceptor, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

const OFFSET_MS = 3 * 60 * 60 * 1000;

function toUtc3String(date: Date): string {
  const local = new Date(date.getTime() - OFFSET_MS);
  const year = local.getUTCFullYear();
  const month = String(local.getUTCMonth() + 1).padStart(2, '0');
  const day = String(local.getUTCDate()).padStart(2, '0');
  const hours = String(local.getUTCHours()).padStart(2, '0');
  const minutes = String(local.getUTCMinutes()).padStart(2, '0');
  const seconds = String(local.getUTCSeconds()).padStart(2, '0');
  const ms = String(local.getUTCMilliseconds()).padStart(3, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${ms}-03:00`;
}

function convertDates<T>(value: T, seen = new WeakSet<object>()): T {
  if (value instanceof Date) {
    return toUtc3String(value) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => convertDates(item, seen)) as T;
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  if (seen.has(value as object)) {
    return value;
  }

  seen.add(value as object);

  const result = Object.create(Object.getPrototypeOf(value));
  Object.keys(value as object).forEach((key) => {
    const current = (value as Record<string, unknown>)[key];
    (result as Record<string, unknown>)[key] = convertDates(current, seen);
  });

  return result;
}

@Injectable()
export class Utc3Interceptor implements NestInterceptor {
  intercept(_: unknown, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(map((data) => convertDates(data)));
  }
}
