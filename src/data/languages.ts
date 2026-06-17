import type { Language, LanguageCode } from "@/types/learning";

/**
 * Languages the app offers. To add a new language:
 *   1. Add its code to `LanguageCode` in types/learning.ts
 *   2. Add an entry here
 *   3. Add units in data/units.ts and lessons in data/lessons.ts
 */
export const languages: Language[] = [
  {
    code: "es",
    name: "Spanish",
    nativeName: "Español",
    flag: "https://flagcdn.com/w320/es.png",
    description: "Spoken across Spain and Latin America.",
    learners: "28.4M",
    available: true,
  },
  {
    code: "fr",
    name: "French",
    nativeName: "Français",
    flag: "https://flagcdn.com/w320/fr.png",
    description: "The language of France, Canada, and beyond.",
    learners: "19.4M",
    available: true,
  },
  // {
  //   code: "ja",
  //   name: "Japanese",
  //   nativeName: "日本語",
  //   flag: "https://flagcdn.com/w320/jp.png",
  //   description: "The language of Japan and its rich culture.",
  //   learners: "12.7M",
  //   available: true,
  // },
  // {
  //   code: "ko",
  //   name: "Korean",
  //   nativeName: "한국어",
  //   flag: "https://flagcdn.com/w320/kr.png",
  //   description: "Spoken in South and North Korea.",
  //   learners: "9.3M",
  //   available: true,
  // },
  {
    code: "de",
    name: "German",
    nativeName: "Deutsch",
    flag: "https://flagcdn.com/w320/de.png",
    description: "Widely spoken in Germany, Austria, and Switzerland.",
    learners: "8.1M",
    available: true,
  },
  // {
  //   code: "zh",
  //   name: "Chinese",
  //   nativeName: "中文",
  //   flag: "https://flagcdn.com/w320/cn.png",
  //   description: "Mandarin Chinese, spoken by over a billion people.",
  //   learners: "7.4M",
  //   available: true,
  // },
];

/** Find a language by its code. Returns undefined if not supported. */
export function getLanguage(code: LanguageCode): Language | undefined {
  return languages.find((language) => language.code === code);
}

/** Languages that have content ready to learn. */
export function getAvailableLanguages(): Language[] {
  return languages.filter((language) => language.available);
}
