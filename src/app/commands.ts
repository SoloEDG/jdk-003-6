import { routeState, enterRoute, resolveRoute, resetRoute } from "@/features/route";
import {
  battleState,
  beginBattle,
  playCard,
  endTurn,
  resetBattle,
} from "@/features/battle";
import {
  deckState,
  deckCards,
  addCard,
  addToActiveDeck,
  removeFromActiveDeck,
  earnGold,
  spendGold,
  setHp,
  heal,
  upgradeCard,
  removeCard,
  openCamp,
  useCamp,
  resetDeck,
  previewSwitch,
  commitSwitch,
} from "@/features/deck";
import { openReward, claimReward, resetReward } from "@/features/reward";
import {
  openShop,
  preparePurchase,
  completePurchase,
  closeShop,
  resetShop,
} from "@/features/shop";
import {
  session,
  switchTab,
  setContext,
  notify,
  finishRun,
  resetSession,
  beginRun,
} from "./session";
import { saveIfStarted, clearSave } from "./persistence";
import { professionNames } from "@/shared/domain";
function persist() {
  if (!saveIfStarted(session.started))
    notify("本地保存失败，请保留当前页面。");
}

export function start(profession: Parameters<typeof resetDeck>[0]) {
  if (!profession || session.started) return;
  resetDeck(profession);
  resetRoute();
  resetBattle();
  resetReward();
  resetShop();
  beginRun(profession, professionNames[profession]);
  persist();
}

export function navigate(id: string) {
  if (session.ended) return;
  const c = enterRoute(id);
  if (!c) {
    notify("这个节点不对当前职业开放，或路线尚未解锁。");
    return;
  }
  setContext(c);
  if (c.kind === "shop") {
    openShop(c);
    switchTab("shop");
  } else if (c.kind === "camp") {
    openCamp();
    switchTab("deck");
  } else {
    // beginBattle 会把本场职业资源清零并由战斗快照持有：
    // 旧职业/上一场的资源绝不跨入新战斗。
    beginBattle(c, deckCards(), deckState.hero.hp, deckState.hero.maxHp);
    switchTab("battle");
  }
  notify(
    `进入 ${c.nodeId} · ${professionNames[c.profession]} · 威胁 ${c.influence.heat} / 好感 ${c.influence.favor}`,
  );
  persist();
}
export function play(id: string) {
  playCard(id);
  persist();
}
export function turn() {
  endTurn();
  persist();
}
export function settle() {
  const r = battleState.result;
  if (!r) return;
  if (!r.won) {
    setHp(r.hp);
    finishRun();
    notify("这次旅途已经结束。重新启程可保留你的经验。");
    persist();
    return;
  }
  if (openReward(JSON.parse(JSON.stringify(r)))) {
    setHp(r.hp);
    switchTab("reward");
    notify("胜利！选择一张牌或跳过卡牌，金币都会结算。");
  }
  persist();
}
export function claim(skip: boolean) {
  const grant = claimReward(skip);
  if (!grant) return;
  if (grant.card) addCard(grant.card);
  earnGold(grant.gold);
  heal(grant.heal);
  resolveRoute();
  if (session.context?.kind === "boss") {
    finishRun();
    notify("裂隙已被封存。你把余烬带回了黎明。");
  } else if (session.context?.kind === "trial")
    notify("试炼完成。职业资源与奖励只属于这一条路。");
  else notify("奖励已结算，新的路线开放。");
  switchTab("route");
  persist();
}
export function buy(id: string) {
  const p = preparePurchase(id);
  if (!p || !spendGold(p.price)) {
    notify("无法购买：库存、职业资格或金币不足。");
    return;
  }
  if (!completePurchase(p)) {
    earnGold(p.price);
    return;
  }
  addCard(p.card);
  notify("交易完成，卡牌已收入收藏；本职业可用的卡同时出战。");
  persist();
}
export function leaveShop() {
  closeShop();
  resolveRoute();
  switchTab("route");
  persist();
}
/** 誓约篝火当前是否可提交切换：本节点是 camp、尚未结算、且标记为誓约篝火。 */
export function switchCampOpen() {
  return (
    !session.ended &&
    !routeState.resolved &&
    session.context?.kind === "camp" &&
    session.context.switchCamp === true &&
    !deckState.campUsed
  );
}

export function camp(action: "rest" | "upgrade") {
  if (
    !session.context ||
    session.context.kind !== "camp" ||
    !useCamp(action, session.context.influence.heat)
  )
    return;
  resolveRoute();
  notify("篝火逐渐熄灭，你准备好继续上路。");
  persist();
}

/** 职业切换只允许在誓约篝火提交，预览不消耗资源。 */
export function previewProfession(profession: typeof deckState.profession | null) {
  // 预览只更新显示：不写职业、不扣资源、不改变路线资格。
  if (!switchCampOpen()) return;
  previewSwitch(profession);
}
export function switchProfession(profession: typeof deckState.profession) {
  if (!switchCampOpen()) {
    notify("职业切换只能在誓约篝火提交。");
    return;
  }
  if (!commitSwitch(profession, true)) {
    notify("职业切换失败：只允许在誓约篝火，且不能切回原职业。");
    return;
  }
  resolveRoute();
  setContext(null);
  switchTab("route");
  notify(
    `已在誓约篝火重新誓约：${professionNames[profession]}。出战牌组已重新核定，旧职业资源不带入下一场战斗。`,
  );
  persist();
}
export function upgrade(id: string) {
  if (battleState.phase === "playing") return;
  notify(upgradeCard(id) ? "卡牌强化完成。" : "无法强化：金币不足或已经强化。");
  persist();
}
export function remove(id: string) {
  if (battleState.phase === "playing") return;
  notify(
    removeCard(id)
      ? "已移除卡牌（收藏与出战牌组同时清除）。"
      : "无法移除：金币不足，或出战牌组已到五张下限。",
  );
  persist();
}
export function equip(id: string) {
  notify(
    addToActiveDeck(id)
      ? "已放入出战牌组。"
      : "无法放入：仅限本职业与中立卡，且不能重复。",
  );
  persist();
}
export function unequip(id: string) {
  notify(
    removeFromActiveDeck(id)
      ? "已移出出战牌组（仍保留在收藏）。"
      : "无法移出：出战牌组至少保留五张。",
  );
  persist();
}
export function restart() {
  resetRoute();
  resetBattle();
  resetDeck(deckState.profession);
  resetReward();
  resetShop();
  resetSession();
  clearSave();
  // 重新启程回到开局职业选择；旧存档已清空，不会再载入旧职业。
  persist();
}
