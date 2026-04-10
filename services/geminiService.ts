import { GoogleGenAI } from "@google/genai";
import { CatMode, Language } from "../types";

let ai: GoogleGenAI | null = null;
if (process.env.API_KEY) {
  ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
}

// Fallback messages when API is unavailable or rate-limited
const FALLBACKS: Record<Language, Record<string, string[]>> = {
  en: {
    idle: ["Meow.", "Nap time...", "Boring.", "Prrr...", "Hungry.", "Zzz..."],
    run: ["Can't catch me!", "Too slow!", "Missed!", "Zoom!", "Haha!", "Nope!"],
    manic: ["HISSS!", "GRRR!", "NO BATH!", "WRATH!", "ANGER!", "SCRATCH!"],
    caught: ["UNHAND ME!", "NOOO!", "HELP!", "LET GO!", "MEOOOOW!", "DOOMED!"],
    angry: ["HISSS!", "GRRR!", "NO BATH!", "WRATH!", "ANGER!", "SCRATCH!"],
    happy: ["Purrr...", "So cozy~", "Nice!", "Yay!", "Love you!", "Prrr~"]
  },
  zh: {
    idle: ["喵。", "想睡觉...", "无聊。", "呼噜...", "饿了。", "Zzz..."],
    run: ["抓不到我！", "太慢了！", "打不着！", "嗖！", "哈哈！", "才不要！"],
    manic: ["哈气！", "吼！", "不洗澡！", "愤怒！", "生气！", "挠你！"],
    caught: ["放手！", "不！！！", "救命！", "放开我！", "喵嗷嗷！", "完蛋了！"],
    angry: ["哈气！", "吼！", "不洗澡！", "愤怒！", "生气！", "挠你！"],
    happy: ["呼噜~", "好舒服~", "真好！", "耶！", "爱你！", "呼噜呼噜~"]
  },
  ja: {
    idle: ["ニャー", "眠い...", "暇だ", "ゴロゴロ", "お腹空いた", "Zzz..."],
    run: ["捕まらないよ！", "遅い！", "残念！", "ピューン！", "あはは！", "イヤだ！"],
    manic: ["シャー！", "ガルル！", "お風呂イヤ！", "怒！", "激おこ！", "引っ掻くぞ！"],
    caught: ["離して！", "イヤーー！", "助けて！", "放せ！", "ニャーー！", "終わった..."],
    angry: ["シャー！", "ガルル！", "お風呂イヤ！", "怒！", "激おこ！", "引っ掻くぞ！"],
    happy: ["ゴロゴロ~", "気持ちいい~", "いいね！", "やった！", "好き！", "ゴロゴロ~"]
  },
  fr: {
    idle: ["Miaou.", "Dodo...", "Ennui.", "Prrr...", "Faim.", "Zzz..."],
    run: ["Raté !", "Trop lent !", "Zou !", "Haha !", "Jamais !"],
    manic: ["HISSS !", "GRRR !", "PAS DE BAIN !", "COLÈRE !", "LÂCHE-MOI !"],
    caught: ["AU SECOURS !", "NON !", "AIDEZ-MOI !", "LÂCHE !", "MIAOU !"],
    angry: ["HISSS !", "GRRR !", "PAS DE BAIN !", "COLÈRE !", "LÂCHE-MOI !"],
    happy: ["Prrr~", "Bien~", "Super !", "Yes !", "T'aime !", "Prrr~"]
  },
  de: {
    idle: ["Miau.", "Schlafen...", "Langweilig.", "Prrr...", "Hunger.", "Zzz..."],
    run: ["Zu langsam!", "Haha!", "Vorbei!", "Nein!", "Fang mich doch!"],
    manic: ["FAUCH!", "GRRR!", "KEIN BAD!", "WUT!", "KRATZ!"],
    caught: ["LASS LOS!", "NEIN!", "HILFE!", "MIAUUUU!", "VERDAMMT!"],
    angry: ["FAUCH!", "GRRR!", "KEIN BAD!", "WUT!", "KRATZ!"],
    happy: ["Prrr~", "Fein~", "Super!", "Juhu!", "Liebe!", "Prrr~"]
  },
  ru: {
    idle: ["Мяу.", "Спать...", "Скучно.", "Мурр...", "Еда.", "Zzz..."],
    run: ["Не поймаешь!", "Медленно!", "Мимо!", "Хаха!", "Нет!"],
    manic: ["ШШШ!", "РРР!", "НЕТ ВАННОЙ!", "ЗЛОСТЬ!", "ЦАРАП!"],
    caught: ["ОТПУСТИ!", "НЕТ!", "ПОМОГИТЕ!", "ПУСТИ!", "МЯУУУ!"],
    angry: ["ШШШ!", "РРР!", "НЕТ ВАННОЙ!", "ЗЛОСТЬ!", "ЦАРАП!"],
    happy: ["Мурр~", "Класс~", "Ура!", "Да!", "Люблю!", "Мурр~"]
  }
};

let lastCallTime = 0;
const MIN_INTERVAL = 4000; // Minimum 4 seconds between API calls locally
let errorBackoff = 0; // Additional wait time if we hit errors

const getRandomFallback = (mode: CatMode, lang: Language): string => {
  const list = FALLBACKS[lang][mode] || FALLBACKS[lang]['idle'];
  return list[Math.floor(Math.random() * list.length)];
};

export const generateCatThought = async (mode: CatMode, hp: number, lang: Language): Promise<string> => {
  // If no key, return fallback immediately
  if (!ai) return getRandomFallback(mode, lang);

  const now = Date.now();
  
  // Check if we are calling too fast or currently backing off from an error
  if (now - lastCallTime < MIN_INTERVAL + errorBackoff) {
    return getRandomFallback(mode, lang);
  }

  try {
    lastCallTime = now;
    
    let langName = 'English';
    if (lang === 'zh') langName = 'Chinese';
    else if (lang === 'ja') langName = 'Japanese';
    else if (lang === 'fr') langName = 'French';
    else if (lang === 'de') langName = 'German';
    else if (lang === 'ru') langName = 'Russian';

    const prompt = `
      You are a hand-drawn cat in a game called 'Hellycat'. 
      Current state: ${mode}. 
      Player HP: ${hp}/3. 
      The player is trying to grab you with their hand to give you a bath.
      
      Generate a very short, funny, sassy thought bubble text (max 5 words) in ${langName}.
      If Manic: be angry/hissing.
      If Idle: be smug/bored/cute.
      If Caught: be panicked/drama queen.
      If Run: be mocking/fast.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        maxOutputTokens: 20,
        temperature: 1.1,
      }
    });

    const text = response.text?.trim();
    if (text) {
      // Reset backoff on success
      errorBackoff = 0;
      return text;
    }
    return getRandomFallback(mode, lang);

  } catch (error: any) {
    // Quietly handle errors and use fallbacks
    console.warn("Gemini API unavailable, using fallback.");
    
    // Check for rate limit error codes (429)
    if (error.status === 429 || error.code === 429 || (error.message && error.message.includes('429'))) {
       // Exponential backoff: add 10s, max 60s
       errorBackoff = Math.min(errorBackoff + 10000, 60000); 
    }
    
    return getRandomFallback(mode, lang);
  }
};