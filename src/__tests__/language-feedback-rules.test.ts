import { describe, expect, it } from "vitest";
import {
  buildLanguageFeedbackPromptContext,
  getLanguageFeedbackRules,
  matchLanguageFeedbackRules,
} from "@/lib/language-feedback-rules";
import { REQUIRED_LANGUAGE_UNITS } from "@/lib/language-critical-units";
import type { LanguageId } from "@/types/language";

describe("language feedback rules", () => {
  it("covers every critical non-English unit with target-language feedback", () => {
    for (const [languageId, requiredUnits] of Object.entries(
      REQUIRED_LANGUAGE_UNITS,
    ) as Array<[LanguageId, readonly string[]]>) {
      const coveredSlugs = new Set(
        getLanguageFeedbackRules(languageId).flatMap((rule) => rule.triggerSlugs),
      );
      const missing = requiredUnits.filter((slug) => !coveredSlugs.has(slug));

      expect(missing, `${languageId} missing feedback rules`).toEqual([]);
    }
  });

  it("defines Spanish guidance for vowels, consonants, allophones, dialect, diphthongs, nasals, and stress", () => {
    const ruleIds = getLanguageFeedbackRules("es-ES").map((rule) => rule.id);

    expect(ruleIds).toEqual(
      expect.arrayContaining([
        "spanish-vowel-diphthongization",
        "spanish-r-tap-trill-confusion",
        "spanish-bv-english-v",
        "spanish-plain-stops-unaspirated",
        "spanish-common-consonant-anchors",
        "spanish-approximant-too-hard",
        "spanish-bdg-stop-position-anchors",
        "spanish-ch-affricate",
        "spanish-y-ll-yeismo",
        "spanish-theta-s-dialect",
        "spanish-x-too-weak",
        "spanish-ny-split",
        "spanish-stress-error",
        "spanish-nasal-place-assimilation",
        "spanish-diphthong-glides",
      ]),
    );
    expect(
      matchLanguageFeedbackRules("es-ES", ["es-theta"])[0]?.rule.guidance,
    ).toMatch(/seseo|Castilian/);

    const plainStops = matchLanguageFeedbackRules("es-ES", ["es-p", "es-t"]);
    expect(plainStops[0]?.rule.guidance).toContain("不强送气");
    expect(plainStops[0]?.rule.guidance).toContain("牙齿");

    const commonConsonants = matchLanguageFeedbackRules("es-ES", ["es-n"]);
    expect(commonConsonants[0]?.rule.guidance).toContain("音系");
    expect(commonConsonants[0]?.rule.practiceCue).toContain("鼻音同化");

    const nasalPlace = matchLanguageFeedbackRules("es-ES", [
      "es-nasal-place",
    ])[0];
    expect(nasalPlace?.matchedSlugs).toEqual(["es-nasal-place"]);
    expect(nasalPlace?.rule.guidance).toContain("后面辅音");
    expect(nasalPlace?.rule.guidance).toContain("上下文实现");
    expect(nasalPlace?.rule.guidance).toContain("不是一个独立单音 speaker");
    expect(nasalPlace?.rule.practiceCue).toContain("en casa");

    const diphthongs = matchLanguageFeedbackRules("es-ES", [
      "es-diphthongs-j",
      "es-diphthongs-w",
    ])[0];
    expect(diphthongs?.matchedSlugs).toEqual([
      "es-diphthongs-j",
      "es-diphthongs-w",
    ]);
    expect(diphthongs?.rule.guidance).toContain("短 glide");
    expect(diphthongs?.rule.guidance).toContain("一个顺滑音节");
    expect(diphthongs?.rule.practiceCue).toContain("puerta");

    const stopAnchors = matchLanguageFeedbackRules("es-ES", [
      "es-b-stop",
      "es-d-stop",
      "es-g-stop",
    ])[0];
    expect(stopAnchors?.matchedSlugs).toEqual([
      "es-b-stop",
      "es-d-stop",
      "es-g-stop",
    ]);
    expect(stopAnchors?.rule.guidance).toContain("分位置训练");
    expect(stopAnchors?.rule.guidance).toContain("[β ð ɣ]");
    expect(stopAnchors?.rule.guidance).toContain("英语 /v/");

    const ch = matchLanguageFeedbackRules("es-ES", ["es-ch"])[0];
    expect(ch?.rule.guidance).toContain("/tʃ/");
    expect(ch?.rule.guidance).toContain("不是 /ʃ/");

    const yLl = matchLanguageFeedbackRules("es-ES", ["es-y-ll"])[0];
    expect(yLl?.rule.guidance).toContain("常见目标是 /ʝ/");
    expect(yLl?.rule.guidance).toContain("/ʎ/");
    expect(yLl?.rule.guidance).toContain("目标方言");
  });

  it("defines French guidance for front rounded vowels, nasal vowels, glides, r, common consonants, and phrase rules", () => {
    const matches = matchLanguageFeedbackRules("fr-FR", [
      "fr-i",
      "fr-y",
      "fr-e-open",
      "fr-o-close",
      "fr-an",
      "fr-r",
      "fr-glide-j",
      "fr-glide-hui",
      "fr-glide-w",
      "fr-p",
      "fr-d",
      "fr-v",
      "fr-l",
      "fr-sh",
      "fr-zh",
      "fr-ny",
      "fr-schwa",
      "fr-final-consonant-silence",
      "fr-liaison",
      "fr-enchainement",
      "fr-elision",
      "fr-phrase-final-prominence",
    ]);
    const ids = matches.map((match) => match.rule.id);

    expect(ids).toEqual(
      expect.arrayContaining([
        "french-front-rounded-vowel-collapse",
        "french-nasal-vowel-with-n-tail",
        "french-oral-vowel-anchors",
        "french-uvular-r-replaced",
        "french-glide-contrast",
        "french-plain-stops-unaspirated",
        "french-common-consonant-anchors",
        "french-sh-zh-ny-anchors",
        "french-final-consonant-silence",
        "french-liaison",
        "french-enchainement",
        "french-elision",
        "french-schwa-e-caduc",
        "french-phrase-final-prominence",
      ]),
    );
    expect(buildLanguageFeedbackPromptContext("fr-FR")).toContain("nasal");
    expect(buildLanguageFeedbackPromptContext("fr-FR")).toContain("节奏组");

    const liaison = matches.find((match) => match.rule.id === "french-liaison");
    const enchainement = matches.find(
      (match) => match.rule.id === "french-enchainement",
    );
    const elision = matches.find((match) => match.rule.id === "french-elision");
    const schwa = matches.find(
      (match) => match.rule.id === "french-schwa-e-caduc",
    );
    const plainStops = matches.find(
      (match) => match.rule.id === "french-plain-stops-unaspirated",
    );
    const commonConsonants = matches.find(
      (match) => match.rule.id === "french-common-consonant-anchors",
    );
    const glides = matches.find(
      (match) => match.rule.id === "french-glide-contrast",
    );
    const oralVowels = matches.find(
      (match) => match.rule.id === "french-oral-vowel-anchors",
    );
    const shZhNy = matches.find(
      (match) => match.rule.id === "french-sh-zh-ny-anchors",
    );

    expect(oralVowels?.matchedSlugs).toEqual([
      "fr-i",
      "fr-e-open",
      "fr-o-close",
    ]);
    expect(oralVowels?.rule.guidance).toContain("/e/ vs /ɛ/");
    expect(oralVowels?.rule.guidance).toContain("/o/ vs /ɔ/");
    expect(oralVowels?.rule.guidance).toContain("不能只靠拼写猜");

    expect(shZhNy?.matchedSlugs).toEqual(["fr-sh", "fr-zh", "fr-ny"]);
    expect(shZhNy?.rule.guidance).toContain("/ʃ ʒ ɲ/");
    expect(shZhNy?.rule.guidance).toContain("不是英语 /tʃ dʒ/");
    expect(shZhNy?.rule.guidance).toContain("不要拆成 /n/ + /j/");

    expect(glides?.matchedSlugs).toEqual([
      "fr-glide-j",
      "fr-glide-hui",
      "fr-glide-w",
    ]);
    expect(glides?.rule.guidance).toContain("/j ɥ w/");
    expect(glides?.rule.guidance).toContain("/ɥ/");
    expect(glides?.rule.guidance).toContain("完整元音");
    expect(glides?.rule.practiceCue).toContain("huit");

    expect(liaison?.matchedSlugs).toEqual(["fr-liaison"]);
    expect(liaison?.rule.guidance).toContain("潜在词尾辅音");
    expect(liaison?.rule.guidance).toContain("合适短语环境");
    expect(liaison?.rule.guidance).not.toContain("已经发出来的词尾辅音");

    expect(enchainement?.matchedSlugs).toEqual(["fr-enchainement"]);
    expect(enchainement?.rule.guidance).toContain("已经发出来的词尾辅音");
    expect(enchainement?.rule.guidance).toContain("不是同一机制");

    expect(elision?.matchedSlugs).toEqual(["fr-elision"]);
    expect(elision?.rule.guidance).toContain("撇号");

    expect(schwa?.matchedSlugs).toEqual(["fr-schwa"]);
    expect(schwa?.rule.guidance).toContain("e caduc");
    expect(schwa?.rule.guidance).toContain("短语环境");

    expect(plainStops?.matchedSlugs).toEqual(["fr-p", "fr-d"]);
    expect(plainStops?.rule.guidance).toContain("少送气");
    expect(plainStops?.rule.guidance).toContain("flap");

    expect(commonConsonants?.matchedSlugs).toEqual(["fr-v", "fr-l"]);
    expect(commonConsonants?.rule.guidance).toContain("dark L");
    expect(commonConsonants?.rule.practiceCue).toContain("fou/vous");
  });

  it("defines Russian guidance for stress, reduction, palatalization, devoicing, assimilation, clusters, and sh/ch/shch", () => {
    const matches = matchLanguageFeedbackRules("ru-RU", [
      "ru-stress-reduction",
      "ru-a",
      "ru-y",
      "ru-p",
      "ru-v",
      "ru-r",
      "ru-x",
      "ru-j",
      "ru-soft-t-d",
      "ru-final-devoicing",
      "ru-voicing-assimilation",
      "ru-clusters",
      "ru-iotated-vowels",
      "ru-sh",
      "ru-zh",
      "ru-shch",
    ]);
    const ids = matches.map((match) => match.rule.id);

    expect(ids).toEqual(
      expect.arrayContaining([
        "russian-missing-stress-or-reduction",
        "russian-stressed-vowel-anchors",
        "russian-i-vs-y-collapse",
        "russian-hard-stop-anchors",
        "russian-hard-continuant-anchors",
        "russian-r-x-j-anchors",
        "russian-palatalization-missing",
        "russian-final-devoicing",
        "russian-voicing-assimilation",
        "russian-cluster-epenthesis",
        "russian-iotated-vowel-context",
        "russian-sh-zh-ch-shch-confusion",
      ]),
    );
    expect(buildLanguageFeedbackPromptContext("ru-RU")).toMatch(
      /重音|soft|clusters/,
    );

    const vowelAnchors = matches.find(
      (match) => match.rule.id === "russian-stressed-vowel-anchors",
    );
    expect(vowelAnchors?.matchedSlugs).toEqual(["ru-a"]);
    expect(vowelAnchors?.rule.guidance).toContain("完整元音锚点");
    expect(vowelAnchors?.rule.guidance).toContain("弱化只发生在非重读环境");

    const hardStops = matches.find(
      (match) => match.rule.id === "russian-hard-stop-anchors",
    );
    expect(hardStops?.matchedSlugs).toEqual(["ru-p"]);
    expect(hardStops?.rule.guidance).toContain("不要自动加 /j/");
    expect(hardStops?.rule.guidance).toContain("词尾清化");

    const hardContinuants = matches.find(
      (match) => match.rule.id === "russian-hard-continuant-anchors",
    );
    expect(hardContinuants?.matchedSlugs).toEqual(["ru-v"]);
    expect(hardContinuants?.rule.guidance).toContain("硬辅音目标");
    expect(hardContinuants?.rule.guidance).toContain("清浊同化");

    const rxj = matches.find(
      (match) => match.rule.id === "russian-r-x-j-anchors",
    );
    expect(rxj?.matchedSlugs).toEqual(["ru-r", "ru-x", "ru-j"]);
    expect(rxj?.rule.guidance).toContain("不是英语卷舌");
    expect(rxj?.rule.guidance).toContain("不是英语 /h/");
    expect(rxj?.rule.guidance).toContain("辅音软化 [ʲ] 不是同一个训练目标");

    const finalDevoicing = matches.find(
      (match) => match.rule.id === "russian-final-devoicing",
    )?.rule;
    expect(finalDevoicing?.guidance).toContain("停顿或清辅音前");
    expect(finalDevoicing?.guidance).toContain("浊辅音、响音或元音前");
    expect(finalDevoicing?.guidance).not.toContain("词尾有声辅音要清化");
    expect(finalDevoicing?.practiceCue).toContain("друг дома");
    expect(finalDevoicing?.practiceCue).toContain("снег идёт");

    const iotated = matches.find(
      (match) => match.rule.id === "russian-iotated-vowel-context",
    )?.rule;
    expect(iotated?.guidance).toContain("词首、元音后或 ь/ъ 后");
    expect(iotated?.guidance).toContain("软化前一辅音");
    expect(iotated?.guidance).toContain("不能机械读成硬辅音 + 完整 /j/");

    const shZhChShch = matches.find(
      (match) => match.rule.id === "russian-sh-zh-ch-shch-confusion",
    );
    expect(shZhChShch?.matchedSlugs).toEqual(["ru-sh", "ru-zh", "ru-shch"]);
    expect(shZhChShch?.rule.guidance).toContain("常硬");
    expect(shZhChShch?.rule.guidance).toContain("常软");
  });

  it("does not inject non-English rules into English feedback", () => {
    expect(matchLanguageFeedbackRules("en-US", ["th"])).toEqual([]);
    expect(buildLanguageFeedbackPromptContext("en-US")).toBe("");
  });
});
