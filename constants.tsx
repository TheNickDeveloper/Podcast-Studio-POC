
import { VoiceOption } from './types';

export const VOICES: VoiceOption[] = [
  { id: 'Kore', name: 'Kore', gender: 'male', style: 'Cheerful & Bright', tone: 'Energetic' },
  { id: 'Puck', name: 'Puck', gender: 'female', style: 'Professional & Calm', tone: 'Authoritative' },
  { id: 'Charon', name: 'Charon', gender: 'male', style: 'Deep & Narrative', tone: 'Storyteller' },
  { id: 'Fenrir', name: 'Fenrir', gender: 'male', style: 'Bold & Energetic', tone: 'Passionate' },
  { id: 'Zephyr', name: 'Zephyr', gender: 'female', style: 'Warm & Friendly', tone: 'Comforting' },
];

export const STORAGE_KEY = 'vox_narrate_data_v2';
