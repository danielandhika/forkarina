"use client";
import { useEffect, useState, useRef } from "react";
import { lines } from "./data";

const QUESTION = "Please Type Your Name:";
const CORRECT_ANSWER = "Karina"; 

function Home() {
  const scrollRef = useRef<HTMLDivElement>(null);

  // ========== Parameter Animasi ==========
  const typingSpeed = 50;
  const cursorBlinkSpeed = 500;
  const finalPauseBeforeFading = 1500;
  const fadeInterval = 10;
  const fadeDuration = 2000;

  const [currentLine, setCurrentLine] = useState(0);
  const [typedIndex, setTypedIndex] = useState(0);
  const [linesDisplay, setLinesDisplay] = useState<string[]>([]);
  const [phase, setPhase] = useState<"typing" | "waiting" | "fading" | "done">("typing");

  const [fadeOutIndex, setFadeOutIndex] = useState(0);
  const [removedChars, setRemovedChars] = useState<string[]>([]);
  const [showCursor, setShowCursor] = useState(true);

  // KITA HAPUS useEffect yang nanya status 'read' ke Redis
  // Biar phase selalu mulai dari "typing" setiap dibuka.

  // Cursor blink
  useEffect(() => {
    const cursorTimer = setInterval(() => setShowCursor((prev) => !prev), cursorBlinkSpeed);
    return () => clearInterval(cursorTimer);
  }, [cursorBlinkSpeed]);

  // Auto-scroll
  useEffect(() => {
    if (phase !== "done" && phase !== "fading" && scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [linesDisplay, typedIndex, phase]);

  // Typing logic
  useEffect(() => {
    if (phase === "typing") {
      if (currentLine < lines.length) {
        const currentLineText = lines[currentLine].text;
        if (typedIndex < currentLineText.length) {
          const timer = setTimeout(() => setTypedIndex((prev) => prev + 1), typingSpeed);
          return () => clearTimeout(timer);
        } else {
          setLinesDisplay((prev) => [...prev, currentLineText]);
          const timer = setTimeout(() => {
            setCurrentLine((prev) => prev + 1);
            setTypedIndex(0);
          }, lines[currentLine].pause);
          return () => clearTimeout(timer);
        }
      } else {
        setPhase("waiting");
      }
    }
  }, [phase, currentLine, typedIndex]);

  // Waiting to Fading
  useEffect(() => {
    if (phase === "waiting") {
      const timer = setTimeout(() => setPhase("fading"), finalPauseBeforeFading);
      return () => clearTimeout(timer);
    }
  }, [phase, finalPauseBeforeFading]);

  const getCurrentLinePartial = () => {
    if (phase === "typing" && currentLine < lines.length) {
      const text = lines[currentLine].text;
      if (typedIndex < text.length) return text.slice(0, typedIndex) + (showCursor ? "_" : "");
    }
    return phase === "typing" || phase === "waiting" ? (showCursor ? "_" : "") : "";
  };

  const combinedTextArray = [...linesDisplay.map((line) => line + "\n"), getCurrentLinePartial()].join("").split("");

  // Fading logic
  useEffect(() => {
    if (phase === "fading") {
      if (fadeOutIndex < combinedTextArray.length) {
        const timer = setTimeout(() => setFadeOutIndex((prev) => prev + 1), fadeInterval);
        return () => clearTimeout(timer);
      } else {
        // Kita nggak perlu panggil markAsRead() lagi di sini
        setPhase("done");
      }
    }
  }, [phase, fadeOutIndex, combinedTextArray.length, fadeInterval]);

  // Remove chars during fade
  useEffect(() => {
    if (phase === "fading" && fadeOutIndex > 0) {
      const indexToFade = fadeOutIndex - 1;
      const timer = setTimeout(() => setRemovedChars((prev) => [...prev, String(indexToFade)]), fadeDuration);
      return () => clearTimeout(timer);
    }
  }, [phase, fadeOutIndex, fadeDuration]);

  return (
    <div className="min-h-screen bg-black p-8 flex flex-col items-center justify-center">
      {phase !== "done" && (
        <div
          ref={scrollRef}
          className="text-white text-xl leading-8 whitespace-pre-wrap overflow-y-auto max-h-[80vh] w-full max-w-2xl px-4 border border-gray-600 rounded-md"
          style={{ padding: "16px", height: "80vh" }}
        >
          {combinedTextArray.map((char, i) => {
            if (char === "\n") return <br key={i} />;
            if (removedChars.includes(String(i))) return null;
            const isCharFading = i < fadeOutIndex;
            return (
              <span key={i} className="inline-block transition-opacity" style={{ transitionDuration: `${fadeDuration}ms`, opacity: isCharFading ? 0 : 1 }}>
                {char}
              </span>
            );
          })}
        </div>
      )}

      {phase === "done" && (
        <div className="text-white text-2xl text-center animate-in fade-in duration-1000">
          Best wishes to you
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [userInput, setUserInput] = useState("");
  const [sentNotif, setSentNotif] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => setUserInput(e.target.value);
  const isAuthenticated = userInput.toLowerCase() === CORRECT_ANSWER.toLowerCase();

  // PEMICU NOTIFIKASI TELEGRAM: Begitu login berhasil, langsung tembak API
  useEffect(() => {
    if (isAuthenticated && !sentNotif) {
      fetch("/api/flag", { method: "POST" })
        .then(() => setSentNotif(true))
        .catch(() => console.error("Gagal kirim notif login"));
    }
  }, [isAuthenticated, sentNotif]);

  if (isAuthenticated) return <Home />;

  return (
    <div className="flex min-h-screen items-center justify-center bg-black text-white p-4">
      <div className="p-8 rounded-xl shadow-2xl w-full max-w-md border border-gray-800 bg-[#1a1b23]">
        <h1 className="text-xl font-medium mb-6 text-center text-gray-300">{QUESTION}</h1>
        <input autoFocus type="text" className="w-full p-3 bg-gray-900 text-white border border-gray-700 rounded-lg" placeholder="Jawab di sini..." value={userInput} onChange={handleInputChange} />
      </div>
    </div>
  );
}