import React from 'react';
import { ArticlesScreen } from '../../screens/Articles/ArticlesScreen';
import { useAppContext } from '../AppContext';

export function ArticlesPage() {
  const ctx = useAppContext();

  return (
    <ArticlesScreen
      articles={ctx.articles}
      onAddArticle={(article) => {
        ctx.addArticle(article);
        ctx.notify('Article enregistré');
      }}
      onUpdateArticle={(article) => {
        ctx.updateArticle(article);
        ctx.notify('Article mis à jour');
      }}
      onDeleteArticle={ctx.deleteArticle}
      onRestoreArticle={ctx.addArticle}
      onScanArticlePhoto={() => ctx.openPhotoScan('article')}
    />
  );
}
