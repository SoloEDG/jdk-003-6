import type {
  Influence,
  JourneyContext,
  Profession,
  RouteNode,
} from "@/shared/domain";
import { canEnterNode } from "@/shared/professions";
export function accumulate(a: Influence, b: Influence): Influence {
  return {
    heat: a.heat + b.heat,
    favor: a.favor + b.favor,
    scarcity: a.scarcity + b.scarcity,
  };
}
export function contextFor(
  node: RouteNode,
  influence: Influence,
  profession: Profession,
): JourneyContext {
  return {
    nodeId: node.id,
    region: node.region,
    depth: node.depth,
    kind: node.kind,
    influence: accumulate(influence, node.influence),
    profession,
    switchCamp: node.switchCamp === true,
  };
}
export function available(
  nodes: RouteNode[],
  visited: string[],
  resolved: boolean,
  profession: Profession,
): string[] {
  const candidates = !visited.length
    ? nodes.filter((n) => n.depth === 0)
    : !resolved
      ? []
      : nodes
          .find((n) => n.id === visited.at(-1))
          ?.next.map((id) => nodes.find((n) => n.id === id)!)
          .filter(Boolean) ?? [];
  return candidates
    .filter((node) => canEnterNode(profession, node))
    .map((node) => node.id);
}

/** 节点存在但被职业资格挡住时，用同一份判断给出锁定原因。 */
export function lockedCandidates(
  nodes: RouteNode[],
  visited: string[],
  resolved: boolean,
  profession: Profession,
) {
  const candidates = !visited.length
    ? nodes.filter((n) => n.depth === 0)
    : !resolved
      ? []
      : nodes
          .find((n) => n.id === visited.at(-1))
          ?.next.map((id) => nodes.find((n) => n.id === id)!)
          .filter(Boolean) ?? [];
  return candidates
    .filter((node) => !canEnterNode(profession, node))
    .map((node) => node.id);
}
