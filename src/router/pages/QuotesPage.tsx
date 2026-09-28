import React from 'react';
import { useNavigate } from 'react-router-dom';
import { QuotesListScreen } from '../../screens/Quotes/QuotesListScreen';
import { useAppContext } from '../AppContext';
import { useEditingContext } from '../AppLayout';
import { Quote } from '../../types';
import { createQuoteDocumentData } from '../../utils/documentData';

export function QuotesPage() {
  const navigate = useNavigate();
  const ctx = useAppContext();
  const { setEditingQuote } = useEditingContext();

  const handlePreviewQuote = (quo: Quote) => {
    const client = ctx.clients.find((c) => c.id === quo.clientId);
    ctx.setPreviewData(createQuoteDocumentData(quo, client, ctx.settings));
  };

  const handleDownloadExcel = async (quo: Quote) => {
    const client = ctx.clients.find((c) => c.id === quo.clientId);
    const { downloadDocumentExcel } = await import('../../utils/excelGenerator');
    await downloadDocumentExcel(createQuoteDocumentData(quo, client, ctx.settings));
    ctx.notify('Excel téléchargé');
  };

  const handleConvertToInvoice = (quote: Quote) => {
    const newInvoice = ctx.convertQuoteToInvoice(quote);
    ctx.saveInvoice(newInvoice);
    navigate('/invoices');
  };

  return (
    <QuotesListScreen
      quotes={ctx.quotes}
      clients={ctx.clients}
      settings={ctx.settings}
      onNewQuote={() => {
        setEditingQuote(null);
        navigate('/quotes/new');
      }}
      onScanPhoto={() => ctx.openPhotoScan('quote')}
      onSelectQuote={(quo) => {
        setEditingQuote(quo);
        navigate(`/quotes/${quo.id}`);
      }}
      onDeleteQuote={ctx.deleteQuote}
      onRestoreQuote={ctx.saveQuote}
      onDuplicateQuote={ctx.duplicateQuote}
      onUpdateQuoteStatus={ctx.updateQuoteStatus}
      onConvertToInvoice={handleConvertToInvoice}
      onPreviewQuote={handlePreviewQuote}
      onDownloadExcel={handleDownloadExcel}
    />
  );
}
