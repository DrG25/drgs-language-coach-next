import { NextRequest, NextResponse } from "next/server";
import { getTranscript, getCoachText, synthesizeSpeech } from "@/lib/coach";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const audioFile = formData.get("audio") as File | null;

  if (!audioFile) {
    return NextResponse.json({ error: "audio missing" }, { status: 400 });
  }

  const audioBuffer = Buffer.from(await audioFile.arrayBuffer());

  // Default: Spanish. Later set from client selection.
  const targetLanguage = "es";

  const transcript = await getTranscript(audioBuffer);
  const coachText = await getCoachText({
    transcript,
    targetLanguage,
    studentLevel: "beginner",
  });

  const coachAudioBase64 = await synthesizeSpeech({
    text: coachText,
    language: targetLanguage,
  });

  return NextResponse.json({ transcript, coachText, coachAudioBase64 });
}
