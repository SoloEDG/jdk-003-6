import type { Profession, RouteNode, Region, NodeKind } from "@/shared/domain";
import { professionOrder } from "@/shared/professions";

interface Layer {
  kinds: [NodeKind, NodeKind];
  trial?: Profession;
}

/**
 * 每个深度最多一次职业试炼，三个职业在路线中交错出现：
 * 同一层的另一条路永远可用，撞上别的职业试炼是「选择」而非死路。
 */
function layerKinds(depth: number): Layer {
  switch (depth) {
    case 0:
      return { kinds: ["battle", "battle"] };
    case 1:
      return { kinds: ["shop", "camp"] };
    case 2:
      return { kinds: ["battle", "trial"], trial: "guardian" };
    case 3:
      return { kinds: ["elite", "elite"] };
    case 4:
      return { kinds: ["battle", "camp"] };
    case 5:
      return { kinds: ["shop", "trial"], trial: "warlock" };
    case 6:
      return { kinds: ["battle", "elite"] };
    case 7:
      return { kinds: ["elite", "trial"], trial: "ranger" };
    default:
      return { kinds: ["boss", "boss"] };
  }
}

export function makeMap(): RouteNode[] {
  const result: RouteNode[] = [];
  const regions: Region[] = ["forest", "forge", "abyss"];
  for (let depth = 0; depth < 9; depth++) {
    const region = regions[Math.floor(depth / 3)]!;
    const layer = layerKinds(depth);
    for (let lane = 0; lane < 2; lane++) {
      const kind = layer.kinds[lane]!;
      const isSwitchCamp = kind === "camp" && depth === 4;
      result.push({
        id: `n${depth}-${lane}`,
        region,
        depth,
        lane,
        kind,
        profession: kind === "trial" ? layer.trial ?? null : null,
        switchCamp: isSwitchCamp,
        title:
          kind === "boss"
            ? "裂隙守望者"
            : kind === "trial"
              ? "职业试炼"
              : kind === "shop"
                ? "游商营地"
                : kind === "camp"
                  ? isSwitchCamp
                    ? "誓约篝火"
                    : "熄风篝火"
                  : kind === "elite"
                    ? "危险的捷径"
                    : "失落哨站",
        influence:
          lane === 0
            ? { heat: 0, favor: 1, scarcity: 0 }
            : { heat: 1, favor: 0, scarcity: 1 },
        next: depth === 8 ? [] : [`n${depth + 1}-0`, `n${depth + 1}-1`],
      });
    }
  }
  return result;
}
