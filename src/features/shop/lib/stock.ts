import type { JourneyContext, Profession } from "@/shared/domain";
import {
  professionPool,
  usableCardKeys,
} from "@/shared/professions";
import { shuffle, hash } from "@/shared/random";

export interface StockItem {
  id: string;
  card: string;
  basePrice: number;
  sold: boolean;
  /** 入库时的职业：切换职业后旧库存不会冒充本职业商品。 */
  profession: Profession;
}

const RARE_PRICE = 48;
const COMMON_PRICE = 32;

/**
 * 商店库存按实际出战职业过滤，并与奖励共用 shared/professions 的资格判断。
 * 只有本职业卡与中立卡会出现在货架上。
 */
export function makeStock(c: JourneyContext): StockItem[] {
  const pool = uniqueUsable(c.profession, [
    ...professionPool(c.profession, true),
    ...professionPool(c.profession, false),
  ]);
  return shuffle(pool, hash(c.nodeId))
    .slice(0, 3)
    .map((card, i) => ({
      id: `${c.nodeId}-stock-${i}`,
      card,
      basePrice: stockBasePrice(c.profession, card),
      sold: false,
      profession: c.profession,
    }));
}

function uniqueUsable(profession: Profession, keys: string[]) {
  return [...new Set(keys)].filter(
    (key) => usableCardKeys(profession, [key]).length > 0,
  );
}

export function stockBasePrice(
  profession: Profession,
  card: string,
): number {
  return professionPool(profession, true).includes(card)
    ? RARE_PRICE
    : COMMON_PRICE;
}


