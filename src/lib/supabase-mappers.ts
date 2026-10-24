/**
 * Postgres uses snake_case columns while the app's domain types use camelCase.
 * These helpers convert top-level keys only: JSONB columns (inventory maps,
 * location objects) keep their original shape.
 */

const toCamelKey = (key: string) =>
  key.replace(/_([a-z0-9])/g, (_, char: string) => char.toUpperCase());

const toSnakeKey = (key: string) => key.replace(/[A-Z]/g, (char) => `_${char.toLowerCase()}`);

export type Row = Record<string, unknown>;

export const toCamel = <T = Row>(row: Row): T => {
  const result: Row = {};
  for (const [key, value] of Object.entries(row)) {
    result[toCamelKey(key)] = value;
  }
  return result as T;
};

export const toCamelRows = <T = Row>(rows: Row[]): T[] => rows.map((row) => toCamel<T>(row));

export const toSnake = (record: Row): Row => {
  const result: Row = {};
  for (const [key, value] of Object.entries(record)) {
    result[toSnakeKey(key)] = value;
  }
  return result;
};
