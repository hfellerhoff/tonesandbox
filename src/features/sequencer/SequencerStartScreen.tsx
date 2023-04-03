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
import type { ParentProps } from "solid-js";
import ToneFeatureWrapper from "@components/ToneFeatureWrapper";

export default function SequencerWrapper(props: ParentProps) {
  const onStart = () => {
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
  };

  return (
    <ToneFeatureWrapper onStart={onStart}>{props.children}</ToneFeatureWrapper>
  );
}
