import { createSignal } from "solid-js";

export const [sequencerMeasures, setSequencerMeasures] = createSignal(1);
export const [sequencerBeats, setSequencerBeats] = createSignal(4);
export const [sequencerSubdivisions, setSequencerSubdivisions] =
  createSignal(4);

export const [octaves, setOctaves] = createSignal(2);
export const [baseOctave, setBaseOctave] = createSignal(4);

export const [isMouseDown, setIsMouseDown] = createSignal(false);

export type TileKey = `${string}-${number}-${number}-${number}`;
export const getTileKey = (
  note: string,
  measure: number,
  beat: number,
  subdivision: number
): TileKey => {
  note = note.split("/")[0].replace("#", "s");
  return `${note}-${measure}-${beat}-${subdivision}`;
};
export const parseTileKey = (
  key: TileKey
): {
  note: string;
  measure: number;
  beat: number;
  subdivision: number;
} => {
  const [note, measure, beat, subdivision] = key.split("-");
  return {
    note: note.replace("s", "#"),
    measure: parseInt(measure),
    beat: parseInt(beat),
    subdivision: parseInt(subdivision),
  };
};

export enum TileState {
  None,
  Single,
  Combined,
}

export type SelectedTileMap = Map<TileKey, TileState>;
export const [selectedTiles, setSelectedTiles] = createSignal<SelectedTileMap>(
  new Map()
);

export const [zoom, setZoom] = createSignal(1);
