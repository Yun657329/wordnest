export interface ParsedWordType {
  partOfSpeech: string;
  meanings: string[];
}

export interface ParsedWord {
  english: string;
  types: ParsedWordType[];
  rawText: string;

  confidence?: number;
  warnings?: string[];
}

export interface IgnoredItem {
  type: "ignore";
  rawText: string;

  reason:
    | "title"
    | "page"
    | "phonetic"
    | "root"
    | "number"
    | "unknown";
}

export type ParsedItem =
  | {
      type: "word";
      word: ParsedWord;
    }
  | IgnoredItem;