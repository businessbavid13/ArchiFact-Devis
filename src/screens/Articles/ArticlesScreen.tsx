import React, { useState } from 'react';
import { Search, Plus, Trash2, Package, FileText, Coins, Camera } from 'lucide-react';
import { Button } from '../../components/Button/Button';
import { Article } from '../../types';
import { formatCurrency } from '../../utils/formatting';

interface ArticlesScreenProps {
  articles: Article[];
  onAddArticle: (article: Article) => void;
  onUpdateArticle: (article: Article) => void;
  onDeleteArticle: (id: string) => void;
  onRestoreArticle: (article: Article) => void;
  onScanArticlePhoto: () => void;
}

export const ArticlesScreen: React.FC<ArticlesScreenProps> = ({
  articles,
  onAddArticle,
  onUpdateArticle,
  onDeleteArticle,
  onRestoreArticle,
  onScanArticlePhoto,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [undoArticle, setUndoArticle] = useState<Article | null>(null);

  const handleDeleteArticle = (article: Article) => {
    onDeleteArticle(article.id);
    setUndoArticle(article);
    window.setTimeout(() => setUndoArticle((current) => current?.id === article.id ? null : current), 5000);
  };

  // Form fields matching screenshot 10
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [unitPrice, setUnitPrice] = useState<number | ''>('');

  const filteredArticles = articles.filter((art) => {
    const q = searchQuery.toLowerCase();
    return (
      art.name.toLowerCase().includes(q) ||
      (art.description && art.description.toLowerCase().includes(q)) ||
      art.unitPrice.toString().includes(q)
    );
  });

  const handleOpenAdd = () => {
    setEditingArticle(null);
    setName('');
    setDescription('');
    setUnitPrice('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (art: Article) => {
    setEditingArticle(art);
    setName(art.name);
    setDescription(art.description || '');
    setUnitPrice(art.unitPrice);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const priceNum = typeof unitPrice === 'number' ? unitPrice : parseFloat(unitPrice) || 0;

    if (editingArticle) {
      onUpdateArticle({
        ...editingArticle,
        name: name.trim(),
        description: description.trim() || 'Pas de description',
        unitPrice: priceNum,
      });
    } else {
      const newArticle: Article = {
        id: crypto.randomUUID(),
        name: name.trim(),
        description: description.trim() || 'Pas de description',
        unitPrice: priceNum,
        createdAt: new Date().toISOString(),
      };
      onAddArticle(newArticle);
    }

    setIsModalOpen(false);
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden relative">
      {/* Search Bar (Matching screenshot 4) */}
      <div className="p-3.5 bg-white border-b border-slate-200">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher (nom, description, prix)..."
            className="w-full bg-slate-50 border border-slate-200 rounded-md py-2 pl-9.5 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      {/* List of Articles (Matching screenshot 4) */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-2 pb-28">
        {filteredArticles.length === 0 ? (
          <div className="py-12 text-center">
            <Package className="w-10 h-10 text-slate-300 mx-auto mb-2 stroke-1" />
            <p className="text-xs font-semibold text-slate-600">Aucun article trouvé</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Appuyez sur + Nouvel Article/Service ou scannez une photo
            </p>
          </div>
        ) : (
          filteredArticles.map((art) => (
            <div
              key={art.id}
              onClick={() => handleOpenEdit(art)}
              className="bg-white rounded-lg border border-slate-200/80 p-3  hover:border-blue-400 flex items-center justify-between transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center flex-shrink-0 border border-slate-200">
                  <Package className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 truncate">{art.name}</h4>
                  <p className="text-[11px] text-slate-400 truncate">
                    {art.description || 'Pas de description'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs font-extrabold text-slate-900">
                  {formatCurrency(art.unitPrice)}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteArticle(art);
                  }}
                  className="p-1.5 text-slate-300 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                  title="Supprimer"
                  aria-label={`Supprimer ${art.name}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {undoArticle && (
        <div role="status" className="fixed bottom-20 left-4 right-4 z-40 mx-auto flex max-w-md items-center justify-between gap-3 rounded-lg bg-slate-900 px-4 py-3 text-white shadow-xl">
          <span className="text-xs">Article supprimé</span>
          <button
            type="button"
            onClick={() => {
              onRestoreArticle(undoArticle);
              setUndoArticle(null);
            }}
            className="min-h-9 rounded-md px-3 text-xs font-bold text-blue-200 hover:bg-white/10"
          >
            Annuler
          </button>
        </div>
      )}

      {/* Floating Action Button (Matching screenshot 4: + Nouvel Article/Service) */}
      <div className="fixed bottom-20 right-5 z-20 flex flex-col items-end gap-2">
        <button
          type="button"
          onClick={onScanArticlePhoto}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 rounded-full text-xs font-bold shadow-sm active:scale-95 transition-all"
        >
          <Camera className="w-3.5 h-3.5" />
          <span>Scanner photo</span>
        </button>

        <Button
          variant="primary"
          size="md"
          
          onClick={handleOpenAdd}
          icon={Plus}
          className="shadow-xl ring-4 ring-emerald-500/15 px-5 py-3 font-bold"
        >
          Nouvel Article/Service
        </Button>
      </div>

      {/* Modal Nouvel Article / Service (Matching screenshot 10) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-lg shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {editingArticle ? "Modifier l'article" : 'Nouvel Article/Service'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                X
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-3.5">
              {/* Field 1: Box icon "Nom de l'article/service" */}
              <div className="space-y-1">
                <div className="relative flex items-center">
                  <Package className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nom de l'article/service"
                    className="w-full bg-slate-50 border border-slate-200 rounded-md py-2.5 pl-9.5 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Field 2: File/Text icon "Description (optionnel)" */}
              <div className="space-y-1">
                <div className="relative flex items-center">
                  <FileText className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Description (optionnel)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-md py-2.5 pl-9.5 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Field 3: Currency/Coins icon "Prix unitaire" */}
              <div className="space-y-1">
                <div className="relative flex items-center">
                  <Coins className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                  <input
                    type="number"
                    step="any"
                    required
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    placeholder="Prix unitaire"
                    className="w-full bg-slate-50 border border-slate-200 rounded-md py-2.5 pl-9.5 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Bottom buttons matching screenshot 10: Annuler (text) and + Ajouter (purple/blue ) */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Annuler
                </button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  
                  icon={Plus}
                  className="font-bold px-5"
                >
                  {editingArticle ? 'Enregistrer' : 'Ajouter'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
