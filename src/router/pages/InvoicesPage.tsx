import React from 'react';
import { useNavigate } from 'react-router-dom';
import { InvoicesListScreen } from '../../screens/Invoices/InvoicesListScreen';
import { useAppContext } from '../AppContext';
import { useEditingContext } from '../AppLayout';
import { Invoice } from '../../types';
import { createInvoiceDocumentData } from '../../utils/documentData';

export function InvoicesPage() {
  const navigate = useNavigate();
  const ctx = useAppContext();
  const { setEditingInvoice } = useEditingContext();

  const handlePreviewInvoice = (inv: Invoice) => {
    const client = ctx.clients.find((c) => c.id === inv.clientId);
    ctx.setPreviewData(createInvoiceDocumentData(inv, client, ctx.settings));
  };

  const handleDownloadExcel = async (inv: Invoice) => {
    const client = ctx.clients.find((c) => c.id === inv.clientId);
    const { downloadDocumentExcel } = await import('../../utils/excelGenerator');
    await downloadDocumentExcel(createInvoiceDocumentData(inv, client, ctx.settings));
  };

  return (
    <InvoicesListScreen
      invoices={ctx.invoices}
      clients={ctx.clients}
      settings={ctx.settings}
      onNewInvoice={() => {
        setEditingInvoice(null);
        navigate('/invoices/new');
      }}
      onScanPhoto={() => ctx.openPhotoScan('invoice')}
      onSelectInvoice={(inv) => {
        setEditingInvoice(inv);
        navigate(`/invoices/${inv.id}`);
      }}
      onDeleteInvoice={ctx.deleteInvoice}
      onRestoreInvoice={ctx.saveInvoice}
      onDuplicateInvoice={ctx.duplicateInvoice}
      onUpdateInvoiceStatus={ctx.updateInvoiceStatus}
      onPreviewInvoice={handlePreviewInvoice}
      onDownloadExcel={handleDownloadExcel}
    />
  );
}
