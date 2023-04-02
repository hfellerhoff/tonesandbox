import * as Tone from "tone";
import type { InstrumentTemplate } from "../types";

export const SOFT_SYNTH: InstrumentTemplate = {
  slug: "soft-synth",
  name: "Soft Synth",
  create: () => {
    const filter = new Tone.Filter({
      frequency: 1100,
      rolloff: -12,
    }).toDestination();

    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: "sine",
      },
      envelope: {
        attack: 0.005,
        decay: 0.1,
        sustain: 0.3,
        release: 1,
      },
    }).connect(filter);

    return synth;
  },
};
