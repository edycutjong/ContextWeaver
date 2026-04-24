type Translator = (key: string, vars?: Record<string, string | number>) => string;

type Rule = {
  regex: RegExp;
  key: string;
  vars?: (m: RegExpMatchArray) => Record<string, string | number>;
};

const RULES: Rule[] = [
  { regex: /^Pipeline started$/, key: "started" },
  {
    regex: /^Chunking document \(size: (\d+), overlap: (\d+)\)\.\.\.$/,
    key: "chunking",
    vars: (m) => ({ size: m[1], overlap: m[2] }),
  },
  {
    regex: /^Retrieving top (\d+) examples for chunk (\d+)\.\.\.$/,
    key: "retrieving",
    vars: (m) => ({ k: m[1], i: m[2] }),
  },
  {
    regex: /^Building prompt for chunk (\d+)\.\.\.$/,
    key: "buildingPrompt",
    vars: (m) => ({ i: m[1] }),
  },
  {
    regex: /^Annotating chunk (\d+)\.\.\.$/,
    key: "annotating",
    vars: (m) => ({ i: m[1] }),
  },
  { regex: /^Merging chunk annotations\.\.\.$/, key: "merging" },
];

export function translateSseMessage(raw: string, t: Translator): string {
  for (const rule of RULES) {
    const m = raw.match(rule.regex);
    if (m) return t(rule.key, rule.vars ? rule.vars(m) : undefined);
  }
  return raw;
}
