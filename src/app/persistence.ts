import {
  exportRoute,
  restoreRoute,
  nodeLockedByProfession,
} from "@/features/route";
import { exportBattle, restoreBattle } from "@/features/battle";
import { exportDeck, restoreDeck } from "@/features/deck";
import { exportReward, restoreReward } from "@/features/reward";
import { exportShop, restoreShop } from "@/features/shop";
import { exportSession, restoreSession } from "./session";
import { isProfession } from "@/shared/domain";
const KEY = "ember-path-v2";
const VERSION = 2;
function snapshot() {
  return {
    version: VERSION,
    route: exportRoute(),
    battle: exportBattle(),
    deck: exportDeck(),
    reward: exportReward(),
    shop: exportShop(),
    session: exportSession(),
  };
}
export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(snapshot()));
    return true;
  } catch {
    return false;
  }
}

/** 开局职业尚未选定时不写入存档，避免把默认守卫快照当成旅程。 */
export function saveIfStarted(started: boolean) {
  return started ? save() : true;
}
export function load() {
  const raw = localStorage.getItem(KEY);
  if (!raw) return false;
  try {
    const d = JSON.parse(raw);
    if (
      d.version !== VERSION ||
      !isProfession(d.deck?.profession) ||
      !Array.isArray(d.deck?.cards) ||
      !Array.isArray(d.deck?.activeDeck) ||
      !Array.isArray(d.route?.visited) ||
      !d.battle?.piles ||
      !isProfession(d.battle?.profession) ||
      !Array.isArray(d.reward?.history) ||
      !Array.isArray(d.shop?.stock) ||
      !d.session
    )
      return false;
    const old = snapshot();
    try {
      restoreRoute(d.route);
      restoreBattle(d.battle);
      restoreDeck(d.deck);
      restoreReward(d.reward);
      restoreShop(d.shop);
      restoreSession(d.session);
      // 资格重新核定：恢复出的当前节点若不再属于当前职业，返回路线页，
      // 战斗与商店保留快照但不会被旧资格继续使用。
      if (
        d.session?.context?.nodeId &&
        nodeLockedByProfession(d.session.context.nodeId)
      ) {
        restoreSession({
          ...d.session,
          tab: "route",
          context: null,
          message: "职业资格已重新核定，请重新选择路线。",
        });
      }
    } catch {
      // 恢复失败时回到当前内存快照，避免半恢复状态污染存档。
      restoreRoute(old.route);
      restoreBattle(old.battle);
      restoreDeck(old.deck);
      restoreReward(old.reward);
      restoreShop(old.shop);
      restoreSession(old.session);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}
export function clearSave() {
  localStorage.removeItem(KEY);
}
