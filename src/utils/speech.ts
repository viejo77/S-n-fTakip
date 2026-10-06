/**
 * Text-to-speech utility for reading student names in Turkish
 */

export const isSpeechSupported = (): boolean => {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
};

export const speakTurkish = (text: string, onEnd?: () => void): void => {
  if (!isSpeechSupported()) {
    if (onEnd) onEnd();
    return;
  }

  try {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'tr-TR';
    utterance.rate = 0.95; // Clear and deliberate speed for classroom
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    // Look for Turkish voice (e.g. Google Türkçe, Turkish, tr-TR, Yelda, etc.)
    const trVoice = voices.find(
      (v) =>
        v.lang === 'tr-TR' ||
        v.lang.toLowerCase().startsWith('tr') ||
        v.name.toLowerCase().includes('turkish') ||
        v.name.toLowerCase().includes('türkçe')
    );

    if (trVoice) {
      utterance.voice = trVoice;
    }

    if (onEnd) {
      utterance.onend = () => onEnd();
      utterance.onerror = () => onEnd();
    }

    window.speechSynthesis.speak(utterance);
  } catch (error) {
    console.warn('Speech synthesis error:', error);
    if (onEnd) onEnd();
  }
};

export const stopSpeech = (): void => {
  if (isSpeechSupported()) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {
      // ignore
    }
  }
};
