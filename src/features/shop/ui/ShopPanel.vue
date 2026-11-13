<script setup lang="ts">
import { shopState, itemPrice, visibleStock } from "../model/state";
import { quoteMessage } from "../lib/pricing";
import { cards } from "@/shared/cards";
import { professionNames } from "@/shared/domain";
defineProps<{ gold: number }>();
defineEmits<{ buy: [id: string]; leave: [] }>();
</script>
<template>
  <section class="panel">
    <div class="section-top">
      <span class="eyebrow">04 / THE TRADER</span><span>旅途补给</span>
    </div>
    <h2>路上的旧相识</h2>
    <template v-if="shopState.open"
      ><p class="muted">
        {{
          quoteMessage(
            shopState.context!.influence.favor,
            shopState.context!.influence.scarcity,
          )
        }}
      </p>
      <p class="muted">
        货架按 {{ professionNames[shopState.context!.profession] }}
        过滤：只出售本职业与中立卡。
      </p>
      <div class="stock">
        <div v-for="item in visibleStock()" :key="item.id">
          <div>
            <b>{{ cards[item.card]?.name }}</b
            ><small
              >{{ cards[item.card]?.text }} ·
              {{ cards[item.card]?.profession === "neutral" ? "中立" : professionNames[shopState.context!.profession] }}</small
            >
          </div>
          <button
            :disabled="item.sold || gold < itemPrice(item.id)"
            :data-stock="item.id"
            @click="$emit('buy', item.id)"
          >
            {{ item.sold ? "已售出" : itemPrice(item.id) + " 金 · 购买" }}
          </button>
        </div>
      </div>
      <button data-action="leave-shop" @click="$emit('leave')">
        收好行囊，继续前进 →
      </button></template
    >
    <div v-else class="empty-mini">
      寻找路线上的天平标记。安路的好感让金币走得更远。
    </div>
  </section>
</template>
