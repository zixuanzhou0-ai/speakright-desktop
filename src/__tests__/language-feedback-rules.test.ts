import { describe, expect, it } from "vitest";
import {
  buildLanguageFeedbackPromptContext,
  getLanguageFeedbackRules,
  matchLanguageFeedbackRules,
} from "@/lib/language-feedback-rules";

describe("language feedback rules", () => {
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
  });

  it("defines French guidance for front rounded vowels, nasal vowels, glides, r, common consonants, and phrase rules", () => {
    const matches = matchLanguageFeedbackRules("fr-FR", [
      "fr-y",
      "fr-an",
      "fr-r",
      "fr-glide-j",
      "fr-glide-hui",
      "fr-glide-w",
      "fr-p",
      "fr-d",
      "fr-v",
      "fr-l",
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
        "french-uvular-r-replaced",
        "french-glide-contrast",
        "french-plain-stops-unaspirated",
        "french-common-consonant-anchors",
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
      "ru-y",
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
        "russian-i-vs-y-collapse",
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
