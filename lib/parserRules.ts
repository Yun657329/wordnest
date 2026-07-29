// lib/parserRules.ts

/**
 * 所有支援的詞性
 * 後續如果遇到新的詞性，只要在這裡增加即可。
 */
export const PARTS_OF_SPEECH = [
  "n.",
  "v.",
  "vt.",
  "vi.",
  "adj.",
  "adv.",
  "prep.",
  "conj.",
  "pron.",
  "int.",
  "det.",
  "aux.",
  "phr.",

  "vi./vt.",
  "vt./vi.",
  "n./adj.",
  "adj./n.",
  "vt./n.",
  "n./vt.",
  "adj./adv.",
  "adv./adj.",
];

/**
 * 中文意思的分隔符
 */
export const MEANING_SEPARATORS = [
  "；",
  ";",
  "、",
];

/**
 * 常見標題
 */
export const TITLE_PATTERNS = [
  /^Section/i,
  /^Lesson/i,
  /^Unit/i,
  /^Chapter/i,
];

/**
 * 頁碼
 */
export const PAGE_PATTERNS = [
  /^Page/i,
  /^\d+$/,
];

/**
 * 字根、字首、字尾說明
 * 例如：
 * contra- = opposite
 * ad = toward
 * -dict = say
 */
export const ROOT_PATTERN =
  /^[A-Za-z-]+\s*=\s*.+$/;

/**
 * 音標判斷
 */
export const PHONETIC_PATTERN =
  /[ˈˌəɪʊɔæθðŋ]/;

/**
 * 判斷是否像英文單字
 */
export const ENGLISH_WORD_PATTERN =
  /^[A-Za-z][A-Za-z-]*$/;