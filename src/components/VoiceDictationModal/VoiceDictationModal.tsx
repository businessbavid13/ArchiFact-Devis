import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  X,
  Plus,
  Trash2,
  CheckCircle2,
  Sparkles,
  Volume2,
  AlertCircle,
  Edit2,
  Check,
} from 'lucide-react';
import { DocumentItem } from '../../types';
import { parseVoiceDictation } from '../../utils/voiceParser';
import { formatCurrency } from '../../utils/formatting';

// Web Speech API type declarations (non-standard, vendor-prefixed)
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

interface VoiceDictationModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentType: 'quote' | 'invoice';
  currency?: string;
  onAddItems: (items: DocumentItem[]) => void;
}

export const VoiceDictationModal: React.FC<VoiceDictationModalProps> = ({
  isOpen,
  onClose,
  documentType,
  currency = 'FCFA',
  onAddItems,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [parsedItems, setParsedItems] = useState<DocumentItem[]>([]);
  const [recognitionError, setRecognitionError] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  // Initialize SpeechRecognition if available
  useEffect(() => {
    if (!isOpen) {
      stopListening();
      setTranscript('');
      setParsedItems([]);
      setRecognitionError(null);
      return;
    }

    const SpeechRecognition =
      (window as unknown as Record<string, new () => SpeechRecognitionInstance>).SpeechRecognition ||
      (window as unknown as Record<string, new () => SpeechRecognitionInstance>).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = 'fr-FR';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onstart = () => {
          setIsListening(true);
          setRecognitionError(null);
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let currentTranscript = '';
          for (let i = 0; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript + ' ';
          }
          const cleanedText = currentTranscript.trim();
          setTranscript(cleanedText);
          const parsed = parseVoiceDictation(cleanedText);
          if (parsed.length > 0) {
            setParsedItems(parsed);
          }
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.warn('Speech recognition error:', event.error);
          if (event.error === 'not-allowed') {
            setRecognitionError("L'accès au microphone n'est pas autorisé.");
          } else if (event.error === 'no-speech') {
            // no speech detected yet
          } else {
            setRecognitionError(`Erreur micro : ${event.error}`);
          }
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;

        // Auto-start listening on open
        try {
          recognition.start();
        } catch {
          // ignore if already started
        }
      } catch (err) {
        console.warn('Error setting up speech recognition:', err);
      }
    } else {
      setRecognitionError(
        "La reconnaissance vocale directe n'est pas supportée sur ce navigateur. Vous pouvez utiliser les exemples rapides ci-dessous ou la saisie."
      );
    }

    return () => {
      stopListening();
    };
  }, [isOpen]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        setRecognitionError(null);
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.warn(e);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.warn(e);
      }
      setIsListening(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Helper for quick simulated speech (e.g. prompt example or standard phrases)
  const handleUseExample = (exampleText: string) => {
    stopListening();
    setTranscript(exampleText);
    const parsed = parseVoiceDictation(exampleText);
    setParsedItems(parsed);
  };

  // Update quantity of an item
  const updateItemQty = (id: string, newQty: number) => {
    setParsedItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity: Math.max(1, newQty),
              total: Math.max(1, newQty) * item.unitPrice,
            }
          : item
      )
    );
  };

  // Update price of an item
  const updateItemPrice = (id: string, newPrice: number) => {
    setParsedItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              unitPrice: Math.max(0, newPrice),
              total: item.quantity * Math.max(0, newPrice),
            }
          : item
      )
    );
  };

  // Update name of an item
  const updateItemName = (id: string, newName: string) => {
    setParsedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, name: newName } : item))
    );
  };

  const removeItem = (id: string) => {
    setParsedItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleConfirmAdd = () => {
    if (parsedItems.length === 0) return;
    onAddItems(parsedItems);
    onClose();
  };

  if (!isOpen) return null;

  const totalCalculated = parsedItems.reduce((acc, it) => acc + it.total, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[88vh] animate-modal-enter">
        {/* Header */}
        <div className="px-4 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-slate-800 text-white flex items-center justify-center shrink-0">
              <Mic className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
                <span>Dictée Vocale Chantier</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold uppercase tracking-wider">
                  Mains libres
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-normal">
                Parlez naturellement sans toucher le clavier
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-400 hover:text-white rounded-md active:scale-95 transition-all duration-150"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto overscroll-contain flex-1">
          {/* Active Listening Waveform & Button */}
          <div className="flex flex-col items-center justify-center py-5 bg-slate-50 rounded-lg border border-slate-200 relative overflow-hidden">
            {/* Animated sound ripple rings */}
            {isListening && (
              <>
                <div className="absolute w-28 h-28 rounded-full bg-slate-300/40 animate-ping" />
                <div className="absolute w-20 h-20 rounded-full bg-slate-300/30 animate-pulse" />
              </>
            )}

            <button
              type="button"
              onClick={toggleListening}
              className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center transition-all duration-150 ease-out active:scale-90 shadow-sm cursor-pointer ${
                isListening
                  ? 'bg-rose-600 text-white shadow-rose-200'
                  : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
              title={isListening ? 'Arrêter la dictée' : 'Démarrer la dictée'}
            >
              {isListening ? (
                <MicOff className="w-7 h-7" />
              ) : (
                <Mic className="w-7 h-7" />
              )}
            </button>

            <div className="mt-3 text-center">
              <span
                className={`text-xs font-medium inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border ${
                  isListening
                    ? 'bg-rose-50 border-rose-200 text-rose-700'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isListening ? 'bg-rose-500 animate-pulse' : 'bg-slate-400'
                  }`}
                />
                {isListening ? 'À votre écoute... Dictez vos articles' : 'Appuyez pour dicter'}
              </span>
              <p className="text-[11px] text-slate-500 mt-1">
                Exemple : « Ajoute 5 pots de peinture blanche à 28 000 et 3 rouleaux »
              </p>
            </div>
          </div>

          {/* Transcript Display Box */}
          <div className="bg-white rounded-lg border border-slate-200 p-3">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 mb-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-slate-500" />
                Texte transcrit
              </span>
              {transcript && (
                <button
                  type="button"
                  onClick={() => {
                    setTranscript('');
                    setParsedItems([]);
                  }}
                  className="text-xs text-rose-600 hover:text-rose-700 font-medium"
                >
                  Effacer
                </button>
              )}
            </div>

            {transcript ? (
              <p className="text-xs text-slate-800 bg-slate-50 p-2.5 rounded-md border border-slate-200 leading-relaxed font-mono">
                "{transcript}"
              </p>
            ) : (
              <p className="text-xs text-slate-400 italic py-1 text-center">
                Dictez vos articles à voix haute, ou cliquez sur l'un des exemples ci-dessous.
              </p>
            )}
          </div>

          {/* Quick Examples for Instant Job-site Test */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Exemples rapides chantier (1 clic)
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() =>
                  handleUseExample('Ajoute 5 pots de peinture blanche à 28 000 et 3 rouleaux')
                }
                className="text-left text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-md px-2.5 py-1.5 transition-colors"
              >
                5 pots de peinture à 28 000 + 3 rouleaux
              </button>
              <button
                type="button"
                onClick={() =>
                  handleUseExample('10 sacs de ciment à 5500 et 2 brouettes à 35000')
                }
                className="text-left text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-md px-2.5 py-1.5 transition-colors"
              >
                10 sacs de ciment à 5 500 + 2 brouettes
              </button>
              <button
                type="button"
                onClick={() =>
                  handleUseExample('2 journées de main d\'oeuvre maçonnerie à 30000')
                }
                className="text-left text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-md px-2.5 py-1.5 transition-colors"
              >
                2 journées de main d'œuvre à 30 000
              </button>
            </div>
          </div>

          {/* Parsed Articles List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-800">
                Articles détectés ({parsedItems.length})
              </span>
              {parsedItems.length > 0 && (
                <span className="text-xs font-semibold text-slate-900">
                  Total : {formatCurrency(totalCalculated, currency)}
                </span>
              )}
            </div>

            {parsedItems.length === 0 ? (
              <div className="p-4 border border-dashed border-slate-200 rounded-lg text-center">
                <p className="text-xs text-slate-400">
                  Aucun article détecté pour le moment. Parlez ou choisissez un exemple ci-dessus.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {parsedItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-white rounded-lg border border-slate-200 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        {editingItemId === item.id ? (
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => updateItemName(item.id, e.target.value)}
                            className="w-full text-xs font-medium px-2 py-1 border border-slate-300 rounded-md focus:outline-none"
                            placeholder="Nom de l'article"
                          />
                        ) : (
                          <p className="text-xs font-semibold text-slate-900">{item.name}</p>
                        )}
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {item.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            setEditingItemId(editingItemId === item.id ? null : item.id)
                          }
                          className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 active:scale-95 transition-all"
                          title="Modifier"
                        >
                          {editingItemId === item.id ? (
                            <Check className="w-4 h-4 text-slate-900" />
                          ) : (
                            <Edit2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 active:scale-95 transition-all"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Numeric controls */}
                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-slate-500 font-medium">Qté :</span>
                        <div className="flex items-center border border-slate-200 rounded-md bg-slate-50 overflow-hidden">
                          <button
                            type="button"
                            onClick={() => updateItemQty(item.id, Math.max(1, item.quantity - 1))}
                            className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-200 active:scale-90 font-bold transition-transform cursor-pointer"
                          >
                            -
                          </button>
                          <span className="w-7 text-center font-mono font-semibold text-xs text-slate-900">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateItemQty(item.id, item.quantity + 1)}
                            className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-200 active:scale-90 font-bold transition-transform cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-slate-500 font-medium">P.U :</span>
                        <input
                          type="number"
                          min="0"
                          step="100"
                          value={item.unitPrice}
                          onChange={(e) =>
                            updateItemPrice(item.id, parseFloat(e.target.value) || 0)
                          }
                          className="w-22 px-2 py-1 border border-slate-200 rounded-md text-xs font-mono font-medium text-right bg-white focus:outline-none focus:border-slate-400"
                        />
                        <span className="text-[10px] text-slate-400 font-medium">{currency}</span>
                      </div>

                      <div className="text-right font-bold font-mono text-slate-900 text-xs">
                        {formatCurrency(item.total, currency)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {recognitionError && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <span>{recognitionError}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 sm:p-4 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 min-h-[44px] py-2 px-3 rounded-md border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 active:scale-[0.98] transition-all duration-150 cursor-pointer"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleConfirmAdd}
            disabled={parsedItems.length === 0}
            className="flex-2 min-h-[44px] py-2 px-4 rounded-md bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all duration-150 shadow-2xs cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              Insérer {parsedItems.length} article{parsedItems.length > 1 ? 's' : ''} dans le{' '}
              {documentType === 'quote' ? 'devis' : 'facture'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
