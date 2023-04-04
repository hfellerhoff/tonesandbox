import * as Tone from "tone";
import type { InstrumentTemplate } from "../types";

type SoftTemplate = InstrumentTemplate<Tone.Synth, Tone.SynthOptions>;

const defaultConfig: SoftTemplate["config"] = {
  oscillator: {
    type: "sine",
  },
  envelope: {
    attack: 0.005,
    decay: 0.1,
    sustain: 0.3,
    release: 1,
  },
};

export const SOFT_SYNTH: SoftTemplate = {
  slug: "soft-synth",
  name: "Soft Synth",
  type: "single",
  defaultConfig: { ...defaultConfig },
  config: { ...defaultConfig },
  create: function () {
    const filter = new Tone.Filter({
      frequency: 1100,
      rolloff: -12,
    }).toDestination();

    return new Tone.Synth().connect(filter);
  },
};
