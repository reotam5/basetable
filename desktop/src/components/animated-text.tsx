import { useEffect, useMemo, useState } from "react";

export function AnimatedText({ text }: { text: string }) {
  const [, setVisibleWords] = useState<number>(0);
  const [currentText, setCurrentText] = useState<string>("");
  const words = useMemo(() => text?.split(" ") || [], [text]);

  useEffect(() => {
    // Reset animation when text changes
    setVisibleWords(0);
    setCurrentText("");

    if (!text || words.length === 0) return;

    // Animate words appearing one by one
    const interval = setInterval(() => {
      setVisibleWords((prev) => {
        const next = prev + 1;
        if (next <= words.length) {
          setCurrentText(words.slice(0, next).join(" "));
          return next;
        } else {
          clearInterval(interval);
          return prev;
        }
      });
    }, 150); // 150ms delay between words

    return () => clearInterval(interval);
  }, [text, words]);

  return <>{currentText}</>
}