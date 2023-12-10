import * as Tone from "tone";
import type { InstrumentTemplate } from "../types";

type RetroTemplate = InstrumentTemplate<Tone.SynthOptions>;

const defaultConfig: RetroTemplate["config"] = {
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

export const RETRO_SYNTH: RetroTemplate = {
  slug: "retro-synth",
  name: "Retro Synth",
  type: "monophonic",
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
