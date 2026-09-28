import { useCallback, useEffect, useState } from 'react';
import { CompanySettings } from '../types';
import { INITIAL_SETTINGS } from '../data/mockData';
import { supabase } from '../lib/supabase';

function mapSettings(row: Record<string, unknown>): CompanySettings {
  return {
    name: String(row.name || INITIAL_SETTINGS.name),
    legalStatus: row.legal_status as string | undefined,
    email: row.email as string | undefined,
    phone: row.phone as string | undefined,
    address: row.address as string | undefined,
    taxId: row.tax_id as string | undefined,
    logoUrl: row.logo_url as string | undefined,
    headerImageUrl: row.header_image_url as string | undefined,
    headerText: row.header_text as string | undefined,
    footerText: row.footer_text as string | undefined,
    footerImageUrl: row.footer_image_url as string | undefined,
    signatureUrl: row.signature_url as string | undefined,
    signatureImageUrl: row.signature_image_url as string | undefined,
    currency: String(row.currency || INITIAL_SETTINGS.currency),
    language: String(row.language || INITIAL_SETTINGS.language),
    numberFormat: String(row.number_format || INITIAL_SETTINGS.numberFormat),
    dateFormat: String(row.date_format || INITIAL_SETTINGS.dateFormat),
    invoiceDueDays: Number(row.invoice_due_days) || INITIAL_SETTINGS.invoiceDueDays,
    showPaymentStatus: row.show_payment_status !== false,
    documentTemplate: String(row.document_template || INITIAL_SETTINGS.documentTemplate),
    invoiceColor: String(row.invoice_color || INITIAL_SETTINGS.invoiceColor),
    quoteColor: String(row.quote_color || INITIAL_SETTINGS.quoteColor),
    invoiceOpacity: Number(row.invoice_opacity) || INITIAL_SETTINGS.invoiceOpacity,
    signatureScale: Number(row.signature_scale) || INITIAL_SETTINGS.signatureScale,
    paymentModes: (row.payment_modes as string[]) || INITIAL_SETTINGS.paymentModes,
    termsAndConditions: (row.terms_and_conditions as string[]) || INITIAL_SETTINGS.termsAndConditions,
    taxOptions: (row.tax_options as { name: string; rate: number }[]) || INITIAL_SETTINGS.taxOptions,
  };
}

function settingsToRow(settings: CompanySettings): Record<string, unknown> {
  return {
    name: settings.name,
    legal_status: settings.legalStatus || null,
    email: settings.email || null,
    phone: settings.phone || null,
    address: settings.address || null,
    tax_id: settings.taxId || null,
    logo_url: settings.logoUrl || null,
    header_image_url: settings.headerImageUrl || null,
    header_text: settings.headerText || null,
    footer_text: settings.footerText || null,
    footer_image_url: settings.footerImageUrl || null,
    signature_url: settings.signatureUrl || null,
    signature_image_url: settings.signatureImageUrl || null,
    currency: settings.currency,
    language: settings.language,
    number_format: settings.numberFormat,
    date_format: settings.dateFormat,
    invoice_due_days: settings.invoiceDueDays,
    show_payment_status: settings.showPaymentStatus,
    document_template: settings.documentTemplate,
    invoice_color: settings.invoiceColor,
    quote_color: settings.quoteColor,
    invoice_opacity: settings.invoiceOpacity,
    signature_scale: settings.signatureScale,
    payment_modes: settings.paymentModes,
    terms_and_conditions: settings.termsAndConditions,
    tax_options: settings.taxOptions,
  };
}

function readLocalSettings(): CompanySettings | null {
  try {
    const saved = localStorage.getItem('df_settings');
    return saved ? JSON.parse(saved) as CompanySettings : null;
  } catch {
    return null;
  }
}

export function useSettings(userId: string | null) {
  const [settings, setSettings] = useState<CompanySettings>(INITIAL_SETTINGS);

  const load = useCallback(async () => {
    if (!userId) {
      setSettings(INITIAL_SETTINGS);
      return;
    }

    const { data, error } = await supabase
      .from('company_settings')
      .select('*')
      .maybeSingle();

    if (error) {
      console.error('Supabase settings load failed', error);
      return;
    }

    if (data) {
      setSettings(mapSettings(data));
      return;
    }

    const initialSettings = readLocalSettings() || INITIAL_SETTINGS;
    const { error: saveError } = await supabase
      .from('company_settings')
      .upsert(settingsToRow(initialSettings), { onConflict: 'user_id' });
    if (saveError) {
      console.error('Supabase settings initialization failed', saveError);
      setSettings(initialSettings);
      return;
    }

    localStorage.removeItem('df_settings');
    setSettings(initialSettings);
  }, [userId]);

  useEffect(() => {
    setSettings(INITIAL_SETTINGS);
    void load();
  }, [load]);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`company-settings-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'company_settings', filter: `user_id=eq.${userId}` },
        () => void load(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [load, userId]);

  const updateSettings = useCallback((newVals: Partial<CompanySettings>) => {
    setSettings((current) => {
      const next = { ...current, ...newVals };
      void supabase.from('company_settings').upsert(settingsToRow(next), { onConflict: 'user_id' }).then(({ error }) => {
        if (error) console.error('Supabase settings save failed', error);
      });
      return next;
    });
  }, []);

  return {
    settings,
    updateSettings,
  };
}
