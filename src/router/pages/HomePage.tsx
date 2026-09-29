import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HomeScreen } from '../../screens/Home/HomeScreen';
import { useAppContext } from '../AppContext';
import { useEditingContext } from '../AppLayout';

export function HomePage() {
  const navigate = useNavigate();
  const ctx = useAppContext();
  const { setEditingInvoice, setEditingQuote } = useEditingContext();

  return (
    <HomeScreen
      invoices={ctx.invoices}
      quotes={ctx.quotes}
      clients={ctx.clients}
      settings={ctx.settings}
      credits={ctx.credits}
      onScanPhoto={() => ctx.openPhotoScan('quote')}
      onNewInvoice={() => {
        setEditingInvoice(null);
        navigate('/invoices/new');
      }}
      onNewQuote={() => {
        setEditingQuote(null);
        navigate('/quotes/new');
      }}
      onOpenInvoices={() => navigate('/invoices')}
      onOpenQuotes={() => navigate('/quotes')}
    />
  );
}
