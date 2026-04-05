"use client";

import { useEffect, useRef, useState } from "react";

type CoachResponse = {
  transcript: string;
  coachText: string;
  coachAudioBase64: string;
};

export default function Home() {
  const [status, setStatus] = useState<
    "idle" | "recording" | "loading" | "error"
  >( "idle");
  const [last, setLast] = useState<CoachResponse | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    return () => mediaRecorderRef.current?.stop();
  }, []);

  async function startRecording() {
    try {
      setStatus("recording");

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];

      rec.ondataavailable = (e) => chunksRef.current.push(e.data);

      rec.onstop = async () => {
        setStatus("loading");
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const form = new FormData();
        form.append("audio", blob, "input.webm");

        try {
          const res = await fetch("/api/coach", { method: "POST", body: form });
          if (!res.ok) throw new Error(await res.text());
          const data = (await res.json()) as CoachResponse;

          setLast(data);
          setStatus("idle");

          if (data.coachAudioBase64) {
            const audio = new Audio(
              `data:audio/wav;base64,${data.coachAudioBase64}`
            );
            await audio.play();
          }
        } catch (err) {
          console.error(err);
          setStatus("error");
        }
      };

      mediaRecorderRef.current = rec;
      rec.start();
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
  }

  return (
    <main
      style={{
        maxWidth: 700,
        margin: "0 auto",
        padding: 24,
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1>Dr. G's Language Coach</h1>
      <p>
        <strong>Status:</strong> {status}
      </p>
      <p style={{ marginTop: 8 }}>
        Tip: Speak in Spanish. The UI is English, but the practice is Spanish.
      </p>

      {status === "idle" && <button onClick={startRecording}>🎙️ Talk</button>}
      {status === "recording" && <button onClick={stopRecording}>⏹️ Stop</button>}

      {status === "error" && (
        <p style={{ color: "red" }}>
          There was an error (microphone permissions or backend). Please try again.
        </p>
      )}

      {last && (
        <section style={{ marginTop: 24 }}>
          <h3>Transcript</h3>
          <p>{last.transcript}</p>
          <h3>Dr. G</h3>
          <p>{last.coachText}</p>
        </section>
      )}
    </main>
  );
}
