import { useEffect, useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";

type SpeechResult = { transcript: string };
type SpeechEvent = { results: ArrayLike<ArrayLike<SpeechResult>> };
type SpeechErrorEvent = { error: string };
type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: SpeechEvent) => void) | null;
  onerror: ((event: SpeechErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type SpeechConstructor = new () => SpeechRecognitionLike;
type SpeechWindow = Window & {
  SpeechRecognition?: SpeechConstructor;
  webkitSpeechRecognition?: SpeechConstructor;
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  compact?: boolean;
};

export default function VoiceInput({ value, onChange, compact = false }: Props) {
  const [language, setLanguage] = useState("en-IN");
  const [recording, setRecording] = useState(false);
  const [status, setStatus] = useState("");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const transcriptRef = useRef(value);
  const resultIndexRef = useRef(0);

  useEffect(() => { transcriptRef.current = value; }, [value]);

  const Recognition = typeof window === "undefined"
    ? undefined
    : (window as SpeechWindow).SpeechRecognition ?? (window as SpeechWindow).webkitSpeechRecognition;

  useEffect(() => () => recognitionRef.current?.stop(), []);

  const toggleRecording = () => {
    if (recording) {
      recognitionRef.current?.stop();
      setRecording(false);
      setStatus("Voice input stopped. Review and edit the transcript before continuing.");
      return;
    }
    if (!Recognition) return;
    const recognition = new Recognition();
    recognition.lang = language;
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcripts: string[] = [];
      for (let index = resultIndexRef.current; index < event.results.length; index += 1) {
        const transcript = event.results[index]?.[0]?.transcript?.trim();
        if (transcript) transcripts.push(transcript);
      }
      resultIndexRef.current = event.results.length;
      const transcript = transcripts.join(" ");
      if (transcript) {
        const next = [transcriptRef.current.trim(), transcript].filter(Boolean).join(" ").slice(0, 2000);
        transcriptRef.current = next;
        onChange(next);
      }
    };
    recognition.onerror = (event) => {
      setRecording(false);
      setStatus(event.error === "not-allowed" ? "Microphone access was denied. You can type your symptoms instead." : "Voice input stopped. You can continue by typing.");
      recognitionRef.current = null;
    };
    recognition.onend = () => {
      setRecording(false);
      recognitionRef.current = null;
    };
    recognitionRef.current = recognition;
    resultIndexRef.current = 0;
    try {
      recognition.start();
      setRecording(true);
      setStatus("Listening. Speak clearly, then stop and review the transcript.");
    } catch {
      setRecording(false);
      setStatus("Could not start voice input. You can continue by typing.");
      recognitionRef.current = null;
    }
  };

  if (!Recognition) {
    if (compact) return null;
    return <p className="rounded-lg border border-border bg-secondary/50 p-3 text-sm text-muted-foreground">Voice input is not available in this browser. You can type your symptoms below.</p>;
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={toggleRecording}
          title={recording ? "Stop voice listening" : "Speak symptoms in English or Hindi"}
          className={`relative flex h-8 w-8 items-center justify-center rounded-xl transition-all ${
            recording
              ? "bg-rose-500 text-white shadow-md shadow-rose-500/30 animate-pulse ring-2 ring-rose-400"
              : "bg-secondary/70 text-muted-foreground hover:text-foreground hover:bg-secondary border border-border"
          }`}
        >
          {recording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          {recording && (
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
            </span>
          )}
        </button>

        <button
          type="button"
          disabled={recording}
          onClick={() => setLanguage((prev) => (prev === "en-IN" ? "hi-IN" : "en-IN"))}
          title={`Voice Language: ${language === "en-IN" ? "English (India)" : "Hindi (India)"} - Click to switch`}
          className="rounded-lg border border-border bg-secondary/50 px-2 py-1 text-[10px] font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          {language === "en-IN" ? "EN" : "HI"}
        </button>

        {recording && (
          <span className="text-xs text-rose-400 font-medium animate-pulse hidden sm:inline">
            Listening in {language === "en-IN" ? "English" : "Hindi"}…
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-md border p-3">
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="voice-language" className="text-sm font-medium">Voice language</label>
        <select id="voice-language" value={language} disabled={recording} onChange={(event) => setLanguage(event.target.value)} className="min-h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <option value="en-IN">English (India)</option>
          <option value="hi-IN">Hindi (India)</option>
        </select>
        <Button type="button" variant={recording ? "destructive" : "outline"} onClick={toggleRecording} aria-pressed={recording}>
          {recording ? <MicOff className="mr-2 h-4 w-4" /> : <Mic className="mr-2 h-4 w-4" />}
          {recording ? "Stop voice input" : "Speak symptoms"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">Voice is optional. Your browser’s speech service may process audio under its own privacy terms. When you request a symptom summary, the text is sent to the EpidemAI server for processing. Review and edit it first. Guidance is currently in English.</p>
      <p className="min-h-5 text-xs text-muted-foreground" role="status" aria-live="polite">{status}</p>
    </div>
  );
}
