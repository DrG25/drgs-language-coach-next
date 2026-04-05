import { openAiCoachText, openAiTextToSpeech, openAiTranscribe } from "./providers/openai";

export type StudentLevel = "beginner" | "intermediate" | "advanced";
export type TargetLanguage = "es" | "en" | "fr";

export async function getTranscript(audioBuffer: Buffer): Promise<string> {
  // language optional; you can pass "es" or "en" for a little control.
  return openAiTranscribe(audioBuffer);
}

export async function getCoachText(params: {
  transcript: string;
  targetLanguage: TargetLanguage;
  studentLevel: StudentLevel;
}): Promise<string> {
  return openAiCoachText(params);
}

export async function synthesizeSpeech(opts: {
  text: string;
  language: string;
}): Promise<string> {
  // return base64-encoded WAV
  return openAiTextToSpeech(opts.text, opts.language);
}
