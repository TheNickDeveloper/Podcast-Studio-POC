
import { GoogleGenAI, Modality, Type } from "@google/genai";

const API_KEY = process.env.API_KEY || "";

export function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const summarizeArticle = async (text: string, isDuo: boolean, language: 'zh' | 'en'): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const langContext = language === 'zh' ? 'Traditional Chinese (zh-TW)' : 'English (en-US)';
  
  const prompt = isDuo 
    ? `Rewrite the following article as an engaging, natural conversation between two podcast hosts: "Host A" and "Host B". 
       They should discuss the main points, express curiosity, and make it sound like a real radio show.
       CRITICAL: The entire output must be in ${langContext}.
       Format the output like:
       Host A: [Text]
       Host B: [Text]
       
       Article: ${text}`
    : `Please summarize the following article into an engaging narrator script. Keep it friendly and informative.
       CRITICAL: The entire output must be in ${langContext}.
       Article: ${text}`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
  });
  return response.text || "Summary generation failed.";
};

export const generateSpeech = async (text: string, voice1: string, voice2?: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const config: any = {
    responseModalities: [Modality.AUDIO],
  };

  if (voice2) {
    config.speechConfig = {
      multiSpeakerVoiceConfig: {
        speakerVoiceConfigs: [
          { speaker: 'Host A', voiceConfig: { prebuiltVoiceConfig: { voiceName: voice1 } } },
          { speaker: 'Host B', voiceConfig: { prebuiltVoiceConfig: { voiceName: voice2 } } },
        ]
      }
    };
  } else {
    config.speechConfig = {
      voiceConfig: {
        prebuiltVoiceConfig: { voiceName: voice1 },
      },
    };
  }

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config,
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) {
    throw new Error("Failed to generate audio data.");
  }
  return base64Audio;
};
