import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function openAiTranscribe(
  audioBuffer: Buffer,
  language?: string
): Promise<string> {
  // OpenAI SDK types require an Uploadable (File/Blob), but the API supports { data, name } too.
  const file = { data: audioBuffer, name: "input.webm" } as any;

  const res = await openai.audio.transcriptions.create({
    file,
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

export async function openAiCoachText(params: DrGParams) {
  const { transcript, targetLanguage, studentLevel } = params;

  const systemPrompt = `
Eres "Dr. G's Language Coach", un coach de idiomas claro, paciente y directo.
Tu objetivo: ayudar al estudiante a practicar HABLAR en ${targetLanguage}.
Reglas:
- Saluda breve y empieza.
- Corrige errores sin humillar: da la frase correcta, explica 1 cosa máx, y luego pide repetición.
- Mantén respuestas cortas (1-3 frases), especialmente para nivel ${studentLevel}.
- Si el transcript está vacío o incoherente, pide que repita/describa nuevamente.
- No cambies de idioma salvo para una explicación mínima.
`;

  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_GPT_MODEL || "gpt-4",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `TRANSCRIPT: ${transcript}` },
    ],
    temperature: 0.3,
  });

  return (
    completion.choices[0]?.message?.content?.trim() ||
    "Repitamos de nuevo, por favor."
  );
}

export async function openAiTextToSpeech(text: string, language: string) {
  const tts = await openai.audio.speech.create({
    model: process.env.OPENAI_TTS_MODEL || "tts-1",
    voice: process.env.OPENAI_TTS_VOICE || "alloy",
    input: text,
  });

  const buffer = Buffer.from(await tts.arrayBuffer());
  return buffer.toString("base64");
}
