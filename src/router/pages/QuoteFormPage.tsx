import React from 'react';
import { useNavigate } from 'react-router-dom';
import { QuoteFormScreen } from '../../screens/Quotes/QuoteFormScreen';
import { useAppContext } from '../AppContext';
import { useEditingContext } from '../AppLayout';
import { Quote } from '../../types';

export function QuoteFormPage() {
  const navigate = useNavigate();
  const ctx = useAppContext();
  const { editingQuote, setEditingQuote } = useEditingContext();

  const handleSave = (quote: Quote) => {
    ctx.saveQuote(quote);
    setEditingQuote(null);
    navigate('/quotes');
  };

  return (
    <QuoteFormScreen
      initialQuote={editingQuote}
      clients={ctx.clients}
      articles={ctx.articles}
      settings={ctx.settings}
      onSave={handleSave}
      onBack={() => {
        setEditingQuote(null);
        navigate('/quotes');
      }}
      onOpenPreview={(data) => ctx.setPreviewData(data)}
      onOpenPhotoScan={() => ctx.openPhotoScan('quote')}
      onAddClient={ctx.addClient}
    />
  );
}
