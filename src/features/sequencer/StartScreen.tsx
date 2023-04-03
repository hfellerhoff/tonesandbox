import { setGain, setSelectedInstrument } from "@shared/instruments";
import { setToneIsReady } from "@shared/isToneStartedStore";
import { FaSolidPlay } from "solid-icons/fa";
import * as Tone from "tone";
import {
  rootNoteAtom,
  scaleAtom,
  showNonDiatonicNotesAtom,
} from "./ScaleSelection";
import {
  setSequencerMeasures,
  setSequencerBeats,
  setSequencerSubdivisions,
  setOctaves,
  setBaseOctave,
  setSelectedTiles,
} from "./state";
import { decodeUrlToSequencerState } from "./urlUtils";
import { setBpm } from "./playback";

export default function StartScreen() {
  const onStart = async () => {
    await Tone.start();

    const state = decodeUrlToSequencerState(window.location.href);
    if (state.bpm) setBpm(state.bpm);
    if (state.measures) setSequencerMeasures(state.measures);
    if (state.beats) setSequencerBeats(state.beats);
    if (state.subdivisions) setSequencerSubdivisions(state.subdivisions);
    if (state.octaves) setOctaves(state.octaves);
    if (state.baseOctave) setBaseOctave(state.baseOctave);
    if (state.rootNote) rootNoteAtom.set(state.rootNote);
    if (state.scale) scaleAtom.set(state.scale);
    if (state.showNonDiatonicNotes)
      showNonDiatonicNotesAtom.set(state.showNonDiatonicNotes);
    if (state.tiles) setSelectedTiles(state.tiles);

    setGain(0.8);
    setSelectedInstrument("soft-synth");
    setToneIsReady();
  };

  return (
    <div class="absolute inset-0 z-50 bg-gray-200 grid place-items-center">
      <button
        onClick={onStart}
        class="p-8 shadow-lg rounded-full bg-gray-100 active:translate-y-0.5 active:shadow"
      >
        <FaSolidPlay size={24} />
      </button>
    </div>
  );
}
