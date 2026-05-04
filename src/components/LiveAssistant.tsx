"use client";

import React, { useEffect, useRef, useState } from "react";
import { GoogleGenAI, Modality } from "@google/genai";
import { arrayBufferToBase64, base64ToArrayBuffer, float32ToInt16, int16ToFloat32 } from "@/lib/audio-utils";
import { useLiveAssistant } from "@/lib/contexts/LiveAssistantContext";

interface LiveAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LiveAssistant: React.FC<LiveAssistantProps> = ({ isOpen, onClose }) => {
  const [status, setStatus] = useState<"idle" | "connecting" | "active" | "error">("idle");
  const [showSettings, setShowSettings] = useState(false);
  const [language, setLanguage] = useState("he-IL");
  const [personality, setPersonality] = useState("professional");
  const [isMuted, setIsMuted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { contextData } = useLiveAssistant();

  const audioContextRef = useRef<AudioContext | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sessionRef = useRef<any>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioQueueRef = useRef<Float32Array[]>([]);
  const isPlayingRef = useRef(false);
  const statusRef = useRef(status);
  const mutedRef = useRef(isMuted);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    mutedRef.current = isMuted;
  }, [isMuted]);

  const disconnect = () => {
    processorRef.current?.disconnect();
    sessionRef.current?.disconnect?.();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    audioContextRef.current?.close().catch(() => undefined);
    processorRef.current = null;
    sessionRef.current = null;
    streamRef.current = null;
    audioContextRef.current = null;
    audioQueueRef.current = [];
    isPlayingRef.current = false;
    setStatus("idle");
  };

  const playNextChunk = async () => {
    if (audioQueueRef.current.length === 0 || !audioContextRef.current) {
      isPlayingRef.current = false;
      return;
    }

    isPlayingRef.current = true;
    const chunk = audioQueueRef.current.shift();
    if (!chunk) return;

    const buffer = audioContextRef.current.createBuffer(1, chunk.length, 24000);
    buffer.getChannelData(0).set(chunk);
    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContextRef.current.destination);
    source.onended = () => void playNextChunk();
    source.start();
  };

  const connect = async () => {
    try {
      disconnect();
      setErrorMessage(null);
      setStatus("connecting");

      const tokenRes = await fetch("/api/auth/live-token", { method: "POST" });
      const { token, error } = (await tokenRes.json()) as { token?: string; error?: string };
      if (!tokenRes.ok || error || !token) throw new Error(error || "Live assistant token is unavailable");

      const ai = new GoogleGenAI({
        apiKey: token,
        httpOptions: { apiVersion: "v1alpha" },
      });

      let contextInstruction = "";
      if (contextData) {
        contextInstruction = `\n\nCURRENT DOCUMENT CONTEXT:\nThe user is currently viewing a document named "${contextData.originalFilename}".\n`;
        if (contextData.summary) contextInstruction += `Summary of this document: ${contextData.summary}\n`;
        if (contextData.full_ocr_text) {
          contextInstruction += `Raw text of the document: \n${contextData.full_ocr_text.substring(0, 5000)}\n`;
        }
        contextInstruction += `If the user asks questions like "what is this" or "how much", refer to this document context first.`;
      }

      const session = await ai.live.connect({
        model: process.env.NEXT_PUBLIC_GEMINI_LIVE_MODEL || "gemini-2.0-flash-exp",
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction:
            `You are Keeper AI. Personality: ${personality}. Language: ${language}. ` +
            "Help the user manage documents, payments, reminders, and search calmly and concisely." +
            contextInstruction,
        },
        callbacks: {
          onopen: () => setStatus("active"),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onmessage: (response: any) => {
            const parts = response.serverContent?.modelTurn?.parts ?? [];
            for (const part of parts) {
              if (!part.inlineData?.data) continue;
              const audioBuffer = base64ToArrayBuffer(part.inlineData.data);
              audioQueueRef.current.push(int16ToFloat32(new Int16Array(audioBuffer)));
              if (!isPlayingRef.current) void playNextChunk();
            }
          },
          onerror: () => {
            setStatus("error");
            setErrorMessage("החיבור לעוזר הקולי הופסק. בדקו הרשאת מיקרופון ונסו שוב.");
          },
        },
      });

      sessionRef.current = session;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const AudioCtor = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtor({ sampleRate: 16000 });
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (event) => {
        if (!sessionRef.current || mutedRef.current || statusRef.current !== "active") return;

        const inputData = event.inputBuffer.getChannelData(0);
        const pcmData = float32ToInt16(inputData);
        sessionRef.current.sendRealtimeInput({
          audio: {
            data: arrayBufferToBase64(pcmData.buffer),
            mimeType: "audio/pcm;rate=16000",
          },
        });
      };

      source.connect(processor);
      processor.connect(audioCtx.destination);
    } catch (err: unknown) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "לא ניתן להפעיל את העוזר הקולי כרגע.");
    }
  };

  useEffect(() => {
    if (!isOpen) disconnect();
    return () => disconnect();
  }, [isOpen]);

  if (!isOpen) return null;

  const bars = [44, 78, 58, 96, 66, 112, 74, 90, 52, 84, 62, 102];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur-md">
      <section className="surface relative w-full max-w-lg overflow-hidden rounded-3xl p-6 text-white">
        <div className="flex items-center justify-between border-b border-white/10 pb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-200">Keeper Live</p>
            <h2 className="mt-1 text-2xl font-bold">עוזר קולי למסמכים</h2>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowSettings((value) => !value)}
              className="focus-ring grid h-10 w-10 place-items-center rounded-full bg-white/10 text-sm font-bold hover:bg-white/15"
              aria-label="הגדרות"
            >
              ⚙
            </button>
            <button
              type="button"
              onClick={onClose}
              className="focus-ring grid h-10 w-10 place-items-center rounded-full bg-white/10 text-sm font-bold hover:bg-white/15"
              aria-label="סגירה"
            >
              ×
            </button>
          </div>
        </div>

        {showSettings ? (
          <div className="grid gap-4 py-8 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-semibold text-slate-300">
              שפה
              <select
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
                className="focus-ring w-full rounded-2xl border border-white/10 bg-slate-950 p-3 text-white"
              >
                <option value="he-IL">עברית</option>
                <option value="en-US">English</option>
                <option value="ru-RU">Русский</option>
              </select>
            </label>
            <label className="space-y-2 text-sm font-semibold text-slate-300">
              סגנון
              <select
                value={personality}
                onChange={(event) => setPersonality(event.target.value)}
                className="focus-ring w-full rounded-2xl border border-white/10 bg-slate-950 p-3 text-white"
              >
                <option value="professional">מקצועי</option>
                <option value="friendly">ידידותי</option>
                <option value="minimalist">תמציתי</option>
              </select>
            </label>
          </div>
        ) : (
          <div className="py-10">
            <div className="mx-auto flex h-44 max-w-sm flex-col items-center justify-center rounded-3xl bg-white/[0.04]">
              {status === "error" ? (
                <div className="px-8 text-center">
                  <p className="text-base font-semibold text-red-200">{errorMessage}</p>
                  <button
                    type="button"
                    onClick={() => void connect()}
                    className="focus-ring mt-5 rounded-full bg-white px-5 py-2 text-sm font-bold text-slate-950 hover:bg-slate-100"
                  >
                    נסו שוב
                  </button>
                </div>
              ) : status === "active" ? (
                <div className="flex flex-col items-center justify-center">
                  <div className="flex h-20 items-center gap-2" aria-label="העוזר מאזין">
                    {bars.map((height, index) => (
                      <span
                        key={`${height}-${index}`}
                        className="w-2 rounded-full bg-gradient-to-t from-blue-500 via-teal-300 to-amber-200"
                        style={{ height: height * 0.7, opacity: isMuted ? 0.35 : 1 }}
                      />
                    ))}
                  </div>
                  {contextData && (
                    <div className="mt-4 px-4 py-1 rounded-full bg-white/10 border border-white/10 text-[11px] font-bold text-teal-200">
                      מודע למסמך הפתוח
                    </div>
                  )}
                </div>
              ) : status === "connecting" ? (
                <div className="text-center">
                  <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-teal-300 border-t-transparent" />
                  <p className="mt-4 text-sm text-slate-400">מתחבר לעוזר הקולי...</p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-base font-semibold text-white">מוכן להתחיל שיחה קולית</p>
                  <p className="mt-2 text-sm text-slate-400">החיבור יתחיל רק אחרי אישור שלך.</p>
                  <button
                    type="button"
                    onClick={() => void connect()}
                    className="focus-ring mt-5 rounded-full bg-teal-300 px-5 py-2 text-sm font-black text-slate-950 hover:bg-teal-200"
                  >
                    התחלת שיחה
                  </button>
                </div>
              )}
            </div>

            <div className="mt-5 flex items-center justify-center gap-2 text-sm text-slate-400">
              <span className={`h-2.5 w-2.5 rounded-full ${status === "active" ? "bg-teal-300" : "bg-slate-600"}`} />
              {status === "active" ? "פעיל ומוכן" : status === "connecting" ? "מתחבר" : status === "error" ? "שגיאה" : "ממתין"}
            </div>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setIsMuted((value) => !value)}
            className={`focus-ring rounded-2xl border px-4 py-3 text-sm font-bold transition ${
              isMuted
                ? "border-amber-300/30 bg-amber-300/10 text-amber-100"
                : "border-white/10 bg-white/10 text-white hover:bg-white/15"
            }`}
          >
            {isMuted ? "הפעלת מיקרופון" : "השתקת מיקרופון"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="focus-ring rounded-2xl bg-red-500/90 px-4 py-3 text-sm font-bold text-white hover:bg-red-500"
          >
            סיום שיחה
          </button>
        </div>
      </section>
    </div>
  );
};
