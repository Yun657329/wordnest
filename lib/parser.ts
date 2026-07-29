import {
  PAGE_PATTERNS,
  TITLE_PATTERNS,
} from "./parserRules";

import type {
  IgnoredItem,
  ParsedItem,
  ParsedWord,
  ParsedWordType,
} from "./parserTypes";

const WORD_AT_START_PATTERN =
  /^(?:\d+[.)、．]?\s*)?([A-Za-z]+(?:[-'][A-Za-z]+)*)\b/;

const PART_OF_SPEECH_PATTERN =
  /\b(?:vi|vt|v|n|adj|adv|prep|conj|pron|aux|art|det|num|interj|pl)\s*\.?(?:\s*[\/,]\s*(?:vi|vt|v|n|adj|adv|prep|conj|pron|aux|art|det|num|interj|pl)\s*\.?)*/i;

const CHINESE_PATTERN = /[\u3400-\u9fff]/;

function cleanLine(line: string): string {
  return line
    .replace(/\r/g, "")
    .replace(/\t+/g, " ")
    .replace(/[　]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizePartOfSpeech(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/。/g, ".")
    .replace(/,+/g, "/")
    .replace(/\/+/g, "/")
    .replace(/\.$/, "")
    .split("/")
    .filter(Boolean)
    .map((part) => `${part.replace(/\./g, "")}.`)
    .join("/");
}

function containsChinese(text: string): boolean {
  return CHINESE_PATTERN.test(text);
}

function isTitle(text: string): boolean {
  return TITLE_PATTERNS.some((pattern) => pattern.test(text));
}

function isPage(text: string): boolean {
  return PAGE_PATTERNS.some((pattern) => pattern.test(text));
}

function isNumberingOnly(text: string): boolean {
  return /^(\d+|[A-Za-z])[.)、．]?$/.test(text);
}

function isLikelyRootExplanation(text: string): boolean {
  return (
    /(?:^|\s)(?:pre|pro|ad|ab|con|com|contra|dict|dic|tion)\s*[:=—-]/i.test(
      text
    ) ||
    /\b(?:before|toward|against|say|speak)\b/i.test(text)
  );
}

function removeLeadingNumbering(text: string): string {
  return text.replace(/^\d+[.)、．]?\s*/, "");
}

function removePhoneticBlocks(text: string): string {
  let result = text;

  // 標準音標格式：[...]
  result = result.replace(/\[[^\]]*\]/g, " ");

  // OCR 常把左括號辨識成 /、| 或 '
  result = result.replace(
    /\s(?:\/|\|)'?[A-Za-z0-9,@:;.!?+\-_'`\\]+\]?\s/g,
    " "
  );

  return cleanLine(result);
}

function extractPartOfSpeech(text: string): {
  partOfSpeech: string;
  before: string;
  after: string;
} | null {
  const match = text.match(PART_OF_SPEECH_PATTERN);

  if (!match || match.index === undefined) {
    return null;
  }

  return {
    partOfSpeech: normalizePartOfSpeech(match[0]),
    before: text.slice(0, match.index).trim(),
    after: text.slice(match.index + match[0].length).trim(),
  };
}

function cleanMeaningText(text: string): string {
  return text
    .replace(/^[\s:：;；,，.。|/\\\-—]+/, "")
    .replace(/[\s|/\\]+$/g, "")
    .replace(/\s*([；;，,、])\s*/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function splitMeanings(text: string): string[] {
  const cleaned = cleanMeaningText(text);

  if (!cleaned) return [];

  return cleaned
    .split(/[；;、，,]+/)
    .map((meaning) => meaning.trim())
    .filter(Boolean);
}

function createIgnoredItem(
  rawText: string,
  reason: IgnoredItem["reason"]
): IgnoredItem {
  return {
    type: "ignore",
    rawText,
    reason,
  };
}

function createParsedWord(
  english: string,
  types: ParsedWordType[],
  rawLines: string[]
): ParsedWord {
  const warnings: string[] = [];

  if (types.length === 0) {
    warnings.push("缺少詞性或中文意思");
  }

  for (const type of types) {
    if (!type.partOfSpeech) {
      warnings.push("缺少詞性");
    }

    if (type.meanings.length === 0) {
      warnings.push("缺少中文意思");
    }

    if (
      type.meanings.some(
        (meaning) => !containsChinese(meaning) && meaning !== "待確認"
      )
    ) {
      warnings.push("中文意思可能辨識錯誤");
    }
  }

  return {
    english,
    types,
    rawText: rawLines.join("\n"),
    warnings: [...new Set(warnings)],
  };
}

function addOrMergeType(
  types: ParsedWordType[],
  partOfSpeech: string,
  meanings: string[]
) {
  const existing = types.find(
    (type) => type.partOfSpeech === partOfSpeech
  );

  if (existing) {
    existing.meanings.push(
      ...meanings.filter(
        (meaning) => !existing.meanings.includes(meaning)
      )
    );
    return;
  }

  types.push({
    partOfSpeech,
    meanings,
  });
}

export function parseOcr(text: string): ParsedItem[] {
  const lines = text
    .split("\n")
    .map(cleanLine)
    .filter(Boolean);

  const results: ParsedItem[] = [];

  let currentEnglish = "";
  let currentTypes: ParsedWordType[] = [];
  let currentPartOfSpeech = "";
  let currentRawLines: string[] = [];

  function flushCurrentWord() {
    if (!currentEnglish) return;

    results.push({
      type: "word",
      word: createParsedWord(
        currentEnglish,
        currentTypes,
        currentRawLines
      ),
    });

    currentEnglish = "";
    currentTypes = [];
    currentPartOfSpeech = "";
    currentRawLines = [];
  }

  function beginWord(english: string, rawLine: string) {
    flushCurrentWord();

    currentEnglish = english.toLowerCase();
    currentTypes = [];
    currentPartOfSpeech = "";
    currentRawLines = [rawLine];
  }

  function addMeaningToCurrent(
    partOfSpeech: string,
    meaningText: string
  ) {
    if (!currentEnglish) return;

    const meanings = splitMeanings(meaningText);

    addOrMergeType(
      currentTypes,
      partOfSpeech || currentPartOfSpeech || "待確認",
      meanings.length > 0 ? meanings : ["待確認"]
    );
  }

  for (const originalLine of lines) {
    const line = cleanLine(originalLine);

    if (isTitle(line)) {
      flushCurrentWord();
      results.push(createIgnoredItem(line, "title"));
      continue;
    }

    if (isPage(line)) {
      results.push(createIgnoredItem(line, "page"));
      continue;
    }

    if (isNumberingOnly(line)) {
      results.push(createIgnoredItem(line, "number"));
      continue;
    }

    if (isLikelyRootExplanation(line)) {
      results.push(createIgnoredItem(line, "root"));
      continue;
    }

    const withoutNumber = removeLeadingNumbering(line);
    const wordMatch = withoutNumber.match(WORD_AT_START_PATTERN);

    if (wordMatch) {
      const english = wordMatch[1];
      const restAfterWord = cleanLine(
        withoutNumber.slice(wordMatch[0].length)
      );
      const restWithoutPhonetic = removePhoneticBlocks(restAfterWord);
      const posInfo = extractPartOfSpeech(restWithoutPhonetic);

      beginWord(english, line);

      if (posInfo) {
        currentPartOfSpeech = posInfo.partOfSpeech;

        const meaningSource = posInfo.after || posInfo.before;
        const meanings = splitMeanings(meaningSource);

        addOrMergeType(
          currentTypes,
          currentPartOfSpeech,
          meanings.length > 0 ? meanings : []
        );
      }

      continue;
    }

    const cleanedWithoutPhonetic = removePhoneticBlocks(line);
    const posInfo = extractPartOfSpeech(cleanedWithoutPhonetic);

    if (posInfo && currentEnglish) {
      currentPartOfSpeech = posInfo.partOfSpeech;
      currentRawLines.push(line);

      const meaningSource = posInfo.after || posInfo.before;
      const meanings = splitMeanings(meaningSource);

      addOrMergeType(
        currentTypes,
        currentPartOfSpeech,
        meanings
      );

      continue;
    }

    if (containsChinese(line) && currentEnglish) {
      currentRawLines.push(line);
      addMeaningToCurrent(currentPartOfSpeech, line);
      continue;
    }

    if (
      currentEnglish &&
      currentTypes.length > 0 &&
      currentTypes[currentTypes.length - 1].meanings.length === 0
    ) {
      const cleaned = cleanMeaningText(line);

      if (cleaned) {
        currentRawLines.push(line);
        currentTypes[currentTypes.length - 1].meanings.push(cleaned);
        continue;
      }
    }

    results.push(createIgnoredItem(line, "unknown"));
  }

  flushCurrentWord();

  return results;
}