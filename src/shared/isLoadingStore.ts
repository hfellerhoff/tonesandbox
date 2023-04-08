import { action, atom, computed } from "nanostores";

export const loadingPercentAtom = atom<number>(100);
export const isLoadingAtom = computed(
  loadingPercentAtom,
  (loadingPercent) => loadingPercent < 100
);
export const setLoadingPercent = action(
  loadingPercentAtom,
  "setLoadingPercent",
  (store, value: number) => {
    if (value < 0) value = 0;
    if (value > 100) value = 100;
    store.set(value);
  }
);
