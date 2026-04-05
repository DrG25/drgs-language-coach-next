import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function openAiTranscribe(
  audioBuffer: Buffer,
  language?: string
): Promise<string> {
  const res = await openai.audio.transcriptions.create({
    file: { data: audioBuffer, name: "input.webm" },
    model: process.env.OPENAI_WHISPER_MODEL || "whisper-1",
    language,
  });
  return (res as any).text ?? "";
}

type DrGParams = {
  transcript: string;
  targetLanguage: string;
  studentLevel: "beginner" | "intermediate" | "advanced";
};

export async function openAiCoachText(params: DrGParams): Promise<string> {
  const { transcript, targetLanguage, studentLevel } = params;

  const systemPrompt = `
Eres "Dr. G's Language Coach", un coach de idiomas claro y directo.
Objetivo: practicar conversación en ${targetLanguage}.

Reglas:
- Responde en ${targetLanguage}, con frases cortas.
- Corrige suavemente: da la frase correcta, explica 1 punto máximo.
- Termina pidiendo repetir: "Repítelo" o "Repite la frase".
- Si el transcript está vacío o confuso, pide repetir.
Nivel del estudiante: ${studentLevel}.
`;

  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_GPT_MODEL || "gpt-4",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `TRANSCRIPT: ${transcript}` },
    ],
    temperature: 0.3,
  });

  return completion.choices[0]?.message?.content?.trim() || "Repitamos, por favor.";
}

export async function openAiTextToSpeech(text: string, language: string): Promise<string> {
  // Puedes cambiar voz según idioma.
  const voice = process.env.OPENAI_TTS_VOICE || "alloy";

  const tts = await openai.audio.speech.create({
    model: process.env.OPENAI_TTS_MODEL || "tts-1",
    voice,
    input: text,
  });

  const buffer = Buffer.from(await tts.arrayBuffer());
  return buffer.toString("base64");
}
