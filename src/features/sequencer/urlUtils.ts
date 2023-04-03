import {
  rootNoteAtom,
  scaleAtom,
  showNonDiatonicNotesAtom,
} from "./ScaleSelection";
import { bpm } from "./playback";
import {
  sequencerMeasures,
  selectedTiles,
  sequencerBeats,
  sequencerSubdivisions,
  octaves,
  baseOctave,
  TileState,
} from "./state";

type TileKey = `${string}-${number}-${number}-${number}`;

const SEPARATOR = ":";

export function encodeSequencerToUrl() {
  const tiles = selectedTiles();
  const measures = sequencerMeasures();
  const beats = sequencerBeats();
  const subdivisions = sequencerSubdivisions();
  const bpmValue = bpm();
  const octavesValue = octaves();
  const baseOctaveValue = baseOctave();
  const rootNote = rootNoteAtom.get();
  const scale = scaleAtom.get();
  const showNonDiatonicNotes = showNonDiatonicNotesAtom.get();

  const selectedTileArray = Array.from(tiles.entries())
    .filter(([, value]) => value !== TileState.None)
    .map(([key, value]) => `${key}${SEPARATOR}${value}`);

  console.log(selectedTileArray);

  const params = new URLSearchParams({
    t: btoa(JSON.stringify(selectedTileArray)),
    m: measures.toString(),
    b: beats.toString(),
    s: subdivisions.toString(),
    bpm: bpmValue.toString(),
    o: octavesValue.toString(),
    bo: baseOctaveValue.toString(),
    rn: rootNote,
    sc: btoa(JSON.stringify(scale)),
    sndn: showNonDiatonicNotes ? "1" : "0",
  });

  return `${window.location.origin}/sequencer?${params.toString()}`;
}

export function decodeUrlToSequencerState(urlString: string) {
  const url = new URL(urlString);
  const params = url.searchParams;

  const t = params.get("t");
  const tileArray = t
    ? ((JSON.parse(atob(t)) as string[]).map((entry) => {
        const [key, stateString] = entry.split(SEPARATOR);
        const stateValue: TileState = parseInt(stateString || "1");
        return [key, stateValue];
      }) as [TileKey, TileState][])
    : undefined;
  const tiles = tileArray?.reduce((acc, [key, state]) => {
    acc.set(key, state);
    return acc;
  }, new Map<TileKey, TileState>());

  const m = params.get("m");
  const measures = m ? parseInt(m) : undefined;

  const b = params.get("b");
  const beats = b ? parseInt(b) : undefined;

  const s = params.get("s");
  const subdivisions = s ? parseInt(s) : undefined;

  const bpm = params.get("bpm");
  const bpmValue = bpm ? parseInt(bpm) : undefined;

  const o = params.get("o");
  const octaves = o ? parseInt(o) : undefined;

  const bo = params.get("bo");
  const baseOctave = bo ? parseInt(bo) : undefined;

  const rn = params.get("rn");
  const rootNote = rn ? rn : undefined;

  const sc = params.get("sc");
  const scale = sc ? JSON.parse(atob(sc)) : undefined;

  const sndn = params.get("sndn");
  const showNonDiatonicNotes = sndn ? sndn === "1" : undefined;

  const sequencerState = {
    tiles,
    measures,
    beats,
    subdivisions,
    bpm: bpmValue,
    octaves,
    baseOctave,
    rootNote,
    scale,
    showNonDiatonicNotes,
  };

  return sequencerState;
}
