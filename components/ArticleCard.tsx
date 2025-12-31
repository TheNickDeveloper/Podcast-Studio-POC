
import React from 'react';
import { NarratedArticle } from '../types';

interface ArticleCardProps {
  article: NarratedArticle;
  onPlay: (article: NarratedArticle) => void;
  onViewScript: (article: NarratedArticle) => void;
  onDelete: (id: string) => void;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({ article, onPlay, onViewScript, onDelete }) => {
  const dateStr = new Date(article.createdAt).toLocaleDateString();

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 hover:border-indigo-100 transition-all hover:shadow-xl hover:shadow-indigo-500/5 group flex flex-col h-full">
      <div className="flex justify-between items-start mb-4">
        <div className="flex space-x-2">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
            {article.isDuo ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            )}
          </div>
          <button 
            onClick={() => onViewScript(article)}
            className="p-2 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
            title="View Script"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>
        </div>
        <button 
          onClick={() => onDelete(article.id)}
          className="text-slate-300 hover:text-red-500 transition-colors p-1"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
      
      <h3 
        onClick={() => onViewScript(article)}
        className="text-lg font-bold text-slate-800 mb-2 line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors cursor-pointer"
      >
        {article.title}
      </h3>
      <p className="text-sm text-slate-500 line-clamp-3 mb-6 leading-relaxed flex-grow">
        {article.summary}
      </p>

      <div className="flex items-center justify-between pt-4 border-t border-slate-50">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Mode</span>
          <span className="text-xs font-semibold text-slate-600">{article.isDuo ? 'Podcast Duo' : 'Narrator'}</span>
        </div>
        <button 
          onClick={() => onPlay(article)}
          className="bg-slate-900 text-white p-3 rounded-full hover:bg-indigo-600 transition-all hover:scale-110 active:scale-95 shadow-lg shadow-slate-900/10"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};
