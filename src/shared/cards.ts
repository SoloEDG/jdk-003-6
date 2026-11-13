import type { CardSpec, Profession } from "./domain";
export const cards: Record<string, CardSpec> = {
  // ── 中立：任何职业都可放入出战牌组 ─────────────────────────────
  focus: {
    key: "focus",
    name: "余火冥想",
    cost: 0,
    kind: "skill",
    text: "抽 2 张牌，获得 1 能量。",
    rarity: "rare",
    profession: "neutral",
    effects: [
      { type: "draw", amount: 2, target: "hero" },
      { type: "energy", amount: 1, target: "hero" },
    ],
  },

  // ── 守卫：格挡积累「决心」 ───────────────────────────────────
  strike: {
    key: "strike",
    name: "余烬斩",
    cost: 1,
    kind: "attack",
    text: "造成 7 伤害。力量加成。",
    rarity: "common",
    profession: "guardian",
    effects: [{ type: "damage", amount: 7, target: "enemy" }],
  },
  guard: {
    key: "guard",
    name: "铁叶护身",
    cost: 1,
    kind: "skill",
    text: "获得 7 格挡；每张格挡牌同时积累 1 决心。",
    rarity: "common",
    profession: "guardian",
    effects: [{ type: "block", amount: 7, target: "hero" }],
  },
  shelter: {
    key: "shelter",
    name: "林地庇护",
    cost: 1,
    kind: "skill",
    text: "获得 5 格挡，回复 3 生命。",
    rarity: "common",
    profession: "guardian",
    effects: [
      { type: "block", amount: 5, target: "hero" },
      { type: "heal", amount: 3, target: "hero" },
    ],
  },
  bulwark: {
    key: "bulwark",
    name: "决心壁垒",
    cost: 2,
    kind: "skill",
    text: "获得 12 格挡；格挡同样积累决心。",
    rarity: "rare",
    profession: "guardian",
    effects: [{ type: "block", amount: 12, target: "hero" }],
  },
  shield_bash: {
    key: "shield_bash",
    name: "盾击",
    cost: 1,
    kind: "attack",
    text: "造成 5 伤害；消耗全部决心，每点追加 2 伤害。",
    rarity: "common",
    profession: "guardian",
    effects: [
      { type: "damage", amount: 5, target: "enemy" },
      { type: "spendResource", amount: 2, target: "enemy" },
    ],
  },
  last_stand: {
    key: "last_stand",
    name: "最后的守望",
    cost: 2,
    kind: "power",
    text: "获得 8 格挡，本场力量 +2。",
    rarity: "rare",
    profession: "guardian",
    effects: [
      { type: "block", amount: 8, target: "hero" },
      { type: "strength", amount: 2, target: "hero" },
    ],
  },

  // ── 术士：以自伤积累「余火」 ─────────────────────────────────
  fury: {
    key: "fury",
    name: "烈焰誓约",
    cost: 1,
    kind: "power",
    text: "失去 3 生命，本场力量 +3。自伤会积累余火。",
    rarity: "rare",
    profession: "warlock",
    effects: [
      { type: "damage", amount: 3, target: "hero" },
      { type: "strength", amount: 3, target: "hero" },
    ],
  },
  burst: {
    key: "burst",
    name: "陨火",
    cost: 2,
    kind: "attack",
    text: "造成 17 伤害。",
    rarity: "rare",
    profession: "warlock",
    effects: [{ type: "damage", amount: 17, target: "enemy" }],
  },
  w_bolt: {
    key: "w_bolt",
    name: "灼血箭",
    cost: 1,
    kind: "attack",
    text: "造成 8 伤害，失去 2 生命。",
    rarity: "common",
    profession: "warlock",
    effects: [
      { type: "damage", amount: 8, target: "enemy" },
      { type: "damage", amount: 2, target: "hero" },
    ],
  },
  w_rite: {
    key: "w_rite",
    name: "献祭",
    cost: 0,
    kind: "skill",
    text: "失去 4 生命; 每失去 2 生命积累 1 余火。",
    rarity: "common",
    profession: "warlock",
    effects: [{ type: "damage", amount: 4, target: "hero" }],
  },
  w_hex: {
    key: "w_hex",
    name: "腐焰",
    cost: 1,
    kind: "attack",
    text: "造成 4 伤害，施加 4 中毒。",
    rarity: "common",
    profession: "warlock",
    effects: [
      { type: "damage", amount: 4, target: "enemy" },
      { type: "poison", amount: 4, target: "enemy" },
    ],
  },
  w_immolate: {
    key: "w_immolate",
    name: "灰烬爆发",
    cost: 2,
    kind: "attack",
    text: "造成 10 伤害; 消耗全部余火，每点余火追加 2 伤害。",
    rarity: "rare",
    profession: "warlock",
    effects: [
      { type: "damage", amount: 10, target: "enemy" },
      { type: "spendResource", amount: 2, target: "enemy" },
    ],
  },
  w_cinder: {
    key: "w_cinder",
    name: "余烬缠身",
    cost: 1,
    kind: "power",
    text: "失去 2 生命，本场力量 +2。",
    rarity: "common",
    profession: "warlock",
    effects: [
      { type: "damage", amount: 2, target: "hero" },
      { type: "strength", amount: 2, target: "hero" },
    ],
  },

  // ── 游侠：命中积累「标记」 ───────────────────────────────────
  venom: {
    key: "venom",
    name: "孢子飞刃",
    cost: 1,
    kind: "attack",
    text: "造成 4 伤害，施加 4 中毒。",
    rarity: "common",
    profession: "ranger",
    effects: [
      { type: "damage", amount: 4, target: "enemy" },
      { type: "poison", amount: 4, target: "enemy" },
    ],
  },
  r_shot: {
    key: "r_shot",
    name: "精准射击",
    cost: 1,
    kind: "attack",
    text: "造成 6 伤害。攻击命中积累 1 标记。",
    rarity: "common",
    profession: "ranger",
    effects: [{ type: "damage", amount: 6, target: "enemy" }],
  },
  r_mark: {
    key: "r_mark",
    name: "猎物标记",
    cost: 0,
    kind: "skill",
    text: "获得 2 标记。",
    rarity: "common",
    profession: "ranger",
    effects: [{ type: "mark", amount: 2, target: "hero" }],
  },
  r_volley: {
    key: "r_volley",
    name: "连射",
    cost: 1,
    kind: "attack",
    text: "造成 4 伤害两次。每次命中积累标记。",
    rarity: "common",
    profession: "ranger",
    effects: [
      { type: "damage", amount: 4, target: "enemy" },
      { type: "damage", amount: 4, target: "enemy" },
    ],
  },
  r_trap: {
    key: "r_trap",
    name: "荆棘陷阱",
    cost: 1,
    kind: "skill",
    text: "获得 4 格挡，施加 3 中毒。",
    rarity: "common",
    profession: "ranger",
    effects: [
      { type: "block", amount: 4, target: "hero" },
      { type: "poison", amount: 3, target: "enemy" },
    ],
  },
  r_dash: {
    key: "r_dash",
    name: "疾行",
    cost: 0,
    kind: "skill",
    text: "抽 2 张牌。",
    rarity: "common",
    profession: "ranger",
    effects: [{ type: "draw", amount: 2, target: "hero" }],
  },
  r_precision: {
    key: "r_precision",
    name: "鹰眼",
    cost: 1,
    kind: "power",
    text: "本场力量 +2，并额外获得 3 标记。",
    rarity: "rare",
    profession: "ranger",
    effects: [
      { type: "strength", amount: 2, target: "hero" },
      { type: "mark", amount: 3, target: "hero" },
    ],
  },
  r_finish: {
    key: "r_finish",
    name: "终结之箭",
    cost: 2,
    kind: "attack",
    text: "造成 8 伤害；消耗全部标记，每点追加 2 伤害。",
    rarity: "rare",
    profession: "ranger",
    effects: [
      { type: "damage", amount: 8, target: "enemy" },
      { type: "spendResource", amount: 2, target: "enemy" },
    ],
  },
};
export function cardLabel(key: string) {
  return cards[key]?.name ?? key;
}
export function cardProfession(key: string): Profession | "neutral" {
  return cards[key]?.profession ?? "neutral";
}
export function cardUsableBy(profession: Profession, key: string) {
  const tag = cardProfession(key);
  return tag === "neutral" || tag === profession;
}
export function cardsForProfession(profession: Profession, keys?: string[]) {
  const source = keys ?? Object.keys(cards);
  return source.filter((key) => cardUsableBy(profession, key) && cards[key]);
}
