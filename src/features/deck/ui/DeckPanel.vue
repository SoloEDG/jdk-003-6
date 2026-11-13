<script setup lang="ts">
import { computed } from "vue";
import { deckState, selectCard } from "../model/state";
import { cards, cardUsableBy } from "@/shared/cards";
import {
  professionOrder,
  professions,
  cardTagLabel,
} from "@/shared/professions";
import {
  professionNames,
  professionResources,
  type Profession,
} from "@/shared/domain";
import { upgradeCost, removalCost } from "../lib/costs";
const props = defineProps<{
  camp: boolean;
  locked: boolean;
  switchCamp: boolean;
  preview: Profession | null;
}>();
const emit = defineEmits<{
  upgrade: [id: string];
  remove: [id: string];
  camp: [action: "rest" | "upgrade"];
  equip: [id: string];
  unequip: [id: string];
  "preview-switch": [profession: Profession | null];
  switch: [profession: Profession];
}>();

const canUse = (key: string) => cardUsableBy(deckState.profession, key);
const foreignCount = computed(
  () => deckState.cards.filter((c) => !canUse(c.key)).length,
);
const inDeck = (id: string) =>
  deckState.activeDeck.some((c) => c.id === id);
const deckAtFloor = computed(() => deckState.activeDeck.length <= 5);
const selectedInDeck = computed(() =>
  deckState.activeDeck.some((c) => c.id === deckState.selected),
);
const selectedCollection = computed(() =>
  deckState.cards.find((c) => c.id === deckState.selected),
);
const canRemoveSelected = computed(
  () =>
    !!selectedCollection.value &&
    (!inDeck(selectedCollection.value.id) ||
      deckState.activeDeck.length > 5),
);
const canEquipSelected = computed(
  () =>
    !!selectedCollection.value &&
    canUse(selectedCollection.value.key) &&
    !inDeck(selectedCollection.value.id),
);
const previewProfession = computed(
  () => props.preview ?? deckState.switchPreview ?? null,
);
const switchAllowed = computed(() => props.switchCamp && !deckState.campUsed);
const previewImpact = computed(() => {
  const p = previewProfession.value;
  if (!p || p === deckState.profession) return null;
  const kept = deckState.activeDeck.filter((c) => cardUsableBy(p, c.key));
  return {
    kept: kept.length,
    dropped: deckState.activeDeck.length - kept.length,
    tag: professions[p].name,
  };
});
</script>
<template>
  <section class="panel deck-panel">
    <div class="section-top">
      <span class="eyebrow">05 / YOUR ARSENAL</span
      ><span
        >出战 {{ deckState.activeDeck.length }} · 收藏
        {{ deckState.cards.length }}</span
      >
    </div>
    <h2>行囊中的可能</h2>
    <p class="muted">
      当前职业 {{ professionNames[deckState.profession] }}，战斗资源
      {{ professionResources[deckState.profession] }}。跨职业卡可以收藏，
      但只有本职业与中立卡能进作出战牌组；收藏 {{ foreignCount }} 张暂不可用。
    </p>

    <div v-if="camp" class="camp">
      <h3>篝火 · {{ deckState.campUsed ? "已经休整" : "选择一次休整" }}</h3>
      <button :disabled="deckState.campUsed" @click="emit('camp', 'rest')">
        休息 · 回复生命</button
      ><button
        :disabled="deckState.campUsed || !deckState.selected"
        @click="emit('camp', 'upgrade')"
      >
        免费强化选中牌
      </button>
    </div>

    <div v-if="switchCamp" class="camp switch-camp">
      <h3>誓约篝火 · 重新誓约</h3>
      <p class="muted">
        切换职业会重新核定出战牌组；永久收藏与金币保持不变，
        {{ professionResources[deckState.profession] }}从 0 开始，不带入下一场战斗。
        {{ deckState.campUsed ? "本次篝火已使用。" : "与休息/强化共用同一次篝火。" }}
      </p>
      <div class="switch-options">
        <button
          v-for="key in professionOrder"
          :key="key"
          :class="{ selected: previewProfession === key }"
          :disabled="key === deckState.profession || !switchAllowed"
          :data-switch-profession="key"
          @mouseenter="emit('preview-switch', key)"
          @mouseleave="emit('preview-switch', null)"
          @click="emit('switch', key)"
        >
          {{ professions[key].name }} · {{ professions[key].resource }}
        </button>
      </div>
      <div v-if="previewProfession" class="deck-preview">
        <b>预览 · {{ professions[previewProfession].motto }}</b>
        <small v-if="previewImpact">
          切换后出战牌组保留 {{ previewImpact.kept }} 张，另有
          {{ previewImpact.dropped }} 张本职业外卡牌退回收藏。
          资源「{{ professionResources[previewProfession] }}」从 0 开始。
        </small>
        <small>预览不会消耗资源，也不会开放试炼。</small>
      </div>
    </div>

    <h3 class="subhead">出战牌组</h3>
    <div class="deck-list">
      <button
        v-for="c in deckState.activeDeck"
        :key="c.id"
        :data-card-id="c.id"
        :class="{ selected: deckState.selected === c.id }"
        @click="selectCard(c.id)"
      >
        <span>{{ cards[c.key]?.name }}{{ c.upgraded ? " +" : "" }}</span
        ><small>{{ cards[c.key]?.text }}</small
        ><em>{{ c.id.slice(-6) }}</em>
      </button>
    </div>
    <div class="toolbar">
      <button
        :disabled="
          locked ||
          !deckState.selected ||
          !selectedCollection ||
          selectedCollection.upgraded
        "
        @click="emit('upgrade', deckState.selected)"
      >
        强化 · {{ upgradeCost(false, deckState.hero.scars) }} 金</button
      ><button
        :disabled="locked || !canRemoveSelected"
        @click="emit('remove', deckState.selected)"
      >
        移除 · {{ removalCost(deckState.removals) }} 金</button
      ><button
        :disabled="locked || !selectedInDeck || deckAtFloor"
        @click="emit('unequip', deckState.selected)"
      >
        移出出战
      </button>
    </div>

    <h3 class="subhead">永久收藏</h3>
    <div class="deck-list collection-list">
      <button
        v-for="c in deckState.cards"
        :key="'col-' + c.id"
        :data-card-id="c.id"
        class="collection-card"
        :class="{
          foreign: !canUse(c.key),
          selected: deckState.selected === c.id,
        }"
        @click="selectCard(c.id)"
      >
        <span
          >{{ cards[c.key]?.name }}{{ c.upgraded ? " +" : "" }}
          <i class="tag">{{ cardTagLabel(c.key) }}</i></span
        >
        <small>{{ cards[c.key]?.text }}</small>
        <small v-if="!canUse(c.key)" class="locked-note">
          跨职业卡 · 暂不能加入出战牌组（当前
          {{ professionNames[deckState.profession] }}）
        </small>
        <small v-else-if="!inDeck(c.id)" class="ready-note">
          本职业可用 · 可放入出战
        </small>
        <em>{{ inDeck(c.id) ? "出战中" : "收藏" }}</em>
      </button>
    </div>
    <div class="toolbar">
      <button
        :disabled="locked || !canEquipSelected"
        data-action="equip"
        @click="emit('equip', deckState.selected)"
      >
        放入出战牌组
      </button>
    </div>
  </section>
</template>
