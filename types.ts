
export interface VoiceOption {
  id: string;
  name: string;
  gender: 'male' | 'female';
  style: string;
  tone: string;
}

export interface NarratedArticle {
  id: string;
  title: string;
  originalText: string;
  summary: string;
  audioBase64?: string;
  createdAt: number;
  voiceId: string;
  speaker2Id?: string;
  isDuo: boolean;
  language: 'zh' | 'en';
  duration?: number;
}

export type AppView = 'home' | 'library' | 'generator';

export interface AppState {
  currentArticle: NarratedArticle | null;
  selectedArticleForScript: NarratedArticle | null;
  articles: NarratedArticle[];
  view: AppView;
  isGenerating: boolean;
  activeVoiceId: string;
  activeVoice2Id: string;
  isDuoMode: boolean;
  targetLanguage: 'zh' | 'en';
}
