import type { BattleResult, RewardOffer } from "@/shared/domain";
import { usableCardKeys } from "@/shared/professions";
import { rewardPool } from "./pool";

export function offerFrom(result: BattleResult): RewardOffer {
  const profession = result.context.profession;
  return {
    id: `reward-${result.id}`,
    source: result.id,
    cards: usableCardKeys(profession, rewardPool(result.context)),
    gold: result.gold + result.context.influence.favor * 2,
    heal: result.context.region === "forest" ? 3 : 0,
    claimed: false,
    profession,
  };
}

export function validChoice(offer: RewardOffer | null, key: string | null) {
  return (
    !!offer &&
    !offer.claimed &&
    (key === null || offer.cards.includes(key))
  );
}
