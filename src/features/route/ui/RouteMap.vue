<script setup lang="ts">
import { computed } from "vue";
import { routeState, choices, lockedRoutes, previewRoute } from "../model/state";
import {
  professionNames,
  professionResources,
  regionNames,
} from "@/shared/domain";
import { professions } from "@/shared/professions";
import { deckState } from "@/features/deck";
const emit = defineEmits<{ enter: [id: string] }>();
const allowed = computed(() => choices());
const locked = computed(() => lockedRoutes());
const layers = computed(() =>
  Array.from({ length: 9 }, (_, d) =>
    routeState.nodes.filter((n) => n.depth === d),
  ),
);
const symbols = {
  battle: "⚔",
  elite: "♜",
  shop: "⚖",
  camp: "♨",
  trial: "◉",
  boss: "◈",
};
function nodeSubtitle(node: (typeof routeState.nodes)[number]) {
  const influence = node.lane ? "威胁 +1 / 稀缺 +1" : "好感 +1";
  if (node.kind === "trial" && node.profession)
    return `职业试炼 · 仅${professions[node.profession].name} · ${influence}`;
  if (node.switchCamp) return `可重新誓约 · ${influence}`;
  return `${regionNames[node.region]} · ${influence}`;
}
</script>
<template>
  <section class="panel route-panel">
    <div class="section-top">
      <span class="eyebrow">01 / THE PATH</span
      ><span>已走 {{ routeState.visited.length }} / 9</span>
    </div>
    <h2>每一步，留下回响</h2>
    <p class="muted">
      林地 → 熔铁边境 → 无声深渊。险路增加敌人力量与稀有奖励，安路积累商人好感。
      当前职业 {{ professionNames[deckState.profession] }}：职业试炼只回应同职业者，
      <template v-if="locked.length">另一条路仍然开放。</template>
    </p>
    <div class="route-scroll">
      <div v-for="(layer, d) in layers" :key="d" class="route-row">
        <span class="depth">{{ d + 1 }}</span
        ><button
          v-for="node in layer"
          :key="node.id"
          :data-node="node.id"
          class="route-node"
          :class="{
            available: allowed.includes(node.id),
            visited: routeState.visited.includes(node.id),
            locked: locked.includes(node.id),
            trial: node.kind === 'trial',
          }"
          :disabled="!allowed.includes(node.id)"
          @mouseenter="previewRoute(node.id)"
          @mouseleave="previewRoute('')"
          @click="emit('enter', node.id)"
        >
          <b>{{ symbols[node.kind] }}</b
          ><span
            >{{ node.title
            }}<small>{{ nodeSubtitle(node) }}</small></span
          ><i>{{
            routeState.visited.includes(node.id)
              ? "✓"
              : locked.includes(node.id)
                ? "✕"
                : "↗"
          }}</i>
        </button>
      </div>
    </div>
    <div v-if="routeState.preview" class="notice">
      路途预览 · 威胁 {{ routeState.preview.influence.heat }} / 好感
      {{ routeState.preview.influence.favor }} / 稀缺
      {{ routeState.preview.influence.scarcity }} · 职业
      {{ professionNames[routeState.preview.profession] }}（
      {{ professionResources[routeState.preview.profession] }}）
      <template v-if="routeState.preview.kind === 'trial'">
        · 资格：同职业
      </template>
    </div>
  </section>
</template>
