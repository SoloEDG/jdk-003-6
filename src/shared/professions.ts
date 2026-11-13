import type { Profession, RouteNode } from "./domain";
import {
  professionMottos,
  professionNames,
  professionResources,
} from "./domain";
import { cardProfession, cardUsableBy } from "./cards";

export interface ProfessionSpec {
  key: Profession;
  name: string;
  motto: string;
  resource: string;
  resourceRule: string;
  maxHp: number;
  startingGold: number;
  starter: string[];
  common: string[];
  rare: string[];
}

export const professionOrder: Profession[] = ["guardian", "warlock", "ranger"];

export const professions: Record<Profession, ProfessionSpec> = {
  guardian: {
    key: "guardian",
    name: professionNames.guardian,
    motto: professionMottos.guardian,
    resource: professionResources.guardian,
    resourceRule: "每获得一次格挡，决心 +1；盾击会消耗全部决心造成额外伤害。",
    maxHp: 78,
    startingGold: 80,
    starter: [
      "strike",
      "strike",
      "guard",
      "guard",
      "guard",
      "shelter",
      "shelter",
      "focus",
    ],
    common: ["strike", "guard", "shelter", "shield_bash"],
    rare: ["bulwark", "last_stand", "focus"],
  },
  warlock: {
    key: "warlock",
    name: professionNames.warlock,
    motto: professionMottos.warlock,
    resource: professionResources.warlock,
    resourceRule: "每当自己受到来自卡牌的伤害，每 2 点伤害积累 1 余火；灰烬爆发会消耗全部余火。",
    maxHp: 66,
    startingGold: 80,
    starter: [
      "w_bolt",
      "w_bolt",
      "w_bolt",
      "w_rite",
      "w_rite",
      "w_hex",
      "w_hex",
      "focus",
    ],
    common: ["w_bolt", "w_rite", "w_hex", "w_cinder"],
    rare: ["w_immolate", "fury", "burst", "focus"],
  },
  ranger: {
    key: "ranger",
    name: professionNames.ranger,
    motto: professionMottos.ranger,
    resource: professionResources.ranger,
    resourceRule: "每当你的攻击命中，标记 +1；终结之箭会消耗全部标记造成额外伤害。",
    maxHp: 70,
    startingGold: 80,
    starter: [
      "r_shot",
      "r_shot",
      "r_shot",
      "venom",
      "venom",
      "r_mark",
      "r_mark",
      "r_dash",
    ],
    common: ["r_shot", "venom", "r_mark", "r_volley", "r_trap", "r_dash"],
    rare: ["r_finish", "r_precision", "focus"],
  },
};

export function professionSpec(profession: Profession) {
  return professions[profession];
}

export function starterDeck(profession: Profession) {
  return professions[profession].starter;
}

export function baseHp(profession: Profession) {
  return professions[profession].maxHp;
}

/** 路线准入：试炼节点与职业资格读取同一份判断。 */
export function canEnterNode(
  profession: Profession,
  node: Pick<RouteNode, "profession">,
) {
  return !node.profession || node.profession === profession;
}

export function nodeLockReason(
  profession: Profession,
  node: Pick<RouteNode, "profession">,
) {
  if (canEnterNode(profession, node)) return "";
  const target = node.profession ? professions[node.profession].name : "";
  return `职业试炼 · 仅限${target}（当前 ${professions[profession].name}）`;
}

/** 奖励与商店使用同一套职业资格过滤。 */
export function usableCardKeys(profession: Profession, keys: string[]) {
  return keys.filter((key) => cardUsableBy(profession, key));
}

export function professionPool(profession: Profession, rare: boolean) {
  const pool = professions[profession];
  return rare ? pool.rare : pool.common;
}

export function cardTagLabel(key: string) {
  const tag = cardProfession(key);
  if (tag === "neutral") return "中立";
  return professions[tag].name;
}
