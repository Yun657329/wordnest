export async function generateSentences(
  word: string,
  meanings: string[]
) {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      word,
      meanings,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error || `AI 產生失敗（${response.status}）`
    );
  }

  return data.result;
}