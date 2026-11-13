import { reactive, readonly } from "vue";
import type { JourneyContext, Profession } from "@/shared/domain";
const state = reactive({
  tab: "route",
  context: null as JourneyContext | null,
  message: "在火熄灭之前，选择你的职业，然后找到通向深渊的路。",
  ended: false,
  /** 开局职业选择完成前，不进入路线、也不自动存档。 */
  started: false,
});
export const session = readonly(state);
export function switchTab(tab: string) {
  state.tab = tab;
}
export function setContext(c: JourneyContext | null) {
  state.context = c;
}
export function notify(message: string) {
  state.message = message;
}
export function finishRun() {
  state.ended = true;
}
export function beginRun(profession: Profession, name: string) {
  state.started = true;
  state.ended = false;
  state.tab = "route";
  state.context = null;
  state.message = `你以${name}的身份点燃火种。路线上的职业试炼只回应同职业者。`;
}
export function exportSession() {
  return JSON.parse(JSON.stringify(state));
}
export function restoreSession(d: ReturnType<typeof exportSession>) {
  Object.assign(state, d);
  // 存在存档即表示已选定职业：即使旧快照缺少 started 字段也直接进入旅程。
  state.started = true;
}
export function resetSession() {
  state.tab = "route";
  state.context = null;
  state.message = "新的火种已点燃。选择职业，再踏上前路。";
  state.ended = false;
  state.started = false;
}
