import { reactive, readonly } from "vue";
import type {
  Actor,
  BattleResult,
  CardInstance,
  JourneyContext,
  Profession,
} from "@/shared/domain";
import { cards, cardUsableBy } from "@/shared/cards";
import { baseHp, professions } from "@/shared/professions";
import { uid } from "@/shared/random";
import { spawnEnemy, enemyIntent, type Enemy } from "../lib/enemies";
import { makePiles, drawCards, discardHand, type Piles } from "../lib/piles";
import {
  resolveEffect,
  poisonTick,
  damage,
  type EffectEvent,
  type BattleResource,
} from "../lib/effects";

interface BattleState {
  id: string;
  context: JourneyContext | null;
  profession: Profession;
  hero: Actor;
  enemy: Enemy | null;
  piles: Piles;
  /** 本场独有职业资源（决心 / 余火 / 标记）。 */
  resource: BattleResource;
  energy: number;
  turn: number;
  phase: "idle" | "playing" | "won" | "lost";
  queue: EffectEvent[];
  log: string[];
  result: BattleResult | null;
}

const emptyHero = (maxHp = 72): Actor => ({
  hp: maxHp,
  maxHp,
  block: 0,
  strength: 0,
  poison: 0,
  thorns: 0,
});
const state = reactive<BattleState>({
  id: "",
  context: null,
  profession: "guardian",
  hero: emptyHero(78),
  enemy: null,
  piles: makePiles([], ""),
  resource: { value: 0 },
  energy: 3,
  turn: 1,
  phase: "idle",
  queue: [],
  log: [],
  result: null,
});
export const battleState = readonly(state);

export function beginBattle(
  context: JourneyContext,
  deck: CardInstance[],
  hp: number,
  maxHp: number,
  profession: Profession = context.profession,
) {
  state.id = uid("battle");
  state.context = context;
  state.profession = profession;
  state.hero = {
    ...emptyHero(maxHp || baseHp(profession)),
    hp,
    maxHp: maxHp || baseHp(profession),
  };
  state.enemy = spawnEnemy(context);
  // 出战牌组重新核定：跨职业卡（含收藏中误入的旧牌）不得进入本场战斗。
  const legal = deck.filter((c) => cardUsableBy(profession, c.key));
  state.piles = makePiles(legal, context.nodeId);
  state.resource = { value: 0 };
  state.energy = 3;
  state.turn = 1;
  state.phase = "playing";
  state.queue = [];
  state.result = null;
  state.log = [
    `战斗开始 · ${professions[profession].name}。${professions[profession].resource}从 0 开始，不继承上一场。`,
  ];
  drawCards(state.piles, 5, 1);
}
function finish() {
  if (!state.enemy || !state.context) return;
  if (state.hero.hp <= 0 || state.enemy.hp <= 0) {
    state.phase = state.hero.hp <= 0 ? "lost" : "won";
    state.result = {
      id: state.id,
      nodeId: state.context.nodeId,
      won: state.phase === "won",
      hp: state.hero.hp,
      gold: state.enemy.reward,
      context: JSON.parse(JSON.stringify(state.context)),
    };
    state.queue = [];
  }
}
function drain() {
  while (state.queue.length && state.phase === "playing") {
    const event = state.queue.shift()!;
    if (event.effect.type === "draw") {
      drawCards(state.piles, event.effect.amount, state.turn);
      state.log.unshift(`抽取 ${event.effect.amount} 张牌`);
    } else if (event.effect.type === "energy") {
      state.energy += event.effect.amount;
    } else if (state.enemy)
      state.log.unshift(
        resolveEffect(
          event,
          state.hero,
          state.enemy,
          state.profession,
          state.resource,
        ),
      );
    finish();
  }
  state.log = state.log.slice(0, 18);
}
export function playCard(id: string) {
  if (state.phase !== "playing") return false;
  const card = state.piles.hand.find((c) => c.id === id);
  if (!card) return false;
  const spec = cards[card.key]!;
  if (!cardUsableBy(state.profession, card.key)) {
    state.log.unshift(`跨职业卡 ${spec.name} 不能在本职业出战。`);
    return false;
  }
  if (state.energy < spec.cost) return false;
  state.energy -= spec.cost;
  state.piles.hand = state.piles.hand.filter((c) => c.id !== id);
  (spec.kind === "power" ? state.piles.exhaust : state.piles.discard).push(
    card,
  );
  state.queue.push(
    ...spec.effects.map((e) => ({
      effect: {
        ...e,
        amount:
          e.amount +
          (card.upgraded &&
          e.type !== "energy" &&
          e.type !== "spendResource"
            ? 2
            : 0),
      },
      source: "hero" as const,
      label: spec.name,
    })),
  );
  drain();
  return true;
}
export function endTurn() {
  if (state.phase !== "playing" || !state.enemy) return;
  const poison = poisonTick(state.enemy);
  if (poison) state.log.unshift(`敌人中毒失去 ${poison} 生命`);
  finish();
  if (state.phase !== "playing") return;
  const amount = enemyIntent(state.enemy, state.turn);
  damage(state.hero, amount);
  state.log.unshift(`敌人攻击 ${amount}`);
  poisonTick(state.hero);
  finish();
  if (state.phase !== "playing") return;
  discardHand(state.piles);
  state.turn++;
  state.energy = 3;
  state.hero.block = 0;
  state.enemy.block = state.turn % 3 === 0 ? 5 : 0;
  drawCards(state.piles, 5, state.turn);
}
export function currentIntent() {
  return state.enemy ? enemyIntent(state.enemy, state.turn) : 0;
}
export function exportBattle() {
  return JSON.parse(JSON.stringify(state)) as BattleState;
}
export function restoreBattle(d: BattleState) {
  Object.assign(state, d);
  // 旧存档若缺少本场资源字段，恢复为空的职业资源，绝不沿用旧值。
  if (!state.resource || typeof state.resource.value !== "number")
    state.resource = { value: 0 };
}
export function resetBattle() {
  state.phase = "idle";
  state.context = null;
  state.enemy = null;
  state.result = null;
  state.piles = makePiles([], "");
  state.resource = { value: 0 };
  state.log = [];
}
