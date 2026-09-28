import React from 'react';
import { useNavigate } from 'react-router-dom';
import { InvoiceFormScreen } from '../../screens/Invoices/InvoiceFormScreen';
import { useAppContext } from '../AppContext';
import { useEditingContext } from '../AppLayout';
import { Invoice } from '../../types';

export function InvoiceFormPage() {
  const navigate = useNavigate();
  const ctx = useAppContext();
  const { editingInvoice, setEditingInvoice } = useEditingContext();

  const handleSave = (invoice: Invoice) => {
    ctx.saveInvoice(invoice);
    setEditingInvoice(null);
    navigate('/invoices');
  };

  return (
    <InvoiceFormScreen
      initialInvoice={editingInvoice}
      clients={ctx.clients}
      articles={ctx.articles}
      settings={ctx.settings}
      onSave={handleSave}
      onBack={() => {
        setEditingInvoice(null);
        navigate('/invoices');
      }}
      onOpenPreview={(data) => ctx.setPreviewData(data)}
      onOpenPhotoScan={() => ctx.openPhotoScan('invoice')}
      onAddClient={ctx.addClient}
    />
  );
}
