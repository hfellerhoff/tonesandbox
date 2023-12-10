import * as Tone from "tone";
import type { InstrumentTemplate } from "../types";

type SawtoothTemplate = InstrumentTemplate<Tone.FMSynthOptions>;

const defaultConfig: SawtoothTemplate["config"] = {
  oscillator: {
    type: "sawtooth",
  },
  envelope: {
    attack: 0.005,
    decay: 0.1,
    sustain: 0.3,
    release: 2,
  },
};

export const SAWTOOTH_SYNTH: SawtoothTemplate = {
  slug: "sawtooth-synth",
  name: "Sawtooth Synth",
  type: "monophonic",
  defaultConfig: { ...defaultConfig },
  config: { ...defaultConfig },
  create: function () {
    const filter = new Tone.Filter({
      frequency: 1100,
      rolloff: -12,
    }).toDestination();

    return new Tone.Synth(this.config).connect(filter);
  },
};
