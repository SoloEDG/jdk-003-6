import { reactive, readonly } from "vue";
import type { JourneyContext, Purchase, Profession } from "@/shared/domain";
import { makeStock, type StockItem } from "../lib/stock";
import { priceFor } from "../lib/pricing";
const state = reactive({
  context: null as JourneyContext | null,
  stock: [] as StockItem[],
  purchases: [] as Purchase[],
  open: false,
});
export const shopState = readonly(state);

export function openShop(c: JourneyContext) {
  if (state.context?.nodeId !== c.nodeId) {
    state.context = c;
    state.stock = makeStock(c);
  } else if (state.context.profession !== c.profession) {
    // 同一节点职业被重新核定（极少数情况）：按新职业重开货架。
    state.context = c;
    state.stock = makeStock(c);
  }
  state.open = true;
}

export function itemPrice(id: string) {
  const item = state.stock.find((s) => s.id === id);
  return item && state.context
    ? priceFor(item.basePrice, state.context.influence)
    : Infinity;
}

/** 只展示当前商店职业的货架条目；恢复旧快照时也不会显示别的职业商品。 */
export function visibleStock() {
  if (!state.context) return [];
  return state.stock.filter((s) => s.profession === state.context!.profession);
}

export function preparePurchase(id: string): Purchase | null {
  const item = state.stock.find((s) => s.id === id);
  if (!state.open || !item || item.sold) return null;
  // 防御：货架条目的职业必须与当前商店职业一致。
  if (state.context && item.profession !== state.context.profession) return null;
  return { id: item.id, card: item.card, price: itemPrice(id) };
}

export function completePurchase(p: Purchase) {
  const item = state.stock.find((s) => s.id === p.id);
  if (!item || item.sold) return false;
  item.sold = true;
  state.purchases.push(p);
  return true;
}

export function closeShop() {
  state.open = false;
}

export function exportShop() {
  return JSON.parse(JSON.stringify(state));
}

export function restoreShop(d: ReturnType<typeof exportShop>) {
  Object.assign(state, d);
}

export function resetShop() {
  state.context = null;
  state.stock = [];
  state.purchases = [];
  state.open = false;
}

export function purchaseProfession(): Profession | null {
  return state.context?.profession ?? null;
}
