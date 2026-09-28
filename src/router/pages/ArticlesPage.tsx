import React from 'react';
import { ArticlesScreen } from '../../screens/Articles/ArticlesScreen';
import { useAppContext } from '../AppContext';

export function ArticlesPage() {
  const ctx = useAppContext();

  return (
    <ArticlesScreen
      articles={ctx.articles}
      onAddArticle={ctx.addArticle}
      onUpdateArticle={ctx.updateArticle}
      onDeleteArticle={ctx.deleteArticle}
      onRestoreArticle={ctx.addArticle}
      onScanArticlePhoto={() => ctx.openPhotoScan('article')}
    />
  );
}
