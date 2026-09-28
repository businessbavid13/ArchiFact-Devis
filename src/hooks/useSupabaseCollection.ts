import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

interface UseSupabaseCollectionOptions<T> {
  table: string;
  userId: string | null;
  localStorageKey: string;
  mapRow: (row: Record<string, unknown>) => T;
  toRow: (item: T) => Record<string, unknown>;
}

export function normalizeLegacyId(id: string): string {
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return id;
  }

  const mappingKey = 'df_legacy_id_map';
  try {
    const mapping = JSON.parse(localStorage.getItem(mappingKey) || '{}') as Record<string, string>;
    if (mapping[id]) return mapping[id];
    const nextId = crypto.randomUUID();
    localStorage.setItem(mappingKey, JSON.stringify({ ...mapping, [id]: nextId }));
    return nextId;
  } catch {
    return crypto.randomUUID();
  }
}

function readLocalArray<T>(key: string): T[] {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return [];
    const parsed: unknown = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed as T[] : [];
  } catch {
    return [];
  }
}

export function useSupabaseCollection<T>({
  table,
  userId,
  localStorageKey,
  mapRow,
  toRow,
}: UseSupabaseCollectionOptions<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) {
      setItems([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error(`Supabase ${table} load failed`, error);
      setIsLoading(false);
      return;
    }

    const rows = (data || []) as unknown as Record<string, unknown>[];
    if (rows.length === 0) {
      const localItems = readLocalArray<T>(localStorageKey);
      if (localItems.length > 0) {
        const { error: migrationError } = await supabase
          .from(table)
          .insert(localItems.map(toRow));
        if (!migrationError) {
          localStorage.removeItem(localStorageKey);
          const { data: migratedData } = await supabase
            .from(table)
            .select('*')
            .order('created_at', { ascending: false });
          setItems(((migratedData || []) as unknown as Record<string, unknown>[]).map(mapRow));
          setIsLoading(false);
          return;
        }
        console.error(`Supabase ${table} local migration failed`, migrationError);
      }
    }

    setItems(rows.map(mapRow));
    setIsLoading(false);
  }, [localStorageKey, mapRow, table, toRow, userId]);

  useEffect(() => {
    setItems([]);
    void load();
  }, [load]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`${table}-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table, filter: `user_id=eq.${userId}` },
        () => void load(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [load, table, userId]);

  const save = useCallback(async (item: T) => {
    if (!userId) return;
    setItems((current) => [item, ...current.filter((entry) => toRow(entry).id !== toRow(item).id)]);
    const { error } = await supabase.from(table).upsert(toRow(item));
    if (error) {
      console.error(`Supabase ${table} save failed`, error);
      void load();
    }
  }, [load, table, toRow, userId]);

  const remove = useCallback(async (id: string) => {
    if (!userId) return;
    setItems((current) => current.filter((entry) => toRow(entry).id !== id));
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) {
      console.error(`Supabase ${table} delete failed`, error);
      void load();
    }
  }, [load, table, toRow, userId]);

  const saveMany = useCallback(async (newItems: T[]) => {
    if (!userId || newItems.length === 0) return;
    setItems((current) => [
      ...newItems,
      ...current.filter((entry) => !newItems.some((item) => toRow(item).id === toRow(entry).id)),
    ]);
    const { error } = await supabase.from(table).upsert(newItems.map(toRow));
    if (error) {
      console.error(`Supabase ${table} bulk save failed`, error);
      void load();
    }
  }, [load, table, toRow, userId]);

  return useMemo(() => ({
    items,
    setItems,
    isLoading,
    save,
    remove,
    saveMany,
    reload: load,
  }), [isLoading, items, load, remove, save, saveMany]);
}
