import React from 'react';
import { ClientsScreen } from '../../screens/Clients/ClientsScreen';
import { useAppContext } from '../AppContext';

export function ClientsPage() {
  const ctx = useAppContext();

  return (
    <ClientsScreen
      clients={ctx.clients}
      onAddClient={ctx.addClient}
      onUpdateClient={ctx.updateClient}
      onDeleteClient={ctx.deleteClient}
    />
  );
}
