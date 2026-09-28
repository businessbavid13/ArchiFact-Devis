import React from 'react';
import { ClientsScreen } from '../../screens/Clients/ClientsScreen';
import { useAppContext } from '../AppContext';

export function ClientsPage() {
  const ctx = useAppContext();

  return (
    <ClientsScreen
      clients={ctx.clients}
      onAddClient={(client) => {
        ctx.addClient(client);
        ctx.notify('Client enregistré');
      }}
      onUpdateClient={(client) => {
        ctx.updateClient(client);
        ctx.notify('Client mis à jour');
      }}
      onDeleteClient={ctx.deleteClient}
      onRestoreClient={ctx.addClient}
    />
  );
}
