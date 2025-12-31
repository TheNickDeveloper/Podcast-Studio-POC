
import React, { useState, useRef, useEffect } from 'react';
import { NarratedArticle } from '../types';
import { decodeBase64, decodeAudioData } from '../services/geminiService';

interface AudioPlayerProps {
  article: NarratedArticle | null;
  onClose?: () => void;
  onTimeUpdate?: (time: number, duration: number) => void;
  seekRequest?: number | null;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ article, onClose, onTimeUpdate, seekRequest }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const startedAtRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);
  const bufferRef = useRef<AudioBuffer | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    stopPlayback();
    if (article?.audioBase64) {
      prepareAudio(article.audioBase64);
    }
    return () => stopPlayback();
  }, [article]);

  useEffect(() => {
    if (seekRequest !== undefined && seekRequest !== null && bufferRef.current) {
      playBuffer(seekRequest);
    }
  }, [seekRequest]);

  const prepareAudio = async (base64: string) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      
      const bytes = decodeBase64(base64);
      const buffer = await decodeAudioData(bytes, audioContextRef.current, 24000, 1);
      bufferRef.current = buffer;
      setDuration(buffer.duration);
      setCurrentTime(0);
      setProgress(0);
      
      playBuffer(0);
    } catch (error) {
      console.error("Audio preparation failed:", error);
    }
  };

  const playBuffer = (offset: number) => {
    if (!bufferRef.current || !audioContextRef.current) return;

    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.stop(); } catch(e) {}
    }

    const source = audioContextRef.current.createBufferSource();
    source.buffer = bufferRef.current;
    source.connect(audioContextRef.current.destination);
    
    source.onended = () => {
      if (audioContextRef.current && audioContextRef.current.currentTime - startedAtRef.current >= bufferRef.current!.duration - offset - 0.1) {
        setIsPlaying(false);
        if (timerRef.current) window.clearInterval(timerRef.current);
      }
    };

    const startTime = audioContextRef.current.currentTime;
    source.start(0, offset);
    
    sourceNodeRef.current = source;
    startedAtRef.current = startTime - offset;
    setIsPlaying(true);

    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      if (audioContextRef.current) {
        const now = Math.min(audioContextRef.current.currentTime - startedAtRef.current, bufferRef.current!.duration);
        setCurrentTime(now);
        setProgress((now / bufferRef.current!.duration) * 100);
        if (onTimeUpdate) onTimeUpdate(now, bufferRef.current!.duration);
      }
    }, 100);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    setProgress((newTime / duration) * 100);
    playBuffer(newTime);
  };

  const togglePlay = async () => {
    if (!audioContextRef.current || !bufferRef.current) return;
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    if (isPlaying) {
      pausedAtRef.current = audioContextRef.current.currentTime - startedAtRef.current;
      if (sourceNodeRef.current) sourceNodeRef.current.stop();
      if (timerRef.current) window.clearInterval(timerRef.current);
      setIsPlaying(false);
    } else {
      const offset = pausedAtRef.current >= bufferRef.current.duration ? 0 : pausedAtRef.current;
      playBuffer(offset);
    }
  };

  const stopPlayback = () => {
    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.stop(); } catch(e) {}
      sourceNodeRef.current = null;
    }
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsPlaying(false);
    pausedAtRef.current = 0;
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  if (!article) return null;

  return (
    <div className="fixed bottom-[64px] md:bottom-0 left-0 right-0 md:left-64 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-3 md:p-4 shadow-[0_-10px_30px_rgba(0,0,0,0.1)] z-40 animate-slide-up">
      <div className="max-w-4xl mx-auto flex flex-col items-center space-y-2 md:space-y-0 md:flex-row md:space-x-8">
        
        {/* Title & Info */}
        <div className="flex items-center space-x-3 w-full md:w-64">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-600 rounded-lg flex-shrink-0 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
            </svg>
          </div>
          <div className="overflow-hidden">
            <h4 className="text-sm font-bold text-slate-900 truncate">{article.title}</h4>
            <p className="text-[10px] text-slate-500 truncate uppercase tracking-widest font-bold">{article.isDuo ? '對談模式' : '旁白模式'} • {article.voiceId}</p>
          </div>
          <div className="flex-1 md:hidden flex justify-end">
             <button onClick={onClose} className="p-2 text-slate-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
             </button>
          </div>
        </div>

        {/* Controls & Progress */}
        <div className="flex-1 flex flex-col items-center space-y-1 w-full">
          <div className="flex items-center space-x-6">
            <button className="text-slate-300 hover:text-indigo-600 transition-colors hidden md:block">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z"/></svg>
            </button>
            <button 
              onClick={togglePlay}
              className="w-12 h-12 md:w-14 md:h-14 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all"
            >
              {isPlaying ? (
                <svg className="w-6 h-6 md:w-7 md:h-7" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
              ) : (
                <svg className="w-6 h-6 md:w-7 md:h-7" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"/></svg>
              )}
            </button>
            <button className="text-slate-300 hover:text-indigo-600 transition-colors hidden md:block">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798l-5.445-3.63z"/></svg>
            </button>
          </div>
          
          <div className="flex items-center space-x-3 w-full px-1">
            <span className="text-[9px] md:text-[10px] font-mono font-bold text-slate-400 w-10 text-right">{formatTime(currentTime)}</span>
            <div className="flex-1 relative group flex items-center h-4 md:h-6">
              <input 
                type="range"
                min="0"
                max={duration || 0}
                step="0.1"
                value={currentTime}
                onChange={handleSeek}
                className="absolute inset-0 w-full h-1 md:h-1.5 bg-slate-100 rounded-full appearance-none cursor-pointer accent-indigo-600 hover:accent-indigo-700 transition-all z-10"
                style={{
                   background: `linear-gradient(to right, #4f46e5 ${progress}%, #f1f5f9 ${progress}%)`
                }}
              />
            </div>
            <span className="text-[9px] md:text-[10px] font-mono font-bold text-slate-400 w-10">{formatTime(duration)}</span>
          </div>
        </div>

        <div className="hidden md:flex items-center space-x-4 w-48 justify-end">
          <button onClick={onClose} className="text-slate-300 hover:text-red-500 transition-colors p-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
};
