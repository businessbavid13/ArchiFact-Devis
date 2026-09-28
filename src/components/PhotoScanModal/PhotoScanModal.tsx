import React, { useState, useRef } from 'react';
import {
  Camera,
  Image as ImageIcon,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  X,
  FileText,
  Plus,
  Trash2,
  Layers,
  Info,
} from 'lucide-react';
import { Button } from '../Button/Button';
import { processPhotoDocument, SAMPLE_DOCUMENTS, SampleDocumentType } from '../../services/photoGeneration';
import { PhotoScanExtract, ScannedPageItem } from '../../types';
import { AI_CREDIT_COSTS } from '../../constants/aiCosts';

interface PhotoScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentType: 'quote' | 'invoice' | 'article';
  creditsBalance: number;
  onReserveCredits: () => Promise<{ reservation_id: string }>;
  onCompleteReservation: (reservationId: string) => Promise<void>;
  onRefundReservation: (reservationId: string) => Promise<void>;
  onAnalyzeImages: (files: File[]) => Promise<PhotoScanExtract>;
  onOpenCreditStore: () => void;
  onExtracted: (extract: PhotoScanExtract) => void;
}

export const PhotoScanModal: React.FC<PhotoScanModalProps> = ({
  isOpen,
  onClose,
  documentType,
  creditsBalance,
  onReserveCredits,
  onCompleteReservation,
  onRefundReservation,
  onAnalyzeImages,
  onOpenCreditStore,
  onExtracted,
}) => {
  const [scannedPages, setScannedPages] = useState<ScannedPageItem[]>([]);
  const [selectedSample, setSelectedSample] = useState<SampleDocumentType | null>(
    documentType === 'article' ? 'btp_art' : 'btp_multipage'
  );
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputCameraRef = useRef<HTMLInputElement>(null);
  const fileInputGalleryRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const typeLabels = {
    quote: 'Nouveau Devis par scan photo',
    invoice: 'Nouvelle Facture par scan photo',
    article: 'Nouvel Article par scan photo',
  };

  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newPages: ScannedPageItem[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const previewUrl = URL.createObjectURL(file);
      newPages.push({
        id: `page-${Date.now()}-${i}-${Math.random()}`,
        name: file.name,
        previewUrl,
        file,
      });
    }

    setScannedPages((prev) => [...prev, ...newPages]);
    setSelectedSample(null);
    setErrorMsg(null);
  };

  const handleRemovePage = (id: string) => {
    setScannedPages((prev) => prev.filter((p) => p.id !== id));
  };

  const handleStartScan = async () => {
    setErrorMsg(null);

    const totalPages = scannedPages.length > 0 ? scannedPages.length : (selectedSample?.includes('multipage') ? 2 : 1);

    setIsScanning(true);
    setScanStep(`1/${totalPages > 1 ? '3' : '2'} Analyse de la page 1 et correction d’angle...`);

    let reservationId: string | undefined;
    try {
      const result = scannedPages.length > 0
        ? {
            ...(await onAnalyzeImages(
          scannedPages
            .map((page) => page.file)
            .filter((file): file is File => file !== undefined)
            )),
            scannedPagesCount: scannedPages.length,
            scannedPagesUrls: scannedPages.map((page) => page.previewUrl),
          }
        : await (async () => {
          const reservation = await onReserveCredits();
          reservationId = reservation.reservation_id;
          return processPhotoDocument({
            type: documentType,
            sampleType: selectedSample ?? undefined,
          });
        })();
      if (totalPages > 1) {
        setTimeout(() => {
          setScanStep(`2/3 Numérisation des pages 2 à ${totalPages} & détection des articles...`);
        }, 800);

        setTimeout(() => {
          setScanStep(`3/3 Association des scans et création du document multi-pages...`);
        }, 1600);
      } else {
        setTimeout(() => {
          setScanStep(`2/2 Extraction des articles & structuration des totaux...`);
        }, 1000);
      }

      if (scannedPages.length === 0) {
        if (!reservationId) throw new Error('Réservation de crédits absente');
        await onCompleteReservation(reservationId);
      }

      setScanStep('Document complet généré avec succès');

      setTimeout(() => {
        setIsScanning(false);
        onExtracted(result);
        onClose();
      }, 500);
    } catch {
      if (reservationId) await onRefundReservation(reservationId).catch(() => undefined);
      setIsScanning(false);
      setErrorMsg("Échec de l'analyse. Veuillez réessayer.");
    }
  };

  const activePagesCount = scannedPages.length > 0 ? scannedPages.length : (selectedSample?.includes('multipage') ? 2 : 1);
  const requiredCredits = scannedPages.length > 0
    ? AI_CREDIT_COSTS.AI_OCR_ANALYSIS
    : documentType === 'article'
      ? AI_CREDIT_COSTS.AI_ARTICLE_FROM_IMAGE
      : documentType === 'quote'
        ? AI_CREDIT_COSTS.AI_QUOTE_FROM_IMAGE
        : AI_CREDIT_COSTS.AI_INVOICE_FROM_IMAGE;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-t-2xl sm:rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[88vh] animate-modal-enter">
        {/* Header */}
        <div className="bg-slate-900 text-white px-4 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-slate-800 text-white flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight text-white">{typeLabels[documentType]}</h3>
              <p className="text-[11px] text-slate-400 font-normal">
                Support multi-pages • {requiredCredits} crédits • Fusion automatique
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-400 hover:text-white rounded-md active:scale-95 transition-all duration-150"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto overscroll-contain flex-1 space-y-4">
          {/* Credit reminder banner */}
          <div className="bg-blue-50/80 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-blue-900">
                  Solde : <span className="font-bold">{creditsBalance} crédits</span>
                </p>
                <p className="text-[11px] text-blue-700">
                  {requiredCredits} crédits pour cette analyse
                </p>
              </div>
            </div>
            {creditsBalance < requiredCredits ? (
              <button
                type="button"
                onClick={onOpenCreditStore}
                className="text-xs font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-lg border border-amber-300 transition-colors"
              >
                Acheter
              </button>
            ) : (
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Prêt
              </span>
            )}
          </div>

          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-md p-3 text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
              {creditsBalance < 1 && (
                <button
                  type="button"
                  onClick={onOpenCreditStore}
                  className="font-bold underline text-rose-800 text-xs ml-1"
                >
                  Acheter
                </button>
              )}
            </div>
          )}

          {/* Section 1 : Pages Scannées / Ajouter plus de scans */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span>1. Pages scannées du document</span>
                {scannedPages.length > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                    {scannedPages.length} {scannedPages.length > 1 ? 'pages' : 'page'}
                  </span>
                )}
              </label>
              {scannedPages.length > 0 && (
                <button
                  type="button"
                  onClick={() => setScannedPages([])}
                  className="text-[11px] text-rose-600 hover:underline"
                >
                  Tout effacer
                </button>
              )}
            </div>

            {/* List of scanned pages (if user uploaded photos) */}
            {scannedPages.length > 0 ? (
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  {scannedPages.map((page, idx) => (
                    <div
                      key={page.id}
                      className="relative group bg-slate-100 rounded-md border border-slate-200 overflow-hidden flex flex-col items-center p-1.5 shadow-2xs"
                    >
                      <div className="w-full h-20 bg-slate-200 rounded-lg overflow-hidden flex items-center justify-center relative">
                        <img
                          src={page.previewUrl}
                          alt={page.name}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-1 left-1 bg-slate-900/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                          Page {idx + 1}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-600 truncate w-full mt-1 text-center font-medium">
                        Feuillet {idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemovePage(page.id)}
                        className="absolute top-2 right-2 p-1 bg-rose-600 text-white rounded-full shadow hover:bg-rose-700 transition-colors"
                        title="Supprimer cette page"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  {/* Bouton "+ Ajouter la page suivante" */}
                  <div
                    onClick={() => fileInputCameraRef.current?.click()}
                    className="h-full min-h-[96px] border-2 border-dashed border-blue-400 bg-blue-50/50 hover:bg-blue-100/60 rounded-md flex flex-col items-center justify-center cursor-pointer transition-colors p-2 text-center"
                  >
                    <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center mb-1">
                      <Plus className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold text-blue-900 leading-tight">
                      + Page {scannedPages.length + 1}
                    </span>
                    <span className="text-[9px] text-blue-600 mt-0.5">Prendre photo</span>
                  </div>
                </div>

                {/* Helper notice explaining multi-page merging */}
                <div className="p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-md flex items-start gap-2 text-[11px] text-amber-800">
                  <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p>
                    <strong>Pages multiples détectées :</strong> À la fin du scan, tous les articles des {scannedPages.length} pages seront automatiquement fusionnés pour générer un document complet paginé.
                  </p>
                </div>
              </div>
            ) : (
              /* Capture buttons (when no scan yet) */
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => fileInputCameraRef.current?.click()}
                  className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/50 rounded-lg transition-all text-center group"
                >
                  <div className="w-10 h-10 rounded-md bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center text-slate-600 group-hover:text-blue-600 mb-2">
                    <Camera className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-800">Prendre photo</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">Page 1, puis ajouter la suite</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputGalleryRef.current?.click()}
                  className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/50 rounded-lg transition-all text-center group"
                >
                  <div className="w-10 h-10 rounded-md bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center text-slate-600 group-hover:text-blue-600 mb-2">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-800">Galerie photo</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">Choisir 1 ou plusieurs pages</span>
                </button>
              </div>
            )}

            {/* Hidden file inputs */}
            <input
              ref={fileInputCameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => handleFilesSelected(e.target.files)}
            />
            <input
              ref={fileInputGalleryRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFilesSelected(e.target.files)}
            />

            {/* Extra button to add more pages when some pages are already scanned */}
            {scannedPages.length > 0 && (
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => fileInputCameraRef.current?.click()}
                  className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-slate-200"
                >
                  <Camera className="w-3.5 h-3.5 text-blue-600" />
                  <span>Scanner une autre page</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputGalleryRef.current?.click()}
                  className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-slate-200"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-slate-600" />
                  <span>Galerie</span>
                </button>
              </div>
            )}
          </div>

          {/* Section 2 : Exemples Réalistes Prêts (dont exemples multi-pages) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 block">
                Ou tester directement un exemple réaliste :
              </label>
              <span className="text-[10px] text-slate-400">1 ou 2 pages</span>
            </div>

            <div className="space-y-1.5">
              {SAMPLE_DOCUMENTS.map((sample) => {
                const isSelected = selectedSample === sample.id && scannedPages.length === 0;
                return (
                  <button
                    key={sample.id}
                    type="button"
                    onClick={() => {
                      setSelectedSample(sample.id as SampleDocumentType);
                      setScannedPages([]);
                    }}
                    className={`w-full text-left p-3 rounded-lg border text-xs transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/80 text-blue-950 ring-1 ring-blue-500 shadow-xs'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-md flex items-center justify-center ${
                          isSelected ? 'bg-blue-600 text-white' : 'bg-white text-slate-400 border border-slate-200'
                        }`}
                      >
                        {sample.pagesCount > 1 ? (
                          <Layers className="w-4 h-4" />
                        ) : (
                          <FileText className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-slate-900 leading-tight">{sample.title}</p>
                          {sample.pagesCount > 1 && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-200/70 text-blue-800">
                              {sample.pagesCount} pages
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {sample.items.length} articles • {sample.subtitle}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-white text-slate-700 border border-slate-200 shadow-2xs whitespace-nowrap ml-2">
                      {sample.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scanning Animation */}
          {isScanning && (
            <div className="p-4 bg-slate-900 rounded-lg text-white space-y-3 relative overflow-hidden shadow-lg">
              <div className="absolute inset-0 bg-blue-500/10 pointer-events-none" />
              {/* Laser line animation */}
              <div className="absolute left-0 right-0 h-1 bg-slate-900/60 animate-pulse" />

              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                <p className="text-xs font-bold text-blue-200">{scanStep}</p>
              </div>
              <p className="text-[11px] text-slate-400">
                Extraction OCR des libellés, quantités et prix • Fusion des {activePagesCount} feuillet(s)...
              </p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center gap-2">
          <Button
            variant="outline"
            size="md"
            fullWidth
            onClick={onClose}
            disabled={isScanning}
          >
            Annuler
          </Button>

          {creditsBalance < requiredCredits ? (
            <Button
              variant="amber"
              size="md"
              fullWidth
              onClick={() => {
                onClose();
                onOpenCreditStore();
              }}
              icon={Sparkles}
            >
              Acheter des crédits
            </Button>
          ) : (
            <Button
              variant="primary"
              size="md"
              fullWidth
              onClick={handleStartScan}
              disabled={isScanning || (scannedPages.length === 0 && !selectedSample)}
              icon={isScanning ? undefined : ArrowRight}
            >
              {isScanning
                ? 'Génération en cours...'
                : `Générer le document (${activePagesCount} ${activePagesCount > 1 ? 'pages' : 'page'})`}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
