import type { CardInstance, Profession } from "@/shared/domain";
import { uid } from "@/shared/random";
import { starterDeck } from "@/shared/professions";

export function starter(profession: Profession = "guardian"): CardInstance[] {
  return starterDeck(profession).map((key) => ({
    id: uid("card"),
    key,
    upgraded: false,
  }));
}

export function createCard(key: string): CardInstance {
  return { id: uid("card"), key, upgraded: false };
}

export function canRemove(size: number) {
  return size > 5;
}
