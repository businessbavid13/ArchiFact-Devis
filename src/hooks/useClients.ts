import { useCallback } from 'react';
import { Client } from '../types';
import { usePersistedState } from './usePersistedState';
import { INITIAL_CLIENTS } from '../data/mockData';

export function useClients() {
  const [clients, setClients] = usePersistedState<Client[]>('df_clients', INITIAL_CLIENTS);

  const addClient = useCallback((client: Client) => {
    setClients((prev) => [client, ...prev]);
  }, [setClients]);

  const updateClient = useCallback((client: Client) => {
    setClients((prev) => prev.map((item) => (item.id === client.id ? client : item)));
  }, [setClients]);

  const deleteClient = useCallback((id: string) => {
    setClients((prev) => prev.filter((item) => item.id !== id));
  }, [setClients]);

  return {
    clients,
    setClients,
    addClient,
    updateClient,
    deleteClient,
  };
}
