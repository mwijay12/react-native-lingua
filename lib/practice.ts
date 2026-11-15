// Be forgiving of case, accents, punctuation and extra spaces in typed answers.
export function normalizeAnswer(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['‘’`]/g, "")
    .replace(/[-–—]/g, " ")
    .replace(/[.,!?;:¿¡]/g, "")
    .trim()
    .replace(/\s+/g, " ");
}

export function isCorrectAnswer(answer: string, expected: string): boolean {
  const normalizedAnswer = normalizeAnswer(answer);
  return normalizedAnswer.length > 0 && normalizedAnswer === normalizeAnswer(expected);
}
