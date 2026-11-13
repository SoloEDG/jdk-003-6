import type { JourneyContext } from "@/shared/domain";
import { professionPool } from "@/shared/professions";
import { shuffle, hash } from "@/shared/random";

/**
 * 奖励池按当前职业过滤：只出现本职业卡与中立卡。
 * 稀有判定沿用热度和节点类型，但不会因此放出别的职业卡。
 */
export function rewardPool(context: JourneyContext) {
  const rare =
    context.influence.heat >= 2 ||
    context.kind === "elite" ||
    context.kind === "boss" ||
    context.kind === "trial";
  const primary = shuffle(professionPool(context.profession, rare), hash(context.nodeId));
  const fallback = rare ? professionPool(context.profession, false) : [];
  // 稀有池不足三张时用本职业普通卡补足，绝不混入别的职业卡。
  return [...new Set([...primary, ...fallback])].slice(0, 3);
}
