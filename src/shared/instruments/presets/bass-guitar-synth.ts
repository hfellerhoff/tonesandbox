import * as Tone from "tone";
import type { InstrumentTemplate } from "../types";

type BassGuitarTemplate = InstrumentTemplate<
  Tone.MonoSynth,
  Tone.MonoSynthOptions
>;

// http://tonejs.github.io/Presets/
const defaultConfig: BassGuitarTemplate["config"] = {
  oscillator: {
    type: "fmsquare5",
    modulationType: "triangle",
    modulationIndex: 2,
    harmonicity: 0.501,
  },
  filter: {
    Q: 1,
    type: "lowpass",
    rolloff: -24,
  },
  envelope: {
    attack: 0.01,
    decay: 0.1,
    sustain: 0.4,
    release: 2,
  },
  filterEnvelope: {
    attack: 0.01,
    decay: 0.1,
    sustain: 0.8,
    release: 1.5,
    baseFrequency: 50,
    octaves: 4.4,
  },
};

export const BASS_GUITAR_SYNTH: BassGuitarTemplate = {
  slug: "bass-guitar-synth",
  name: "Bass Guitar Synth",
  type: "single",
  defaultConfig: { ...defaultConfig },
  config: { ...defaultConfig },
  create: function () {
    return new Tone.MonoSynth(this.config).toDestination();
  },
};
