import { reactive, readonly } from "vue";
import type { Influence, JourneyContext, Profession } from "@/shared/domain";
import { makeMap } from "../lib/map";
import { available, contextFor, lockedCandidates } from "../lib/rules";
import { canEnterNode } from "@/shared/professions";
import { deckState } from "@/features/deck/model/state";

const state = reactive({
  nodes: makeMap(),
  visited: [] as string[],
  resolved: true,
  influence: { heat: 0, favor: 0, scarcity: 0 } as Influence,
  preview: null as JourneyContext | null,
});
export const routeState = readonly(state);

/** 职业资格只读取当前出战职业，试炼与路线可用性共用这一份。 */
function currentProfession(): Profession {
  return deckState.profession;
}

export function choices() {
  return available(state.nodes, state.visited, state.resolved, currentProfession());
}

export function lockedRoutes() {
  return lockedCandidates(
    state.nodes,
    state.visited,
    state.resolved,
    currentProfession(),
  );
}

export function previewRoute(id: string) {
  const n = state.nodes.find((n) => n.id === id);
  state.preview = n
    ? contextFor(n, state.influence, currentProfession())
    : null;
}

export function enterRoute(id: string): JourneyContext | null {
  if (!choices().includes(id)) return null;
  const node = state.nodes.find((n) => n.id === id)!;
  const context = contextFor(node, state.influence, currentProfession());
  state.visited.push(id);
  state.influence = context.influence;
  state.resolved = false;
  state.preview = null;
  return context;
}

export function resolveRoute() {
  state.resolved = true;
}

export function exportRoute() {
  return JSON.parse(
    JSON.stringify({
      visited: state.visited,
      resolved: state.resolved,
      influence: state.influence,
    }),
  );
}

export function restoreRoute(data: ReturnType<typeof exportRoute>) {
  state.visited = data.visited;
  state.resolved = data.resolved;
  state.influence = data.influence;
  state.preview = null;
}

/** 存档恢复后，若当前节点的职业试炼已不匹配，回到路线页而不是继续旧资格。 */
export function nodeLockedByProfession(id: string) {
  const node = state.nodes.find((n) => n.id === id);
  return !!node && !canEnterNode(currentProfession(), node);
}

export function resetRoute() {
  state.visited = [];
  state.resolved = true;
  state.influence = { heat: 0, favor: 0, scarcity: 0 };
  state.preview = null;
}
