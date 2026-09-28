import React, { useState } from 'react';
import { Search, Plus, Trash2, User, Mail, Phone, MapPin } from 'lucide-react';
import { Button } from '../../components/Button/Button';
import { Client } from '../../types';

interface ClientsScreenProps {
  clients: Client[];
  onAddClient: (client: Client) => void;
  onUpdateClient: (client: Client) => void;
  onDeleteClient: (id: string) => void;
}

export const ClientsScreen: React.FC<ClientsScreenProps> = ({
  clients,
  onAddClient,
  onUpdateClient,
  onDeleteClient,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Form fields matching screenshot 5
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const filteredClients = clients.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.phone && c.phone.includes(q)) ||
      (c.address && c.address.toLowerCase().includes(q))
    );
  });

  const handleOpenAdd = () => {
    setEditingClient(null);
    setName('');
    setEmail('');
    setPhone('');
    setAddress('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Client) => {
    setEditingClient(c);
    setName(c.name);
    setEmail(c.email || '');
    setPhone(c.phone || '');
    setAddress(c.address || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingClient) {
      onUpdateClient({
        ...editingClient,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim(),
      });
    } else {
      const newClient: Client = {
        id: crypto.randomUUID(),
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim(),
        createdAt: new Date().toISOString(),
      };
      onAddClient(newClient);
    }

    setIsModalOpen(false);
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden relative">
      {/* Search Bar (Matching screenshots 5, 12) */}
      <div className="p-3.5 bg-white border-b border-slate-200">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher (nom, email, téléphone, a..."
            className="w-full bg-slate-50 border border-slate-200 rounded-md py-2 pl-9.5 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      {/* List of Clients (Matching screenshot 5, 12) */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-2 pb-28">
        {filteredClients.length === 0 ? (
          <div className="py-12 text-center">
            <User className="w-10 h-10 text-slate-300 mx-auto mb-2 stroke-1" />
            <p className="text-xs font-semibold text-slate-600">Aucun client trouvé</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Appuyez sur + Nouveau Client pour enregistrer un client
            </p>
          </div>
        ) : (
          filteredClients.map((client) => {
            const initial = client.name.charAt(0).toUpperCase() || 'C';
            return (
              <div
                key={client.id}
                onClick={() => handleOpenEdit(client)}
                className="bg-white rounded-lg border border-slate-200/80 p-3  hover:border-blue-400 flex items-center justify-between transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0 font-semibold text-xs border border-slate-200">
                    {initial}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      {client.name}
                    </h4>
                    <p className="text-[11px] text-slate-400 truncate">
                      {client.email || 'Email non fourni'}
                    </p>
                    {client.phone && (
                      <p className="text-[10px] text-slate-500 font-medium">
                        {client.phone}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Supprimer le client ${client.name} ?`)) {
                        onDeleteClient(client.id);
                      }
                    }}
                    className="p-1.5 text-slate-300 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Action Button (Matching screenshot 12: + Nouveau Client) */}
      <div className="fixed bottom-20 right-5 z-20">
        <Button
          variant="primary"
          size="md"
          
          onClick={handleOpenAdd}
          icon={Plus}
          className="shadow-md px-4 py-2 font-medium"
        >
          Nouveau Client
        </Button>
      </div>

      {/* Modal / Bottom Sheet Nouveau Client (Matching screenshot 5) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-lg shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {editingClient ? 'Modifier le client' : 'Nouveau Client'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                X
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              {/* Field 1: User icon "Nom du client" */}
              <div className="space-y-1">
                <div className="relative flex items-center">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nom du client"
                    className="w-full bg-slate-50 border border-slate-200 rounded-md py-2.5 pl-9.5 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Field 2: Mail icon "Email" */}
              <div className="space-y-1">
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    className="w-full bg-slate-50 border border-slate-200 rounded-md py-2.5 pl-9.5 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Field 3: Phone icon "Téléphone" */}
              <div className="space-y-1">
                <div className="relative flex items-center">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Téléphone"
                    className="w-full bg-slate-50 border border-slate-200 rounded-md py-2.5 pl-9.5 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Field 4: MapPin icon "Adresse" */}
              <div className="space-y-1">
                <div className="relative flex items-center">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Adresse"
                    className="w-full bg-slate-50 border border-slate-200 rounded-md py-2.5 pl-9.5 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Bottom buttons matching screenshot 5: Annuler and + Ajouter */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Annuler
                </button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  
                  icon={Plus}
                  className="font-bold px-5"
                >
                  {editingClient ? 'Enregistrer' : 'Ajouter'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
