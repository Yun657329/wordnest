"use client";

import { useEffect, useState } from "react";
import AIExplanation from "@/components/AIExplanation";

interface Sentence {
  id?: string;

  english: string;
  chinese: string;
  cloze: string;
  explanation: string;

  usedCount?: number;
  correctCount?: number;
  wrongCount?: number;

  createdAt?: number;
}

interface WordType {
  partOfSpeech: string;
  meanings: string[];
}

interface Word {
  id: string;
  english: string;
  types: WordType[];
  favorite: boolean;
  wrongCount: number;
  correctCount: number;

  aiSentences: Sentence[];

  isGenerating?: boolean;
}

interface Book {
  id: string;
  name: string;
  words: Word[];
}


export default function PracticePage() {
    const [books, setBooks] = useState<Book[]>([]);
const [selectedBookIds, setSelectedBookIds] = useState<string[]>([]);
const [started, setStarted] = useState(false);
type QuestionType = "en-zh" | "zh-en" | "cloze";

const [selectedQuestionTypes, setSelectedQuestionTypes] =
  useState<QuestionType[]>(["en-zh"]);

const [currentQuestionType, setCurrentQuestionType] =
  useState<QuestionType>("en-zh");

  const [words, setWords] = useState<Word[]>([]);
  

  const [currentWord, setCurrentWord] =
    useState<Word | null>(null);

const [currentSentence, setCurrentSentence] =
  useState<Sentence | null>(null);


  const [options, setOptions] =
    useState<string[]>([]);

const [result, setResult] =
  useState("");

const [showExplanation, setShowExplanation] = useState(false);
const [lastAnswerCorrect, setLastAnswerCorrect] = useState(false);

const QUESTION_COUNT = 20;

const [score, setScore] =
  useState(0);
const [questionCount, setQuestionCount] =
  useState(0);
const [finished, setFinished] =
  useState(false);
const [inputAnswer, setInputAnswer] =
  useState("");

type PracticeMode =
  | "all"
  | "favorite"
  | "wrong";

const [practiceMode, setPracticeMode] =
  useState<PracticeMode>("all");

  useEffect(() => {
  const savedBooks =
    localStorage.getItem(
      "wordnest-books"
    );

  if (!savedBooks) return;

  const loadedBooks: Book[] =
    JSON.parse(savedBooks);

  setBooks(loadedBooks);
}, []);

function updateWordCount(
  wordId: string,
  correct: boolean
) {

  const savedBooks =
    localStorage.getItem(
      "wordnest-books"
    );

  if (!savedBooks) return;


  const books: Book[] =
    JSON.parse(savedBooks);


  const updatedBooks =
    books.map((book) => ({
      ...book,
      words: book.words.map((word) => {

        if (word.id !== wordId)
          return word;


        return {
          ...word,
          correctCount:
            (word.correctCount ?? 0) +
            (correct ? 1 : 0),

          wrongCount:
            (word.wrongCount ?? 0) +
            (correct ? 0 : 1),
        };

      }),
    }));


  localStorage.setItem(
    "wordnest-books",
    JSON.stringify(updatedBooks)
  );
  const updatedWords = updatedBooks
  .filter((book) =>
    selectedBookIds.includes(book.id)
  )
  .flatMap((book) => book.words);

setWords(updatedWords);

}
function updateSentenceCount(
  wordId: string,
  sentenceId: string,
  correct?: boolean
) {
  const savedBooks =
    localStorage.getItem("wordnest-books");

  if (!savedBooks) return;

  const books: Book[] = JSON.parse(savedBooks);

  const updatedBooks = books.map((book) => ({
    ...book,
    words: book.words.map((word) => {
      if (word.id !== wordId) return word;

      return {
        ...word,
        aiSentences: word.aiSentences.map((sentence) => {
          if (sentence.id !== sentenceId) {
            return sentence;
          }

          return {
            ...sentence,

            usedCount:
              (sentence.usedCount ?? 0) + 1,

            correctCount:
              (sentence.correctCount ?? 0) +
              (correct === true ? 1 : 0),

            wrongCount:
              (sentence.wrongCount ?? 0) +
              (correct === false ? 1 : 0),
          };
        }),
      };
    }),
  }));

  localStorage.setItem(
    "wordnest-books",
    JSON.stringify(updatedBooks)
  );
  const updatedWords = updatedBooks
  .filter((book) =>
    selectedBookIds.includes(book.id)
  )
  .flatMap((book) => book.words);

setWords(updatedWords);
}
function toggleBook(bookId: string) {
  setSelectedBookIds((current) =>
    current.includes(bookId)
      ? current.filter((id) => id !== bookId)
      : [...current, bookId]
  );
}
function toggleQuestionType(type: QuestionType) {
  setSelectedQuestionTypes((current) =>
    current.includes(type)
      ? current.filter((item) => item !== type)
      : [...current, type]
  );
}
function startPractice() {
  if (selectedQuestionTypes.length === 0) {
    alert("請至少選擇一種題型。");
    return;
  }

  let selectedWords = books
    .filter((book) =>
      selectedBookIds.includes(book.id)
    )
    .flatMap((book) => book.words);

  if (practiceMode === "favorite") {
    selectedWords = selectedWords.filter((w)=>w.favorite);
    if (selectedWords.length===0){
      alert("目前沒有收藏單字。");
      return;
    }
  }

  if (practiceMode === "wrong") {
    selectedWords = selectedWords.filter((w)=>(w.wrongCount??0)>0);
    if (selectedWords.length===0){
      alert("目前沒有錯題單字。");
      return;
    }
  }

  if (selectedWords.length < 4) {
    alert("請選擇至少包含 4 個單字。");
    return;
  }

  setWords(selectedWords);
  setStarted(true);
  setScore(0);
  setQuestionCount(0);
  setFinished(false);
  setResult("");
  setInputAnswer("");
  setShowExplanation(false);

  createQuestion(selectedWords);
}

function completeCurrentQuestion() {
  setQuestionCount((current) =>
    Math.min(current + 1, QUESTION_COUNT)
  );
}

function goToNextQuestion() {
  if (questionCount >= QUESTION_COUNT) {
    setShowExplanation(false);
    setFinished(true);
    return;
  }

  setShowExplanation(false);
  setResult("");
  setInputAnswer("");
  createQuestion(words);
}

function restartPractice() {
  if (words.length === 0) return;

  setScore(0);
  setQuestionCount(0);
  setFinished(false);
  setResult("");
  setInputAnswer("");
  setShowExplanation(false);

  createQuestion(words);
}

function checkAnswer(answer: string) {
  if (!currentWord) return;

  const correct =
    currentQuestionType === "cloze"
      ? currentWord.english
      : currentWord.types[0].meanings[0];

  const isCorrect = answer === correct;

  setLastAnswerCorrect(isCorrect);
  completeCurrentQuestion();
  if (
  currentQuestionType === "cloze" &&
  currentSentence?.id
) {
  updateSentenceCount(
    currentWord.id,
    currentSentence.id,
    isCorrect
  );
}

  if (isCorrect) {
    setResult("✅ 答對了");

    setScore((current) => current + 1);

    updateWordCount(currentWord.id, true);
  } else {
    setResult(`❌ 答錯，答案是：${correct}`);

    updateWordCount(currentWord.id, false);
  }

  // AI 題目進入詳解
  if (currentQuestionType === "cloze") {
    setShowExplanation(true);
  }
}

function checkSpellingAnswer() {
  if (!currentWord) return;

  const correct =
    currentWord.english
      .trim()
      .toLowerCase();

  const answer =
    inputAnswer
      .trim()
      .toLowerCase();

  completeCurrentQuestion();

  if (answer === correct) {
    setResult("✅ 答對了");

    setScore((currentScore) =>
      currentScore + 1
    );

    updateWordCount(
      currentWord.id,
      true
    );
  } else {
    setResult(
      `❌ 答錯，答案是：${currentWord.english}`
    );

    updateWordCount(
      currentWord.id,
      false
    );
  }
}
function createQuestion(
  wordList: Word[],
  fixedWord?: Word
) {
  if (
    wordList.length === 0 ||
    selectedQuestionTypes.length === 0
  ) {
    return;
  }

  // 按「再出一題同單字」時，固定使用 AI 克漏字
  const randomQuestionType: QuestionType =
    fixedWord
      ? "cloze"
      : selectedQuestionTypes[
          Math.floor(
            Math.random() *
              selectedQuestionTypes.length
          )
        ];

  setCurrentQuestionType(
    randomQuestionType
  );

  // AI 克漏字只從已有完整 AI 題庫的單字抽題
  const availableWords =
    randomQuestionType === "cloze"
      ? wordList.filter(
          (word) =>
            Array.isArray(
              word.aiSentences
            ) &&
            word.aiSentences.some(
              (sentence) =>
                sentence.english?.trim() &&
                sentence.chinese?.trim() &&
                sentence.cloze?.trim()
            )
        )
      : wordList;

  if (availableWords.length === 0) {
    alert(
      "目前選擇的單字都還沒有 AI 題庫"
    );

    setCurrentWord(null);
    setCurrentSentence(null);
    setOptions([]);
    return;
  }

  // 有指定單字時固定使用它，否則隨機抽單字
  const randomWord =
    fixedWord ??
    availableWords[
      Math.floor(
        Math.random() *
          availableWords.length
      )
    ];

  const correct =
    randomQuestionType === "cloze"
      ? randomWord.english
      : randomWord.types[0]
          .meanings[0];

  // 錯誤選項仍從完整的已選單字範圍取得
  const wrongAnswers = wordList
    .filter(
      (word) =>
        word.id !== randomWord.id
    )
    .sort(
      () => Math.random() - 0.5
    )
    .slice(0, 3)
    .map((word) =>
      randomQuestionType === "cloze"
        ? word.english
        : word.types[0]
            .meanings[0]
    );

  const allOptions = [
    correct,
    ...wrongAnswers,
  ].sort(
    () => Math.random() - 0.5
  );

  setCurrentWord(randomWord);

  if (
    randomQuestionType === "cloze"
  ) {
    const validSentences =
      randomWord.aiSentences.filter(
        (sentence) =>
          sentence.english?.trim() &&
          sentence.chinese?.trim() &&
          sentence.cloze?.trim()
      );
    const unusedCount =
  validSentences.filter(
    (sentence) =>
      (sentence.usedCount ?? 0) === 0
  ).length;

if (unusedCount <= 1) {
  expandSentenceBank(randomWord);
}

    // 優先排除剛剛使用過的例句
    const unusedSentences =
      validSentences.filter(
        (sentence) =>
          sentence.english !==
          currentSentence?.english
      );

    const sentencePool =
      unusedSentences.length > 0
        ? unusedSentences
        : validSentences;

    const sentence = [...sentencePool]
  .sort((a, b) => {
    const scoreA =
      (a.usedCount === 0 ? 100 : 0) +
      (a.wrongCount ?? 0) * 3 -
      (a.usedCount ?? 0);

    const scoreB =
      (b.usedCount === 0 ? 100 : 0) +
      (b.wrongCount ?? 0) * 3 -
      (b.usedCount ?? 0);

    return scoreB - scoreA;
  })[0];

    setCurrentSentence(sentence);
  } else {
    setCurrentSentence(null);
  }

  setOptions(allOptions);
}
async function expandSentenceBank(
  word: Word
) {
  // 下一步實作
}
function retryCurrentWord() {
  if (!currentWord) return;

  setShowExplanation(false);
  setResult("");
  setInputAnswer("");

  createQuestion(
    words,
    currentWord
  );
}
 function formatClozeSentence(
  sentence: Sentence,
  answer: string
) {
  const escapedAnswer = answer.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );

  let text =
    sentence.cloze?.trim() ||
    sentence.english?.trim() ||
    "";

  // 將 **observe** 這種格式改成空格
  text = text.replace(
    new RegExp(
      `\\*\\*\\s*${escapedAnswer}\\s*\\*\\*`,
      "gi"
    ),
    "______"
  );

  // 若 AI 沒有製作空格，直接將答案換成空格
  if (!text.includes("______")) {
    text = text.replace(
      new RegExp(`\\b${escapedAnswer}\\b`, "i"),
      "______"
    );
  }

  // 清除殘留的 Markdown 星號
  return text.replace(/\*\*/g, "");
}
function backToPracticeSetup() {
  setStarted(false);
  setFinished(false);
  setQuestionCount(0);
  setScore(0);
  setResult("");
  setShowExplanation(false);
  setCurrentWord(null);
  setCurrentSentence(null);
  setOptions([]);
}


  return (

    <main className="min-h-screen bg-slate-100 p-6">

      <div className="mx-auto max-w-md rounded-3xl bg-white p-8 shadow-xl">

{started && (
  <button
    onClick={backToPracticeSetup}
    className="mb-6 text-lg font-medium"
  >
    ← 返回題型選擇
  </button>
)}
        <h1 className="text-3xl font-bold mb-8">
          🎯 開始練習
        </h1>
{!started && (
  <div>
    <div className="mb-6">
      <p className="mb-2 font-semibold">
        題型（可複選）
      </p>

      <label className="mb-2 flex items-center gap-2">
        <input
          type="checkbox"
          checked={selectedQuestionTypes.includes(
            "en-zh"
          )}
          onChange={() =>
            toggleQuestionType("en-zh")
          }
        />
        英文 → 中文（四選一）
      </label>

      <label className="mb-2 flex items-center gap-2">
        <input
          type="checkbox"
          checked={selectedQuestionTypes.includes(
            "zh-en"
          )}
          onChange={() =>
            toggleQuestionType("zh-en")
          }
        />
        中文 → 英文（拼字）
      </label>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={selectedQuestionTypes.includes(
            "cloze"
          )}
          onChange={() =>
            toggleQuestionType("cloze")
          }
        />
        AI 句子填空（四選一）
      </label>
    </div>

    
    <div className="mb-6">
      <p className="mb-2 font-semibold">練習模式</p>

      <label className="mb-2 flex items-center gap-2">
        <input type="radio" checked={practiceMode==="all"} onChange={()=>setPracticeMode("all")} />
        全部單字
      </label>

      <label className="mb-2 flex items-center gap-2">
        <input type="radio" checked={practiceMode==="favorite"} onChange={()=>setPracticeMode("favorite")} />
        收藏單字
      </label>

      <label className="flex items-center gap-2">
        <input type="radio" checked={practiceMode==="wrong"} onChange={()=>setPracticeMode("wrong")} />
        錯題單字
      </label>
    </div>

<p className="mb-4 text-gray-500">
      請選擇要練習的教材
    </p>

    {books.length === 0 ? (
      <p className="text-gray-500">
        目前還沒有教材
      </p>
    ) : (
       
      <div className="space-y-3">
        {books.map((book) => (
          <label
            key={book.id}
            className="flex cursor-pointer items-center justify-between rounded-xl border p-4"
          >
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={selectedBookIds.includes(
                  book.id
                )}
                onChange={() =>
                  toggleBook(book.id)
                }
              />

              <span className="font-medium">
                {book.name}
              </span>
            </div>

            <span className="text-sm text-gray-500">
              {book.words.length} 個單字
            </span>
          </label>
        ))}
      </div>

)}

    <button
      onClick={startPractice}
      disabled={selectedBookIds.length === 0}
      className="mt-6 w-full rounded-xl bg-blue-600 py-3 text-white disabled:bg-gray-300"
    >
      ▶ 開始練習
    </button>

    <button
      onClick={() => {
        window.location.href = "/";
      }}
      className="mt-3 w-full rounded-xl border py-3"
    >
      ← 回首頁
    </button>
  </div>
)}

        {started && finished && (
          <div className="text-center">
            <div className="mb-6 text-6xl">
              🎉
            </div>

            <h2 className="text-3xl font-bold">
              練習完成
            </h2>

            <p className="mt-2 text-slate-500">
              本次共完成 {QUESTION_COUNT} 題
            </p>

            <div className="mt-8 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-emerald-50 p-5">
                <p className="text-sm text-emerald-700">
                  答對
                </p>
                <p className="mt-1 text-3xl font-bold text-emerald-700">
                  {score}
                </p>
              </div>

              <div className="rounded-2xl bg-red-50 p-5">
                <p className="text-sm text-red-600">
                  答錯
                </p>
                <p className="mt-1 text-3xl font-bold text-red-600">
                  {QUESTION_COUNT - score}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-blue-50 p-6">
              <p className="text-sm text-blue-700">
                正確率
              </p>
              <p className="mt-1 text-4xl font-bold text-blue-700">
                {Math.round((score / QUESTION_COUNT) * 100)}%
              </p>
            </div>

            <button
              onClick={restartPractice}
              className="mt-8 w-full rounded-xl bg-blue-600 py-3 font-medium text-white"
            >
              🔁 再練一次
            </button>

            <button
              onClick={() => {
                window.location.href = "/";
              }}
              className="mt-3 w-full rounded-xl border py-3"
            >
              ← 回首頁
            </button>
          </div>
        )}

        {started && !finished && currentWord && !showExplanation && (

          <>
            <p className="mb-5 text-center text-sm font-medium text-slate-500">
              第 {Math.min(questionCount + 1, QUESTION_COUNT)} / {QUESTION_COUNT} 題
            </p>

            <h2 className="mb-8 text-center text-3xl font-bold">
  {currentQuestionType === "en-zh"
    ? currentWord.english
    : currentQuestionType === "zh-en"
      ? currentWord.types[0].meanings[0]
      : currentSentence
  ? formatClozeSentence(
      currentSentence,
      currentWord.english
    )
  : "此單字尚未建立 AI 題庫"}
</h2>
{currentQuestionType === "cloze"&& (
  <p className="mb-6 text-center text-sm text-green-600">
    AI 題庫
  </p>
)}

            {currentQuestionType !== "zh-en"? (
  <div className="space-y-3">
    {options.map((option, index) => (
      <button
        key={index}
        onClick={() => checkAnswer(option)}
        className="w-full rounded-xl border py-3"
      >
        {option}
      </button>
    ))}
  </div>
) : (
  <div className="space-y-4">
    <input
      type="text"
      value={inputAnswer}
      onChange={(e) =>
        setInputAnswer(e.target.value)
      }
      placeholder="請輸入英文"
      className="w-full rounded-xl border p-3"
    />

    <button
  onClick={checkSpellingAnswer}
  className="w-full rounded-xl bg-blue-600 py-3 text-white"
>
  送出
</button>
  </div>
)}

{result && (
  <p className="mt-6 text-center font-semibold">
    {result}
  </p>
)}

{result && (
  <button
    onClick={goToNextQuestion}
    className="mt-4 w-full rounded-xl bg-blue-600 py-3 text-white"
  >
    {questionCount >= QUESTION_COUNT
      ? "查看結果"
      : "下一題"}
  </button>
  
)}


          </>

        )}
{started &&
  !finished &&
  currentWord &&
  showExplanation &&
  currentQuestionType === "cloze" && (
    <AIExplanation
  sentence={currentSentence}
  word={currentWord}
  correct={lastAnswerCorrect}
  onRetry={retryCurrentWord}
  onNext={goToNextQuestion}
/>
)}

      </div>

    </main>

  );

}