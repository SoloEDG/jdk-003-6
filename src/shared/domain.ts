export type Region = "forest" | "forge" | "abyss";
export type NodeKind = "battle" | "elite" | "shop" | "camp" | "boss" | "trial";
export type Profession = "guardian" | "warlock" | "ranger";
export interface Influence {
  heat: number;
  favor: number;
  scarcity: number;
}
export interface RouteNode {
  id: string;
  region: Region;
  depth: number;
  lane: number;
  kind: NodeKind;
  title: string;
  influence: Influence;
  next: string[];
  /** 试炼/守卫节点的准入职业；为空表示所有职业都可通行。 */
  profession?: Profession | null;
  /** 只有誓约篝火可以提交职业切换。 */
  switchCamp?: boolean;
}
export interface CardInstance {
  id: string;
  key: string;
  upgraded: boolean;
}
export interface CardSpec {
  key: string;
  name: string;
  cost: number;
  kind: "attack" | "skill" | "power";
  text: string;
  rarity: "common" | "rare";
  effects: Effect[];
  /** 卡牌类别。跨职业卡进入收藏，但不能放进出战牌组。 */
  profession: Profession | "neutral";
}
export type Effect = {
  type:
    | "damage"
    | "block"
    | "draw"
    | "poison"
    | "strength"
    | "heal"
    | "energy"
    | "mark"
    | "spendResource";
  amount: number;
  target: "hero" | "enemy";
};
export interface Actor {
  hp: number;
  maxHp: number;
  block: number;
  strength: number;
  poison: number;
  thorns: number;
}
export interface JourneyContext {
  nodeId: string;
  region: Region;
  depth: number;
  kind: NodeKind;
  influence: Influence;
  /** 进入节点时的职业资格快照：试炼、奖励和商店都读取这一份。 */
  profession: Profession;
  /** 誓约篝火可以在本节点提交职业切换。 */
  switchCamp?: boolean;
}
export interface BattleResult {
  id: string;
  nodeId: string;
  won: boolean;
  hp: number;
  gold: number;
  context: JourneyContext;
}
export interface RewardOffer {
  id: string;
  source: string;
  cards: string[];
  gold: number;
  heal: number;
  claimed: boolean;
  /** 生成奖励时对应的职业，读取与资格判定共用同一份。 */
  profession: Profession;
}
export interface Purchase {
  id: string;
  card: string;
  price: number;
}
export interface ExpeditionSummary {
  hp: number;
  maxHp: number;
  gold: number;
  scars: number;
}
export const regionNames: Record<Region, string> = {
  forest: "苔光林地",
  forge: "熔铁边境",
  abyss: "无声深渊",
};
export const professionNames: Record<Profession, string> = {
  guardian: "守卫",
  warlock: "术士",
  ranger: "游侠",
};
export const professionMottos: Record<Profession, string> = {
  guardian: "以格挡积攒决心，守住队伍最后的火。",
  warlock: "以自伤换取余火，烧穿深渊的沉默。",
  ranger: "以精准与连击，在阴影里先发制人。",
};
export const professionResources: Record<Profession, string> = {
  guardian: "决心",
  warlock: "余火",
  ranger: "标记",
};
export function isProfession(value: unknown): value is Profession {
  return value === "guardian" || value === "warlock" || value === "ranger";
}
