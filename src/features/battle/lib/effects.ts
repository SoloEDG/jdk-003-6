import type { Actor, Effect, Profession } from "@/shared/domain";

export interface EffectEvent {
  effect: Effect;
  source: "hero" | "enemy";
  label: string;
}

/** 本场战斗独有资源；战斗开始时清零，随战斗快照保存。 */
export interface BattleResource {
  value: number;
}

export function damage(target: Actor, amount: number) {
  const blocked = Math.min(target.block, amount);
  target.block -= blocked;
  target.hp = Math.max(0, target.hp - (amount - blocked));
  return amount - blocked;
}

/**
 * 职业资源在同一处结算，保证战斗内行为与 UI 文案一致：
 * - 守卫：每次获得格挡，决心 +1
 * - 术士：卡牌造成的每 2 点自伤，余火 +1
 * - 游侠：每次攻击命中，标记 +1
 */
export function resolveEffect(
  event: EffectEvent,
  hero: Actor,
  enemy: Actor,
  profession: Profession,
  resource: BattleResource,
): string {
  const { effect: e, source, label } = event;
  const target = e.target === "hero" ? hero : enemy;
  const origin = source === "hero" ? hero : enemy;
  if (e.type === "damage") {
    // 力量只加成「英雄打敌人」的攻击；术士的自伤不吃自己的力量。
    const selfInflicted = source === "hero" && e.target === "hero";
    const amount = e.amount + (selfInflicted ? 0 : origin.strength);
    const lost = damage(target, amount);
    // 自伤不触发自身荆棘，避免同一个 actor 反伤自己。
    if (target.thorns > 0 && origin.hp > 0 && !selfInflicted)
      damage(origin, target.thorns);
    const extra: string[] = [];
    if (
      source === "hero" &&
      profession === "warlock" &&
      e.target === "hero" &&
      lost > 0
    ) {
      const gain = Math.floor(lost / 2);
      if (gain > 0) {
        resource.value += gain;
        extra.push(`余火 +${gain}`);
      }
    }
    if (source === "hero" && profession === "ranger" && e.target === "enemy") {
      resource.value += 1;
      extra.push("标记 +1");
    }
    return `${label} → ${lost} 生命伤害${target.thorns ? "，荆棘反伤 " + target.thorns : ""}${
      extra.length ? "，" + extra.join("，") : ""
    }`;
  }
  if (e.type === "block") {
    target.block += e.amount;
    if (profession === "guardian" && target === hero) {
      resource.value += 1;
      return `${label} → 格挡 ${e.amount}，决心 +1`;
    }
  }
  if (e.type === "poison") target.poison += e.amount;
  if (e.type === "strength") target.strength += e.amount;
  if (e.type === "heal")
    target.hp = Math.min(target.maxHp, target.hp + e.amount);
  if (e.type === "mark") {
    resource.value += e.amount;
    return `${label} → 标记 +${e.amount}`;
  }
  if (e.type === "spendResource") {
    const spent = resource.value;
    resource.value = 0;
    if (spent <= 0) return `${label} → 没有可消耗的职业资源`;
    const extra = spent * e.amount;
    damage(target, extra);
    return `${label} → 消耗 ${spent} 点资源，追加 ${extra} 伤害`;
  }
  return `${label} → ${e.type} ${e.amount}`;
}

export function poisonTick(actor: Actor) {
  if (actor.poison === 0) return 0;
  const amount = actor.poison;
  actor.hp = Math.max(0, actor.hp - amount);
  actor.poison = Math.max(0, actor.poison - 1);
  return amount;
}
