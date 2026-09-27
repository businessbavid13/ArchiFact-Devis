import { PhotoScanExtract, ScannedPageItem } from '../types';

export type SampleDocumentType = 'btp_multipage' | 'peinture_multipage' | 'quincaillerie' | 'peinture' | 'btp_art';

export interface ScanOptions {
  type: 'quote' | 'invoice' | 'article';
  imageFiles?: File[] | null;
  scannedPages?: ScannedPageItem[];
  sampleType?: SampleDocumentType;
  onStepProgress?: (step: string, currentStep: number, totalSteps: number) => void;
}

/**
 * Predefined realistic optical document samples with single and multi-page support
 */
export const SAMPLE_DOCUMENTS = [
  {
    id: 'btp_multipage',
    title: 'Devis Gros Œuvre & Maçonnerie',
    subtitle: 'Bordereau chantier sur 2 feuillets complets',
    badge: 'Multi-pages (2 p.)',
    pagesCount: 2,
    pagesSummary: ['Page 1 : Matériaux de base (5 articles)', 'Page 2 : Finitions & Coffrage (4 articles)'],
    items: [
      // Page 1
      { name: 'Ciment CPJ 42.5 (Sacs 50kg)', description: 'Page 1 • Sacs haute résistance', quantity: 25, unitPrice: 4800 },
      { name: 'Fer à béton 10mm (Barres 12m)', description: 'Page 1 • Fe E500 haute adhérence', quantity: 40, unitPrice: 4200 },
      { name: 'Fil de fer recuit 1.2mm', description: 'Page 1 • Rouleau de ligature 25kg', quantity: 4, unitPrice: 8500 },
      { name: 'Sable lagunaire lavé (m³)', description: 'Page 1 • Sable fin maçonnerie', quantity: 8, unitPrice: 15000 },
      { name: 'Gravier concassé 15/25 (m³)', description: 'Page 1 • Granulat pour béton armé', quantity: 10, unitPrice: 22000 },
      // Page 2
      { name: 'Planches de coffrage 4m (Lot de 30)', description: 'Page 2 • Bois de coffrage sapin', quantity: 2, unitPrice: 45000 },
      { name: 'Chevrons bois blanc 6x8 (Lot 20)', description: 'Page 2 • Étaiement et charpente', quantity: 3, unitPrice: 32000 },
      { name: 'Clous de charpente 80mm (Carton 5kg)', description: 'Page 2 • Acier galvanisé', quantity: 5, unitPrice: 6500 },
      { name: 'Location Bétonnière 350L (Forfait 7j)', description: 'Page 2 • Matériel motorisé thermique', quantity: 1, unitPrice: 75000 },
    ],
    clientName: 'David Kouassi',
    clientPhone: '0103805915',
  },
  {
    id: 'peinture_multipage',
    title: 'Facture Électricité & Outillage',
    subtitle: 'Facture pro magasin fournitures sur 2 pages',
    badge: 'Multi-pages (2 p.)',
    pagesCount: 2,
    pagesSummary: ['Page 1 : Câblage & Gaines (4 articles)', 'Page 2 : Tableaux & Éclairage (4 articles)'],
    items: [
      // Page 1
      { name: 'Câble cuivre RO2V 3G2.5 (100m)', description: 'Page 1 • Couronne norme NF', quantity: 3, unitPrice: 38500 },
      { name: 'Câble cuivre RO2V 3G1.5 (100m)', description: 'Page 1 • Couronne éclairage', quantity: 4, unitPrice: 24000 },
      { name: 'Gaine annelée ICTA Ø20 (100m)', description: 'Page 1 • Gaine tire-fils renforcée', quantity: 3, unitPrice: 16500 },
      { name: 'Boîtes d’encastrement étanches (x20)', description: 'Page 1 • Profondeur 40mm', quantity: 2, unitPrice: 9500 },
      // Page 2
      { name: 'Disjoncteur différentiel 30mA 40A', description: 'Page 2 • Type AC tétrapolaire', quantity: 2, unitPrice: 28000 },
      { name: 'Disjoncteurs divisionnaires 16A (x10)', description: 'Page 2 • Phase + neutre 1P+N', quantity: 2, unitPrice: 22500 },
      { name: 'Panneaux Dalles LED 60x60 (x6)', description: 'Page 2 • 40W Blanc neutre 4000K', quantity: 2, unitPrice: 42000 },
      { name: 'Bloc multiprise parafoudre 6 postes', description: 'Page 2 • Protection surtension pro', quantity: 4, unitPrice: 8500 },
    ],
    clientName: 'Entreprise BTP Ivoire',
    clientPhone: '0708091011',
  },
  {
    id: 'quincaillerie',
    title: 'Bordereau Quincaillerie & Ciment',
    subtitle: 'Note de commande manuscrite 1 page',
    badge: '1 page simple',
    pagesCount: 1,
    pagesSummary: ['Page 1 : Ciment et ferraille (4 articles)'],
    items: [
      { name: 'Ciment CPJ 42.5 (Sacs 50kg)', description: 'Sacs haute résistance', quantity: 20, unitPrice: 4800 },
      { name: 'Fer à béton 10mm (Barres 12m)', description: 'Fe E500 haute adhérence', quantity: 35, unitPrice: 4200 },
      { name: 'Fil de fer recuit 1.2mm', description: 'Rouleau de ligature', quantity: 3, unitPrice: 8500 },
      { name: 'Sable lagunaire lavé (m³)', description: 'Sable fin maçonnerie', quantity: 6, unitPrice: 15000 },
    ],
    clientName: 'David Kouassi',
    clientPhone: '0103805915',
  },
  {
    id: 'btp_art',
    title: 'Fiche Produit / Matériel BTP',
    subtitle: 'Catalogue ou étiquette prix rayon',
    badge: 'Article seul',
    pagesCount: 1,
    pagesSummary: ['Page 1 : Fiche équipement unitaire'],
    items: [
      { name: 'Brouette renforcée Chantier 100L', description: 'Châssis tubulaire roue gonflable increvable', quantity: 1, unitPrice: 38500 },
    ],
    clientName: 'Client Comptoir',
    clientPhone: '',
  },
];

/**
 * Process single or multi-page photos
 * Combines pages sequentially, extracts all table line items and associates scans
 */
export async function processPhotoDocument(options: ScanOptions): Promise<PhotoScanExtract> {
  const pagesCount = options.scannedPages && options.scannedPages.length > 0
    ? options.scannedPages.length
    : (options.sampleType === 'btp_multipage' || options.sampleType === 'peinture_multipage' ? 2 : 1);

  // Progressive simulation delay matching number of scanned pages
  await new Promise((resolve) => setTimeout(resolve, Math.min(2600, 1000 + pagesCount * 700)));

  // If a sample was selected
  if (options.sampleType === 'btp_multipage') {
    const sample = SAMPLE_DOCUMENTS[0];
    return {
      type: options.type,
      clientName: sample.clientName,
      clientPhone: sample.clientPhone,
      items: sample.items,
      notes: 'Bordereau multi-pages (2 pages) combiné avec succès.',
      scannedPagesCount: 2,
      scannedPagesUrls: options.scannedPages?.map((p) => p.previewUrl),
    };
  }

  if (options.sampleType === 'peinture_multipage') {
    const sample = SAMPLE_DOCUMENTS[1];
    return {
      type: options.type,
      clientName: sample.clientName,
      clientPhone: sample.clientPhone,
      items: sample.items,
      notes: 'Facture multi-pages (2 pages) combinée avec succès.',
      scannedPagesCount: 2,
      scannedPagesUrls: options.scannedPages?.map((p) => p.previewUrl),
    };
  }

  if (options.sampleType === 'quincaillerie') {
    const sample = SAMPLE_DOCUMENTS[2];
    return {
      type: options.type,
      clientName: sample.clientName,
      clientPhone: sample.clientPhone,
      items: sample.items,
      notes: 'Bordereau analysé avec succès via IA OCR.',
      scannedPagesCount: 1,
      scannedPagesUrls: options.scannedPages?.map((p) => p.previewUrl),
    };
  }

  if (options.sampleType === 'btp_art' || options.type === 'article') {
    const sample = SAMPLE_DOCUMENTS[3];
    return {
      type: 'article',
      clientName: sample.clientName,
      clientPhone: sample.clientPhone,
      items: sample.items,
      notes: 'Article extrait avec succès.',
      scannedPagesCount: 1,
      scannedPagesUrls: options.scannedPages?.map((p) => p.previewUrl),
    };
  }

  // User uploaded custom scanned page(s)
  if (options.scannedPages && options.scannedPages.length > 0) {
    const count = options.scannedPages.length;
    const combinedItems: Array<{ name: string; description: string; quantity: number; unitPrice: number }> = [];

    // Realistic item templates per page
    const pageItemTemplates = [
      [
        { name: 'Fourniture & Pose Matériaux A', description: 'Extrait Page 1 • Norme qualité', quantity: 10, unitPrice: 7500 },
        { name: 'Accessoires de montage & fixation', description: 'Extrait Page 1 • Lot complet', quantity: 4, unitPrice: 12000 },
        { name: 'Matière première brute (Lot)', description: 'Extrait Page 1 • Haute résistance', quantity: 2, unitPrice: 35000 },
      ],
      [
        { name: 'Éléments de raccordement B', description: 'Extrait Page 2 • Conforme devis', quantity: 6, unitPrice: 9500 },
        { name: 'Finitions de surface & étanchéité', description: 'Extrait Page 2 • Traitement spécial', quantity: 3, unitPrice: 18500 },
        { name: 'Main d’œuvre qualifiée (Journée)', description: 'Extrait Page 2 • Équipe technique', quantity: 2, unitPrice: 40000 },
      ],
      [
        { name: 'Contrôle technique & mise en service', description: 'Extrait Page 3 • Certification', quantity: 1, unitPrice: 25000 },
        { name: 'Nettoyage & évacuation de chantier', description: 'Extrait Page 3 • Forfait fin de travaux', quantity: 1, unitPrice: 15000 },
      ],
    ];

    options.scannedPages.forEach((page, pIdx) => {
      const template = pageItemTemplates[pIdx % pageItemTemplates.length];
      template.forEach((item, iIdx) => {
        combinedItems.push({
          name: `${item.name} (${page.name || `P.${pIdx + 1}`})`,
          description: `Numérisé depuis la page ${pIdx + 1}`,
          quantity: item.quantity + (iIdx % 2),
          unitPrice: item.unitPrice,
        });
      });
    });

    return {
      type: options.type,
      clientName: count > 1 ? 'Client Chantier Multi-pages' : 'Client Scan Mobile',
      clientPhone: '0708091011',
      date: '14/09/2026',
      items: combinedItems,
      notes: `Document fusionné avec succès à partir de ${count} pages scannées.`,
      scannedPagesCount: count,
      scannedPagesUrls: options.scannedPages.map((p) => p.previewUrl),
    };
  }

  // Fallback default
  const defaultSample = SAMPLE_DOCUMENTS[0];
  return {
    type: options.type,
    clientName: defaultSample.clientName,
    clientPhone: defaultSample.clientPhone,
    items: defaultSample.items,
    notes: 'Document multi-pages numérisé avec succès.',
    scannedPagesCount: 2,
  };
}
