import { reactive, readonly } from "vue";
import type { CardInstance, ExpeditionSummary, Profession } from "@/shared/domain";
import { cardUsableBy } from "@/shared/cards";
import { baseHp, professions, starterDeck } from "@/shared/professions";
import { starter, createCard, canRemove } from "../lib/collection";
import { upgradeCost, removalCost, campHealing } from "../lib/costs";

/**
 * cards      —— 永久收藏（跨职业卡会留在这里，切换职业后仍可见）
 * activeDeck —— 当前出战牌组；只允许职业可用卡（本职业 + 中立）
 *
 * 职业战斗资源由 battle 模型持有：只属于当前这一场战斗，
 * 每次进入新战斗清零，保存恢复时随本场快照保留。
 */
const state = reactive({
  profession: "guardian" as Profession,
  cards: [] as CardInstance[],
  activeDeck: [] as CardInstance[],
  hero: { hp: 78, maxHp: 78, gold: 80, scars: 0 } as ExpeditionSummary,
  removals: 0,
  campUsed: false,
  selected: "",
  /** 职业切换预览：只读取显示，不消耗资源、不开放试炼。 */
  switchPreview: null as Profession | null,
});

function buildInitial(profession: Profession) {
  const deck = starter(profession);
  const hp = baseHp(profession);
  return {
    profession,
    cards: deck.map((c) => ({ ...c })),
    activeDeck: deck.map((c) => ({ ...c })),
    hero: {
      hp,
      maxHp: hp,
      gold: professions[profession].startingGold,
      scars: 0,
    },
    removals: 0,
    campUsed: false,
    selected: "",
    switchPreview: null as Profession | null,
  };
}

function seedInitial() {
  const init = buildInitial("guardian");
  state.profession = init.profession;
  state.cards = init.cards;
  state.activeDeck = init.activeDeck;
  state.hero = init.hero;
  state.removals = init.removals;
  state.campUsed = init.campUsed;
  state.selected = init.selected;
  state.switchPreview = init.switchPreview;
}
seedInitial();

export const deckState = readonly(state);

export function activeDeckCards(): CardInstance[] {
  return state.activeDeck.map((c) => ({ ...c }));
}

/** 兼容旧调用：战斗只读取出战牌组。 */
export function deckCards(): CardInstance[] {
  return activeDeckCards();
}

export function canAddToActiveDeck(key: string, profession = state.profession) {
  return cardUsableBy(profession, key);
}

/** 收藏跨职业卡：允许收藏，但不自动进入出战牌组。 */
export function addCard(key: string) {
  const card = createCard(key);
  state.cards.push(card);
  if (canAddToActiveDeck(key)) state.activeDeck.push({ ...card });
  return card;
}

export function addToActiveDeck(id: string) {
  const card = state.cards.find((c) => c.id === id);
  if (!card || !canAddToActiveDeck(card.key)) return false;
  if (state.activeDeck.some((c) => c.id === id)) return false;
  state.activeDeck.push({ ...card });
  return true;
}

export function removeFromActiveDeck(id: string) {
  if (state.activeDeck.length <= 5) return false;
  const index = state.activeDeck.findIndex((c) => c.id === id);
  if (index < 0) return false;
  state.activeDeck.splice(index, 1);
  return true;
}

export function spendGold(amount: number) {
  if (!Number.isFinite(amount) || amount < 0 || amount > state.hero.gold)
    return false;
  state.hero.gold -= amount;
  return true;
}

export function earnGold(amount: number) {
  state.hero.gold += Math.max(0, amount);
}

export function setHp(hp: number) {
  state.hero.hp = Math.min(state.hero.maxHp, Math.max(0, hp));
}

export function heal(amount: number) {
  setHp(state.hero.hp + amount);
}

export function selectCard(id: string) {
  state.selected = id;
}

export function upgradeCard(id: string, free = false) {
  if (!state.cards.some((c) => c.id === id && !c.upgraded)) return false;
  if (!free && !spendGold(upgradeCost(false, state.hero.scars))) return false;
  const collection = state.cards.find((c) => c.id === id)!;
  collection.upgraded = true;
  const inDeck = state.activeDeck.find((c) => c.id === id);
  if (inDeck) inDeck.upgraded = true;
  return true;
}

export function removeCard(id: string) {
  const inDeck = state.activeDeck.some((c) => c.id === id);
  // 移出出战牌组的牌也要保留五张下限；收藏中的跨职业卡可直接移除。
  if (
    !canRemove(inDeck ? state.activeDeck.length : Infinity) ||
    !state.cards.some((c) => c.id === id) ||
    !spendGold(removalCost(state.removals))
  )
    return false;
  state.cards = state.cards.filter((c) => c.id !== id);
  state.activeDeck = state.activeDeck.filter((c) => c.id !== id);
  state.removals++;
  state.selected = "";
  return true;
}

export function openCamp() {
  state.campUsed = false;
}

export function useCamp(action: "rest" | "upgrade", heat: number) {
  if (state.campUsed) return false;
  if (action === "rest") heal(campHealing(state.hero.maxHp, heat));
  else if (!upgradeCard(state.selected, true)) return false;
  state.campUsed = true;
  state.switchPreview = null;
  return true;
}

export function previewSwitch(profession: Profession | null) {
  state.switchPreview = profession;
}

/**
 * 重新核定出战牌组：只保留新职业可用卡；不足五张时从收藏优先补足，
 * 仍不足则该职业基础牌同时进入收藏与出战。
 */
function revalidateActiveDeck(profession: Profession) {
  state.activeDeck = state.activeDeck
    .filter((c) => canAddToActiveDeck(c.key, profession))
    .map((c) => ({ ...c }));
  let missing = 5 - state.activeDeck.length;
  if (missing <= 0) return;
  const extras = state.cards.filter(
    (c) =>
      canAddToActiveDeck(c.key, profession) &&
      !state.activeDeck.some((d) => d.id === c.id),
  );
  for (const card of extras.slice(0, missing)) {
    state.activeDeck.push({ ...card });
    missing--;
  }
  if (missing <= 0) return;
  const basics = starterDeck(profession).filter((key) =>
    canAddToActiveDeck(key, profession),
  );
  let i = 0;
  while (missing > 0 && basics.length) {
    const card = createCard(basics[i % basics.length]!);
    state.cards.push(card);
    state.activeDeck.push({ ...card });
    missing--;
    i++;
  }
}

/**
 * 仅允许在誓约篝火提交职业切换。
 * 重新核定出战牌组：只保留新职业可用（本职业 + 中立）的牌。
 * 永久收藏保留全部卡牌。
 */
export function commitSwitch(profession: Profession, atSwitchCamp: boolean) {
  if (!atSwitchCamp || profession === state.profession) return false;
  state.profession = profession;
  state.switchPreview = null;
  // 生命上限随职业重新核定；当前生命不因切换被放大。
  const nextMax = baseHp(profession);
  state.hero.maxHp = nextMax;
  state.hero.hp = Math.min(state.hero.hp, nextMax);
  revalidateActiveDeck(profession);
  // 新职业的战斗资源从零开始，旧职业资源不随切换带入。
  state.selected = "";
  state.campUsed = true;
  return true;
}

export interface DeckSnapshot {
  profession: Profession;
  cards: CardInstance[];
  activeDeck: CardInstance[];
  hero: ExpeditionSummary;
  removals: number;
  campUsed: boolean;
}

export function exportDeck(): DeckSnapshot {
  return JSON.parse(
    JSON.stringify({
      profession: state.profession,
      cards: state.cards,
      activeDeck: state.activeDeck,
      hero: state.hero,
      removals: state.removals,
      campUsed: state.campUsed,
    }),
  );
}

export function restoreDeck(d: DeckSnapshot) {
  state.profession = d.profession;
  state.cards = d.cards;
  // 恢复后重新核定：出战牌组只接受当前职业可用卡，防止旧存档带入跨职业牌。
  state.activeDeck = d.activeDeck;
  revalidateActiveDeck(d.profession);
  state.hero = d.hero;
  state.removals = d.removals;
  state.campUsed = d.campUsed;
  state.selected = "";
  state.switchPreview = null;
}

export function resetDeck(profession: Profession = "guardian") {
  const init = buildInitial(profession);
  state.profession = init.profession;
  state.cards = init.cards;
  state.activeDeck = init.activeDeck;
  state.hero = init.hero;
  state.removals = init.removals;
  state.campUsed = init.campUsed;
  state.selected = init.selected;
  state.switchPreview = init.switchPreview;
}
