import type { CodeEditorLanguage } from "@/components/request/CodeEditor";

export type QuicktypeLanguage = {
  label: string;
  target: string;
  ext: string;
  cmLang: CodeEditorLanguage;
};

export const LANGUAGES: QuicktypeLanguage[] = [
  {
    label: "TypeScript",
    target: "typescript",
    ext: "ts",
    cmLang: "javascript",
  },
  {
    label: "JavaScript",
    target: "javascript",
    ext: "js",
    cmLang: "javascript",
  },
  { label: "Python", target: "python", ext: "py", cmLang: "python" },
  { label: "Go", target: "golang", ext: "go", cmLang: "go" },
  { label: "Ruby", target: "ruby", ext: "rb", cmLang: "ruby" },
  { label: "C#", target: "csharp", ext: "cs", cmLang: "csharp" },
  { label: "Java", target: "java", ext: "java", cmLang: "java" },
  { label: "Swift", target: "swift", ext: "swift", cmLang: "text" },
  { label: "C++", target: "cplusplus", ext: "cpp", cmLang: "text" },
  { label: "Rust", target: "rust", ext: "rs", cmLang: "text" },
  { label: "Kotlin", target: "kotlin", ext: "kt", cmLang: "text" },
  { label: "PHP", target: "php", ext: "php", cmLang: "php" },
  { label: "Dart", target: "dart", ext: "dart", cmLang: "text" },
  { label: "Haskell", target: "haskell", ext: "hs", cmLang: "text" },
  { label: "Crystal", target: "crystal", ext: "cr", cmLang: "text" },
  { label: "Elm", target: "elm", ext: "elm", cmLang: "text" },
  { label: "Flow", target: "flow", ext: "js", cmLang: "javascript" },
  { label: "Objective-C", target: "objc", ext: "m", cmLang: "text" },
  { label: "Pike", target: "pike", ext: "pike", cmLang: "text" },
  { label: "Scala3", target: "scala3", ext: "scala", cmLang: "text" },
];

export const DEFAULT_LANGUAGE = "TypeScript";
