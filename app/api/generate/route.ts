import { NextResponse } from "next/server";

interface GeneratedSentence {
  english: string;
  chinese: string;
  cloze: string;
  explanation: string;
}

interface Sentence extends GeneratedSentence {
  id: string;
  usedCount: number;
  correctCount: number;
  wrongCount: number;
  createdAt: number;
}

export async function POST(request: Request) {
  try {
    const { word, meanings } = await request.json();

    if (
      typeof word !== "string" ||
      !Array.isArray(meanings)
    ) {
      return NextResponse.json(
        { error: "單字資料格式不正確" },
        { status: 400 }
      );
    }

    const prompt = `
你是一位臺灣高中英文老師。

請針對以下英文單字產生恰好 2 組高中程度例句。

英文單字：
${word}

中文意思：
${meanings.join("、")}

========================
【重要規則】
========================

1. 所有中文都必須使用臺灣繁體中文。

2. 禁止任何簡體字。

3. 禁止中國大陸用語。

4. 英文例句必須自然、符合高中或學測程度。

5. 每一句都必須真正使用英文單字「${word}」。

6. 兩句情境必須不同。

例如：
學校、生活、新聞、科技、商業、醫療、旅遊……

不要只是把同一句改幾個字。

7. 不要一直使用：
student
teacher
scientist
people

請盡量讓主詞自然且多元。

8. explanation 必須全部使用臺灣繁體中文。

不得出現任何英文。

不得出現任何簡體字。

========================
每一組必須包含
========================

english

完整英文例句。

chinese

臺灣繁體中文翻譯。

cloze

與 english 相同，
但把 ${word}
改成 ______。

explanation

請固定使用下面格式：

意思：
（中文）

用法：
（中文）

為什麼這句使用 ${word}：
（中文）

三個部分全部都要使用臺灣繁體中文。

========================

只能輸出 JSON。

不得輸出 Markdown。

不得輸出任何說明。

如果 explanation 不是臺灣繁體中文，

請重新產生整份答案。

`;

    const response = await fetch(
      "http://127.0.0.1:11434/api/generate",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gemma3:4b",
          prompt,
          stream: false,
          format: {
            type: "array",
            minItems: 2,
            maxItems: 2,
            items: {
              type: "object",
              properties: {
                english: {
                  type: "string",
                },
                chinese: {
                  type: "string",
                },
                cloze: {
                  type: "string",
                },
                explanation: {
                  type: "string",
                },
              },
              required: [
                "english",
                "chinese",
                "cloze",
                "explanation",
              ],
            },
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText =
        await response.text();

      console.error(
        "Ollama 錯誤：",
        errorText
      );

      return NextResponse.json(
        { error: "Ollama 產生題庫失敗" },
        { status: 500 }
      );
    }

    const data = await response.json();

    let generatedSentences: GeneratedSentence[];

    try {
      generatedSentences = JSON.parse(
        data.response
      );
    } catch {
      console.error(
        "AI 回傳內容不是合法 JSON：",
        data.response
      );

      return NextResponse.json(
        { error: "AI 回傳格式不正確" },
        { status: 500 }
      );
    }

    if (
      !Array.isArray(generatedSentences) ||
      generatedSentences.length === 0
    ) {
      return NextResponse.json(
        { error: "AI 沒有產生有效例句" },
        { status: 500 }
      );
    }

    const createdAt = Date.now();

    const sentences: Sentence[] =
      generatedSentences.map(
        (sentence, index) => ({
          id: crypto.randomUUID(),

          english:
            sentence.english?.trim() ?? "",

          chinese:
            sentence.chinese?.trim() ?? "",

          cloze:
            sentence.cloze?.trim() ?? "",

          explanation:
            sentence.explanation?.trim() ??
            "",

          usedCount: 0,
          correctCount: 0,
          wrongCount: 0,

          createdAt: createdAt + index,
        })
      );

    const validSentences =
      sentences.filter(
        (sentence) =>
          sentence.english &&
          sentence.chinese &&
          sentence.cloze &&
          sentence.explanation
      );

    if (validSentences.length === 0) {
      return NextResponse.json(
        { error: "AI 產生的例句內容不完整" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      result: JSON.stringify(
        validSentences
      ),
    });
  } catch (error) {
    console.error("API 錯誤：", error);

    return NextResponse.json(
      { error: "Server Error" },
      { status: 500 }
    );
  }
}