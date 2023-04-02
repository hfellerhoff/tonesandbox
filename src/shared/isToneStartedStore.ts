import { action, atom } from "nanostores";

export const isToneStartedStore = atom<boolean>(false);

export const setToneIsReady = action(
  isToneStartedStore,
  "setToneIsReady",
  (store) => {
    store.set(true);
  }
);
