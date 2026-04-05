"use client";

import { useEffect, useRef, useState } from "react";

type CoachResponse = {
  transcript: string;
  coachText: string;
  coachAudioBase64: string;
};

export default function Home() {
  const [status, setStatus] = useState<"idle" | "recording" | "loading" | "error">(
    "idle"
  );
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
        lineHeight: 1.55,
      }}
    >
      <h1>Dr. G&apos;s Language Coach</h1>

      <p>
        <strong>Status:</strong> {status}
      </p>
      <p style={{ marginTop: 8 }}>
        Tip: Speak in Spanish. The UI is English, but the practice is Spanish.
      </p>

      <section style={{ marginTop: 24 }}>
        <h2>How it works</h2>
        <ol style={{ paddingLeft: 20 }}>
          <li>Tap <strong>Talk</strong> and speak into your microphone.</li>
          <li>Stop when you are done.</li>
          <li>Dr. G transcribes you, coaches you, and plays back the correction.</li>
        </ol>
      </section>

      <section style={{ marginTop: 20 }}>
        <h2>What you need</h2>
        <ul style={{ paddingLeft: 20 }}>
          <li>Microphone access in your browser</li>
          <li>A quiet space (background noise affects results)</li>
          <li>Internet connection</li>
        </ul>
      </section>

      <section style={{ marginTop: 20 }}>
        <h2>Supported languages</h2>
        <p>
          Practice language: <strong>Spanish</strong> (more languages can be added later).
        </p>
      </section>

      {status === "idle" && (
        <button onClick={startRecording} style={{ marginTop: 16 }}>
          🎙️ Talk
        </button>
      )}
      {status === "recording" && (
        <button onClick={stopRecording} style={{ marginTop: 16 }}>
          ⏹️ Stop
        </button>
      )}

      {status === "error" && (
        <section style={{ marginTop: 20 }}>
          <p style={{ color: "red", marginBottom: 8 }}>
            There was an error (microphone permissions or backend). Please try again.
          </p>
          <p>
            If your microphone is disconnected or blocked, enable it in your browser permissions or System
            Settings &gt; Privacy &amp; Security &gt; Microphone.
          </p>
        </section>
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
