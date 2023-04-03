import { createSignal } from "solid-js";

export const [sequencerMeasures, setSequencerMeasures] = createSignal(1);
export const [sequencerBeats, setSequencerBeats] = createSignal(4);
export const [sequencerSubdivisions, setSequencerSubdivisions] =
  createSignal(4);

export const [octaves, setOctaves] = createSignal(2);
export const [baseOctave, setBaseOctave] = createSignal(4);

export const [isMouseDown, setIsMouseDown] = createSignal(false);

export type TileKey = `${string}-${number}-${number}-${number}`;
export enum TileState {
  None,
  Single,
  Combined,
}

export type SelectedTileMap = Map<TileKey, TileState>;
export const [selectedTiles, setSelectedTiles] = createSignal<SelectedTileMap>(
  new Map()
);
