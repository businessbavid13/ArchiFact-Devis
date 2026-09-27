import { Article, Client, CompanySettings, Invoice, Quote } from '../types';

export const INITIAL_ARTICLES: Article[] = [
  {
    id: 'art-1',
    name: 'ciment',
    description: '1 tonnes',
    unitPrice: 30000,
    unit: 'tonne',
    createdAt: '2026-09-14T08:00:00.000Z',
  },
  {
    id: 'art-2',
    name: 'Briques 15',
    description: 'Pas de description',
    unitPrice: 450,
    unit: 'unité',
    createdAt: '2026-09-14T08:05:00.000Z',
  },
  {
    id: 'art-3',
    name: 'Briques 15 plein',
    description: 'Pas de description',
    unitPrice: 550,
    unit: 'unité',
    createdAt: '2026-09-14T08:10:00.000Z',
  },
  {
    id: 'art-4',
    name: 'Ciment tonnes',
    description: 'Pas de description',
    unitPrice: 100000,
    unit: 'tonne',
    createdAt: '2026-09-14T08:15:00.000Z',
  },
  {
    id: 'art-5',
    name: 'Parquet de Ciment',
    description: 'Pas de description',
    unitPrice: 5000,
    unit: 'paquet',
    createdAt: '2026-09-14T08:20:00.000Z',
  },
  {
    id: 'art-6',
    name: 'Voyage Sable',
    description: 'Pas de description',
    unitPrice: 45000,
    unit: 'voyage',
    createdAt: '2026-09-14T08:25:00.000Z',
  },
];

export const INITIAL_CLIENTS: Client[] = [
  {
    id: 'cli-1',
    name: 'David',
    email: '',
    phone: '0103805915',
    address: 'Cocody, Abidjan',
    createdAt: '2026-09-14T09:00:00.000Z',
  },
  {
    id: 'cli-2',
    name: 'Entreprise BTP Ivoire',
    email: 'contact@btp-ivoire.ci',
    phone: '0708091011',
    address: 'Zone Industrielle Yopougon',
    createdAt: '2026-09-15T10:30:00.000Z',
  },
];

export const INITIAL_SETTINGS: CompanySettings = {
  name: 'ArchiFact Studio',
  legalStatus: 'Atelier d’Architecture & BTP • SARL',
  email: 'contact@archifact-devis.com',
  phone: '+225 01 02 03 04 05',
  address: 'Boulevard de la République, Abidjan',
  taxId: 'CI-ABJ-2024-B-12345',
  logoUrl: '',
  signatureUrl: 'https://api.iconify.design/fluent-emoji:pen.svg',
  currency: 'FCFA',
  language: 'Français',
  numberFormat: '1 000 000',
  dateFormat: '14/09/2026',
  invoiceDueDays: 7,
  showPaymentStatus: true,
  documentTemplate: 'Archi & Moderne',
  invoiceColor: '#0F5132', // Architectural Forest Emerald
  quoteColor: '#C2410C', // Architectural Terracotta & Bronze
  invoiceOpacity: 100,
  signatureScale: 100,
  paymentModes: [
    'Wave Mobile Money',
    'Orange Money (+225 07 00 00 00)',
    'MTN MoMo (+225 05 00 00 00)',
    'Virement bancaire',
    'Espèces à la livraison',
  ],
  termsAndConditions: [
    'Paiement dû sous 7 jours suivant la réception.',
    'Pénalité de retard de 1.5% par mois de retard.',
    'Marchandise livrée sous réserve de propriété jusqu’au paiement complet.',
  ],
  taxOptions: [
    { name: 'TVA standard (18%)', rate: 18 },
    { name: 'Taux réduit (5%)', rate: 5 },
    { name: 'Exonéré (0%)', rate: 0 },
  ],
};

export const INITIAL_QUOTES: Quote[] = [
  {
    id: 'quote-1',
    number: 'DEV-0001',
    clientId: 'cli-1',
    date: '14/09/2026',
    expirationDate: '14/10/2026',
    items: [
      {
        id: 'item-q1',
        articleId: 'art-1',
        name: 'ciment',
        description: '1 tonnes',
        quantity: 2,
        unitPrice: 30000,
        total: 60000,
      },
      {
        id: 'item-q2',
        articleId: 'art-2',
        name: 'Briques 15',
        quantity: 200,
        unitPrice: 450,
        total: 90000,
      },
    ],
    subtotal: 150000,
    discountType: 'fixed',
    discountValue: 0,
    taxRate: 0,
    taxAmount: 0,
    total: 150000,
    paymentMode: 'Wave Mobile Money',
    terms: 'Paiement à réception de facture',
    status: 'pending',
    createdAt: '2026-09-14T09:15:00.000Z',
  },
];

export const INITIAL_INVOICES: Invoice[] = [];

export const COLOR_PALETTE: string[] = [
  '#0F5132', // Émeraude Archi
  '#0D5C3A', // Vert Forêt Atelier
  '#064E3B', // Vert Bouteille Profond
  '#0E7490', // Bleu Canard Studio
  '#1E3A8A', // Bleu Cobalt Blueprint
  '#1E293B', // Graphite Ardoise
  '#0F172A', // Anthracite Sombre
  '#B45309', // Bronze Antique
  '#D97706', // Ambre & Ocre
  '#C2410C', // Terre Cuite BTP
  '#991B1B', // Brique Forgeron
  '#431407', // Bois Ébène Châtaignier
  '#581C87', // Pourpre Prestige
  '#475569', // Acier Brossé
  '#047857', // Jade Chêne
  '#2563EB', // Bleu Vif Standard
  '#EA580C', // Orange Vif
  '#0284C7', // Ciel Azur
];
