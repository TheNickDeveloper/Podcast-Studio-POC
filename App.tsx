
import React, { useState, useEffect, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { AudioPlayer } from './components/AudioPlayer';
import { ArticleCard } from './components/ArticleCard';
import { AppState, NarratedArticle, AppView, VoiceOption } from './types';
import { summarizeArticle, generateSpeech } from './services/geminiService';
import { VOICES, STORAGE_KEY } from './constants';

const App: React.FC = () => {
  const [state, setState] = useState<AppState & { 
    playbackTime: number, 
    totalDuration: number,
    seekTo: number | null 
  }>({
    currentArticle: null,
    selectedArticleForScript: null,
    articles: [],
    view: 'home',
    isGenerating: false,
    activeVoiceId: VOICES[0].id,
    activeVoice2Id: VOICES[1].id,
    isDuoMode: false,
    targetLanguage: 'zh',
    playbackTime: 0,
    totalDuration: 0,
    seekTo: null
  });

  const [inputTitle, setInputTitle] = useState('');
  const [inputText, setInputText] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setState(prev => ({ ...prev, articles: parsed }));
      } catch (e) {
        console.error("Failed to load articles", e);
      }
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.articles));
    } catch (e) {
      console.warn("Storage quota exceeded", e);
    }
  }, [state.articles]);

  const handleGenerate = async () => {
    if (!inputText || !inputTitle) {
      setError("請輸入標題與文章內容。");
      return;
    }

    setState(prev => ({ ...prev, isGenerating: true }));
    setError(null);

    try {
      const script = await summarizeArticle(inputText, state.isDuoMode, state.targetLanguage);
      const audioBase64 = await generateSpeech(
        script, 
        state.activeVoiceId, 
        state.isDuoMode ? state.activeVoice2Id : undefined
      );

      const newArticle: NarratedArticle = {
        id: Date.now().toString(),
        title: inputTitle,
        originalText: inputText,
        summary: script,
        audioBase64: audioBase64,
        createdAt: Date.now(),
        voiceId: state.activeVoiceId,
        speaker2Id: state.isDuoMode ? state.activeVoice2Id : undefined,
        isDuo: state.isDuoMode,
        language: state.targetLanguage
      };

      setState(prev => ({
        ...prev,
        articles: [newArticle, ...prev.articles],
        currentArticle: newArticle,
        isGenerating: false,
        view: 'library',
        playbackTime: 0
      }));

      setInputTitle('');
      setInputText('');
    } catch (err: any) {
      console.error(err);
      setError("製作失敗，請再試一次。");
      setState(prev => ({ ...prev, isGenerating: false }));
    }
  };

  const deleteArticle = (id: string) => {
    setState(prev => ({
      ...prev,
      articles: prev.articles.filter(a => a.id !== id),
      currentArticle: prev.currentArticle?.id === id ? null : prev.currentArticle
    }));
  };

  const setView = (view: AppView) => setState(prev => ({ ...prev, view }));

  const onAudioTimeUpdate = (time: number, duration: number) => {
    setState(prev => ({ ...prev, playbackTime: time, totalDuration: duration, seekTo: null }));
  };

  const scriptParagraphs = useMemo(() => {
    if (!state.selectedArticleForScript) return [];
    
    const rawParagraphs = state.selectedArticleForScript.summary.split('\n').filter(p => p.trim());
    const totalChars = rawParagraphs.join('').length;
    let cumulativeChars = 0;

    return rawParagraphs.map(text => {
      const startChar = cumulativeChars;
      const charCount = text.length;
      cumulativeChars += charCount;
      return {
        text,
        startTimePercent: startChar / totalChars,
        endTimePercent: cumulativeChars / totalChars
      };
    });
  }, [state.selectedArticleForScript]);

  const handleParagraphClick = (startTimePercent: number) => {
    if (!state.currentArticle || state.currentArticle.id !== state.selectedArticleForScript?.id) {
       setState(prev => ({ 
         ...prev, 
         currentArticle: state.selectedArticleForScript,
         seekTo: startTimePercent * prev.totalDuration 
       }));
    } else {
       setState(prev => ({ ...prev, seekTo: startTimePercent * prev.totalDuration }));
    }
  };

  const VoiceCard = ({ voice, isActive, onClick, color = 'indigo' }: { voice: VoiceOption, isActive: boolean, onClick: () => void, color?: 'indigo' | 'purple' }) => (
    <button
      onClick={onClick}
      className={`relative p-3 rounded-2xl border-2 transition-all flex items-center space-x-3 text-left w-full group active:scale-[0.97] ${
        isActive 
        ? `bg-${color}-50 border-${color}-600 shadow-sm` 
        : 'bg-white border-slate-100 hover:border-slate-200'
      }`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-inner ${
        isActive ? `bg-${color}-600 text-white` : 'bg-slate-50 text-slate-400 group-hover:scale-110 transition-transform'
      }`}>
        {voice.gender === 'male' ? '👨' : '👩'}
      </div>
      <div className="flex-1 overflow-hidden">
        <div className="flex items-center justify-between">
          <span className={`text-xs font-bold truncate ${isActive ? `text-${color}-900` : 'text-slate-700'}`}>{voice.name}</span>
          <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full ${isActive ? `bg-${color}-200 text-${color}-800` : 'bg-slate-100 text-slate-400'}`}>
            {voice.tone}
          </span>
        </div>
        <p className={`text-[10px] truncate ${isActive ? `text-${color}-600` : 'text-slate-400'}`}>
          {voice.style}
        </p>
      </div>
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      <Sidebar currentView={state.view} setView={setView} />

      <main className="flex-1 w-full md:ml-64 p-4 md:p-10 pb-40 md:pb-32 overflow-x-hidden">
        {state.view === 'home' && (
          <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            <header className="mb-6 md:mb-10">
              <h1 className="text-3xl md:text-5xl font-outfit font-bold text-slate-900 mb-2 leading-tight">Podcast Studio</h1>
              <p className="text-slate-500 text-sm md:text-base">將任何文字轉換為高品質的 AI 對談與有聲書。</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
              <div 
                onClick={() => setView('generator')}
                className="bg-indigo-600 rounded-[2rem] p-6 md:p-8 text-white shadow-xl shadow-indigo-200 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all group"
              >
                <div className="w-12 h-12 md:w-14 md:h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h2 className="text-xl md:text-2xl font-bold mb-2">立即製作</h2>
                <p className="text-indigo-100 text-sm mb-6">支援單人敘述或雙人對談模式，自動生成專業腳本。</p>
                <div className="flex items-center text-xs md:text-sm font-bold bg-white/10 w-fit px-4 py-2 rounded-full">
                  開始使用 <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 7l5 5m0 0l-5 5m5-5H6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              </div>

              <div 
                onClick={() => setView('library')}
                className="bg-white rounded-[2rem] p-6 md:p-8 border border-slate-200 shadow-sm cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <div className="w-12 h-12 md:w-14 md:h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-6 text-slate-600">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-2">聆聽庫存</h2>
                <p className="text-slate-500 text-sm mb-6">管理已製作的有聲書，隨時查閱腳本與進度。</p>
                <div className="flex items-center text-xs md:text-sm font-bold text-indigo-600">
                  瀏覽媒體庫 ({state.articles.length}) <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 7l5 5m0 0l-5 5m5-5H6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {state.view === 'generator' && (
          <div className="max-w-4xl mx-auto bg-white rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-10 border border-slate-200 shadow-xl shadow-slate-200/50 animate-slide-up">
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-6 md:mb-8 border-b border-slate-100 pb-4">Podcast 製作器</h2>
            
            <div className="space-y-6 md:space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] md:text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">節目標題</label>
                    <input 
                      type="text" 
                      value={inputTitle}
                      onChange={(e) => setInputTitle(e.target.value)}
                      placeholder="例如：科技趨勢週報"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 text-sm font-medium transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] md:text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">目標語言</label>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => setState(prev => ({ ...prev, targetLanguage: 'zh' }))}
                        className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all border-2 ${state.targetLanguage === 'zh' ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-100 text-slate-500'}`}
                      >
                        繁體中文
                      </button>
                      <button 
                        onClick={() => setState(prev => ({ ...prev, targetLanguage: 'en' }))}
                        className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all border-2 ${state.targetLanguage === 'en' ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-100 text-slate-500'}`}
                      >
                        English
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-[10px] md:text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">敘事模式</label>
                  <div className="flex bg-slate-100 p-1 rounded-2xl">
                    <button 
                      onClick={() => setState(prev => ({ ...prev, isDuoMode: false }))}
                      className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${!state.isDuoMode ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeWidth="2"/></svg>
                      <span>單人旁白</span>
                    </button>
                    <button 
                      onClick={() => setState(prev => ({ ...prev, isDuoMode: true }))}
                      className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${state.isDuoMode ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857" strokeWidth="2"/></svg>
                      <span>雙人對談</span>
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] md:text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">原文內容</label>
                <textarea 
                  rows={6}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="請貼上文章內容或筆記..."
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-slate-900 text-sm leading-relaxed transition-all"
                ></textarea>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest">語音與人設</h3>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <p className="text-[10px] font-bold text-indigo-500 uppercase flex items-center">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center mr-2 text-[10px]">1</span>
                      {state.isDuoMode ? '主持人 A' : '主講人'}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {VOICES.map(voice => (
                        <VoiceCard 
                          key={voice.id} 
                          voice={voice} 
                          isActive={state.activeVoiceId === voice.id}
                          onClick={() => setState(prev => ({ ...prev, activeVoiceId: voice.id }))}
                        />
                      ))}
                    </div>
                  </div>

                  {state.isDuoMode && (
                    <div className="space-y-4">
                      <p className="text-[10px] font-bold text-purple-500 uppercase flex items-center">
                        <span className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center mr-2 text-[10px]">2</span>
                        主持人 B
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {VOICES.map(voice => (
                          <VoiceCard 
                            key={voice.id} 
                            voice={voice} 
                            color="purple"
                            isActive={state.activeVoice2Id === voice.id}
                            onClick={() => setState(prev => ({ ...prev, activeVoice2Id: voice.id }))}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <button 
                onClick={handleGenerate}
                disabled={state.isGenerating}
                className={`w-full py-4 md:py-5 rounded-2xl text-white font-bold text-base md:text-lg shadow-xl transition-all flex items-center justify-center space-x-3 active:scale-[0.98] ${
                  state.isGenerating ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {state.isGenerating ? (
                  <>
                    <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <span>正在生成製作中...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>製作我的節目</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {state.view === 'library' && (
          <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
            <header>
              <h1 className="text-3xl font-outfit font-bold text-slate-900 mb-2">Podcast 媒體庫</h1>
              <p className="text-slate-500 text-sm">點擊卡片查閱腳本，點擊播放鈕立即聆聽。</p>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {state.articles.map(article => (
                <ArticleCard 
                  key={article.id} 
                  article={article} 
                  onPlay={(a) => setState(prev => ({ ...prev, currentArticle: a, playbackTime: 0 }))}
                  onViewScript={(a) => setState(prev => ({ ...prev, selectedArticleForScript: a }))}
                  onDelete={deleteArticle}
                />
              ))}
              {state.articles.length === 0 && (
                <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
                  <p className="text-slate-400 text-sm">尚未有製作紀錄。</p>
                  <button onClick={() => setView('generator')} className="mt-4 text-indigo-600 font-bold hover:underline text-sm">立即開始製作</button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Full-screen Script Viewer for Mobile */}
      {state.selectedArticleForScript && (
        <div className="fixed inset-0 bg-white md:bg-slate-900/60 md:backdrop-blur-md z-[60] flex items-center justify-center animate-fade-in">
          <div className="bg-white w-full h-full md:h-auto md:max-w-2xl md:rounded-[2.5rem] shadow-2xl flex flex-col md:max-h-[85vh] overflow-hidden">
            <div className="p-6 md:p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex-1 mr-4">
                <h2 className="text-lg md:text-2xl font-bold text-slate-900 leading-tight truncate">{state.selectedArticleForScript.title}</h2>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-[9px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold uppercase">
                    {state.selectedArticleForScript.isDuo ? '對談' : '旁白'}
                  </span>
                  <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold uppercase">
                    {state.selectedArticleForScript.language === 'zh' ? '中文' : 'English'}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setState(prev => ({ ...prev, selectedArticleForScript: null }))}
                className="p-2 md:p-3 hover:bg-white hover:shadow-md rounded-xl text-slate-400 transition-all border border-slate-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-white space-y-3 md:space-y-4 pb-24 md:pb-8">
              {scriptParagraphs.map((para, i) => {
                const isPlayingThisArticle = state.currentArticle?.id === state.selectedArticleForScript?.id;
                const currentPercent = state.playbackTime / state.totalDuration;
                const isActive = isPlayingThisArticle && 
                                currentPercent >= para.startTimePercent && 
                                currentPercent < para.endTimePercent;
                
                const isSpeakerLine = para.text.startsWith('Host A:') || para.text.startsWith('Host B:');

                return (
                  <div 
                    key={i} 
                    onClick={() => handleParagraphClick(para.startTimePercent)}
                    className={`p-4 md:p-5 rounded-2xl md:rounded-3xl transition-all cursor-pointer group relative border-2 ${
                      isActive 
                      ? 'bg-indigo-50/50 border-indigo-200 shadow-sm scale-[1.01]' 
                      : 'bg-white border-transparent'
                    }`}
                  >
                    <p className={`leading-relaxed text-base md:text-lg ${
                      isActive ? 'text-slate-900 font-medium' : 'text-slate-500'
                    }`}>
                        {isSpeakerLine && (
                          <span className={`inline-block mr-2 px-2 py-0.5 rounded-lg text-[10px] uppercase font-bold mb-1 ${
                            para.text.startsWith('Host A') ? 'bg-indigo-600 text-white' : 'bg-purple-600 text-white'
                          }`}>
                            {para.text.split(':')[0]}
                          </span>
                        )}
                        <span className="block">{isSpeakerLine ? para.text.split(':').slice(1).join(':').trim() : para.text}</span>
                    </p>
                    {isActive && (
                      <div className="absolute left-[-4px] md:left-[-10px] top-1/2 -translate-y-1/2 w-1 md:w-1.5 h-8 md:h-12 bg-indigo-600 rounded-full shadow-lg"></div>
                    )}
                  </div>
                );
              })}
            </div>
            
            <div className="p-4 md:p-8 border-t border-slate-100 flex justify-center bg-slate-50/50 fixed md:relative bottom-0 left-0 right-0">
              <button 
                onClick={() => {
                  setState(prev => ({ ...prev, currentArticle: state.selectedArticleForScript, selectedArticleForScript: null, playbackTime: 0 }));
                }}
                className="w-full md:w-auto bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center space-x-3 shadow-xl shadow-indigo-200"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"/></svg>
                <span>全篇播放</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <AudioPlayer 
        article={state.currentArticle} 
        onClose={() => setState(prev => ({ ...prev, currentArticle: null }))}
        onTimeUpdate={onAudioTimeUpdate}
        seekRequest={state.seekTo}
      />
    </div>
  );
};

export default App;
