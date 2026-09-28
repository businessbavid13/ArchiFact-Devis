import { useCallback } from 'react';
import { Article } from '../types';
import { normalizeLegacyId, useSupabaseCollection } from './useSupabaseCollection';

function mapArticle(row: Record<string, unknown>): Article {
  return {
    id: String(row.id),
    name: String(row.name || ''),
    description: row.description as string | undefined,
    unitPrice: Number(row.unit_price) || 0,
    unit: row.unit as string | undefined,
    createdAt: String(row.created_at || new Date().toISOString()),
  };
}

function articleToRow(article: Article): Record<string, unknown> {
  return {
    id: normalizeLegacyId(article.id),
    name: article.name,
    description: article.description || null,
    unit_price: article.unitPrice,
    unit: article.unit || null,
    created_at: article.createdAt,
  };
}

export function useArticles(userId: string | null) {
  const collection = useSupabaseCollection<Article>({
    table: 'articles',
    userId,
    localStorageKey: 'df_articles',
    mapRow: mapArticle,
    toRow: articleToRow,
  });

  const addArticle = useCallback((article: Article) => {
    void collection.save(article);
  }, [collection.save]);

  const updateArticle = useCallback((article: Article) => {
    void collection.save(article);
  }, [collection.save]);

  const deleteArticle = useCallback((id: string) => {
    void collection.remove(id);
  }, [collection.remove]);

  const addBulkArticles = useCallback((articles: Article[]) => {
    void collection.saveMany(articles);
  }, [collection.saveMany]);

  return {
    articles: collection.items,
    setArticles: collection.setItems,
    addArticle,
    updateArticle,
    deleteArticle,
    addBulkArticles,
    isLoading: collection.isLoading,
  };
}
