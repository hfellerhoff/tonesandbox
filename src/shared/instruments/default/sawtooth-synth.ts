import * as Tone from "tone";
import type { InstrumentTemplate } from "../types";

export const SAWTOOTH_SYNTH: InstrumentTemplate = {
  slug: "sawtooth-synth",
  name: "Sawtooth Synth",
  type: "single",
  create: () => {
    const filter = new Tone.Filter({
      frequency: 1100,
      rolloff: -12,
    }).toDestination();

    const synth = new Tone.Synth({
      oscillator: {
        type: "sawtooth",
      },
      envelope: {
        attack: 0.005,
        decay: 0.1,
        sustain: 0.3,
        release: 2,
      },
    }).connect(filter);

    return synth;
  },
};
