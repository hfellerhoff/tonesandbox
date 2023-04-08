import * as Tone from "tone";
import type { InstrumentTemplate } from "../types";

type KalimbaTemplate = InstrumentTemplate<Tone.FMSynthOptions>;

// http://tonejs.github.io/Presets/
const defaultConfig: KalimbaTemplate["config"] = {
  harmonicity: 8,
  modulationIndex: 2,
  oscillator: {
    type: "sine",
  },
  envelope: {
    attack: 0.001,
    decay: 2,
    sustain: 0.1,
    release: 2,
  },
  modulation: {
    type: "square",
  },
  modulationEnvelope: {
    attack: 0.002,
    decay: 0.2,
    sustain: 0,
    release: 0.2,
  },
};

export const KALIMBA_SYNTH: KalimbaTemplate = {
  slug: "kalimba-synth",
  name: "Kalimba Synth",
  type: "monophonic",
  defaultConfig: { ...defaultConfig },
  config: { ...defaultConfig },
  create: function () {
    return new Tone.FMSynth(this.config).toDestination();
  },
};
