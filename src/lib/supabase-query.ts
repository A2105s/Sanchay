import { toCamel, toSnake, type Row } from '@/lib/supabase-mappers';
import { getSupabaseClient } from '@/utils/supabase/client';

export interface RowFilter {
  column: string;
  value: string;
}

export interface RowQueryOptions {
  select?: string;
  filters?: RowFilter[];
  or?: string;
  order?: { column: string; ascending?: boolean };
  limit?: number;
}

export class SupabaseNotConfiguredError extends Error {
  constructor() {
    super('Supabase is not configured.');
    this.name = 'SupabaseNotConfiguredError';
  }
}

const requireClient = () => {
  const client = getSupabaseClient();
  if (!client) throw new SupabaseNotConfiguredError();
  return client;
};

export const fetchRows = async <T = Row>(
  table: string,
  options: RowQueryOptions = {}
): Promise<T[]> => {
  const client = requireClient();
  let query = client.from(table).select(options.select ?? '*');

  for (const filter of options.filters ?? []) {
    query = query.eq(filter.column, filter.value);
  }

  if (options.or) {
    query = query.or(options.or);
  }

  if (options.order) {
    query = query.order(options.order.column, { ascending: options.order.ascending ?? false });
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) throw error;

  return ((data ?? []) as unknown as Row[]).map((row) => toCamel<T>(row));
};

export const fetchRow = async <T = Row>(
  table: string,
  id: string,
  idColumn = 'id'
): Promise<T | null> => {
  const client = requireClient();
  const { data, error } = await client.from(table).select('*').eq(idColumn, id).maybeSingle();

  if (error) throw error;
  return data ? toCamel<T>(data as Row) : null;
};

export const insertRow = async <T = Row>(table: string, values: Row): Promise<T> => {
  const client = requireClient();
  const { data, error } = await client.from(table).insert(toSnake(values)).select().single();

  if (error) throw error;
  return toCamel<T>(data as Row);
};

export const updateRow = async <T = Row>(
  table: string,
  id: string,
  values: Row,
  idColumn = 'id'
): Promise<T | null> => {
  const client = requireClient();
  const { data, error } = await client
    .from(table)
    .update(toSnake(values))
    .eq(idColumn, id)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data ? toCamel<T>(data as Row) : null;
};

/**
 * Subscribes to Postgres change events for a table. Returns an unsubscribe
 * function; the caller re-fetches rows in `onChange` so ordering and joins stay
 * consistent with the initial query.
 */
export const subscribeToTable = (table: string, onChange: () => void): (() => void) => {
  const client = getSupabaseClient();
  if (!client) return () => undefined;

  const channel = client
    .channel(`table:${table}:${Math.random().toString(36).slice(2)}`)
    .on('postgres_changes', { event: '*', schema: 'public', table }, () => onChange())
    .subscribe();

  return () => {
    void client.removeChannel(channel);
  };
};

export const isSupabaseError = (error: unknown): error is { message: string } =>
  typeof error === 'object' &&
  error !== null &&
  typeof (error as { message?: unknown }).message === 'string';
