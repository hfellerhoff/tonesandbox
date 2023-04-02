type TileKey = `${string}-${number}-${number}-${number}`;

type SequencerState = {
  tiles: Map<TileKey, boolean>;
  measures: number;
  beats: number;
  subdivisions: number;
  bpm: number;
  octaves: number;
  baseOctave: number;
  rootNote: string;
  scale: number[];
  showNonDiatonicNotes: boolean;
};
export function encodeSequencerToUrl(sequencerState: SequencerState) {
  const {
    tiles,
    measures,
    beats,
    subdivisions,
    bpm,
    octaves,
    baseOctave,
    rootNote,
    scale,
    showNonDiatonicNotes,
  } = sequencerState;

  const selectedTiles = Array.from(tiles.entries())
    .filter(([, value]) => value)
    .map(([key]) => key);

  const params = new URLSearchParams({
    t: btoa(JSON.stringify(selectedTiles)),
    m: measures.toString(),
    b: beats.toString(),
    s: subdivisions.toString(),
    bpm: bpm.toString(),
    o: octaves.toString(),
    bo: baseOctave.toString(),
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
  const tileArray = t ? (JSON.parse(atob(t)) as TileKey[]) : undefined;
  const tiles = tileArray?.reduce((acc, tile) => {
    acc.set(tile, true);
    return acc;
  }, new Map<TileKey, boolean>());

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

  const sequencerState: Partial<SequencerState> = {
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
