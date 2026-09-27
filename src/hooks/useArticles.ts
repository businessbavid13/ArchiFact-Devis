import { useCallback } from 'react';
import { Article } from '../types';
import { usePersistedState } from './usePersistedState';
import { INITIAL_ARTICLES } from '../data/mockData';

export function useArticles() {
  const [articles, setArticles] = usePersistedState<Article[]>('df_articles', INITIAL_ARTICLES);

  const addArticle = useCallback((article: Article) => {
    setArticles((prev) => [article, ...prev]);
  }, [setArticles]);

  const updateArticle = useCallback((article: Article) => {
    setArticles((prev) => prev.map((a) => (a.id === article.id ? article : a)));
  }, [setArticles]);

  const deleteArticle = useCallback((id: string) => {
    setArticles((prev) => prev.filter((a) => a.id !== id));
  }, [setArticles]);

  const addBulkArticles = useCallback((newArticles: Article[]) => {
    setArticles((prev) => [...newArticles, ...prev]);
  }, [setArticles]);

  return {
    articles,
    setArticles,
    addArticle,
    updateArticle,
    deleteArticle,
    addBulkArticles,
  };
}
