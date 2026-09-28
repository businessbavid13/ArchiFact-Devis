import { useCallback } from 'react';
import { Client } from '../types';
import { normalizeLegacyId, useSupabaseCollection } from './useSupabaseCollection';

function mapClient(row: Record<string, unknown>): Client {
  return {
    id: String(row.id),
    name: String(row.name || ''),
    email: row.email as string | undefined,
    phone: row.phone as string | undefined,
    address: row.address as string | undefined,
    createdAt: String(row.created_at || new Date().toISOString()),
  };
}

function clientToRow(client: Client): Record<string, unknown> {
  return {
    id: normalizeLegacyId(client.id),
    name: client.name,
    email: client.email || null,
    phone: client.phone || null,
    address: client.address || null,
    created_at: client.createdAt,
  };
}

export function useClients(userId: string | null) {
  const collection = useSupabaseCollection<Client>({
    table: 'clients',
    userId,
    localStorageKey: 'df_clients',
    mapRow: mapClient,
    toRow: clientToRow,
  });

  const addClient = useCallback((client: Client) => {
    void collection.save(client);
  }, [collection.save]);

  const updateClient = useCallback((client: Client) => {
    void collection.save(client);
  }, [collection.save]);

  const deleteClient = useCallback((id: string) => {
    void collection.remove(id);
  }, [collection.remove]);

  return {
    clients: collection.items,
    setClients: collection.setItems,
    addClient,
    updateClient,
    deleteClient,
    isLoading: collection.isLoading,
  };
}
