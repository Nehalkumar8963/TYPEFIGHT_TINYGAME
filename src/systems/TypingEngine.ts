import type { TypingResult } from '../types';

export class TypingEngine {
  private word = '';
  private currentIndex = 0;
  private mistakes = 0;
  private totalKeystrokes = 0;
  private startTime = 0;
  private active = false;
  private charStates: ('pending' | 'correct' | 'incorrect')[] = [];

  setWord(word: string) {
    this.word = word;
    this.currentIndex = 0;
    this.mistakes = 0;
    this.totalKeystrokes = 0;
    this.charStates = word.split('').map(() => 'pending');
    this.startTime = performance.now();
    this.active = true;
  }

  get currentWord(): string { return this.word; }
  get index(): number { return this.currentIndex; }
  get isActive(): boolean { return this.active; }
  get chars(): readonly string[] { return this.word.split(''); }
  get states(): readonly ('pending' | 'correct' | 'incorrect')[] { return this.charStates; }

  handleKey(key: string): { correct: boolean; done: boolean } {
    if (!this.active || key.length !== 1) {
      return { correct: false, done: false };
    }

    this.totalKeystrokes++;
    const expected = this.word[this.currentIndex];

    if (key === expected) {
      this.charStates[this.currentIndex] = 'correct';
      this.currentIndex++;

      if (this.currentIndex >= this.word.length) {
        this.active = false;
        return { correct: true, done: true };
      }
      return { correct: true, done: false };
    } else {
      this.charStates[this.currentIndex] = 'incorrect';
      this.mistakes++;
      return { correct: false, done: false };
    }
  }

  getResult(): TypingResult {
    const timeMs = performance.now() - this.startTime;
    const minutes = timeMs / 60000;
    const wordCount = this.word.length / 5;
    const wpm = minutes > 0 ? Math.round(wordCount / minutes) : 0;
    const accuracy = this.totalKeystrokes > 0
      ? Math.round(((this.totalKeystrokes - this.mistakes) / this.totalKeystrokes) * 100)
      : 100;

    const baseScore = Math.max(0, wpm * (accuracy / 100));
    const timeBonus = Math.max(0, (1 - timeMs / 5000)) * 50;
    const score = Math.round(baseScore + timeBonus - this.mistakes * 5);

    const isCritical = wpm > 80 && accuracy >= 95;
    const isSpecial = false;

    return {
      wpm, accuracy, score: Math.max(0, score), timeMs,
      mistakes: this.mistakes,
      correctChars: this.currentIndex,
      totalChars: this.word.length,
      isCritical, isSpecial,
    };
  }

  deactivate() {
    this.active = false;
  }
}
