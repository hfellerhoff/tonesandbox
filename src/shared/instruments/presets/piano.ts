import * as Tone from "tone";
import { createSampler } from "../createSampler";
import type { InstrumentTemplate } from "../types";

type PianoTemplate = InstrumentTemplate<Tone.Sampler, Tone.SamplerOptions>;

// TODO: Get piano config working
const defaultConfig: PianoTemplate["config"] = {
  // attack: 0.005,
  // release: 1,
};

export const PIANO: PianoTemplate = {
  name: "Piano",
  slug: "piano",
  type: "poly",
  defaultConfig: { ...defaultConfig },
  config: { ...defaultConfig },
  create: () =>
    new Tone.Sampler({
      ...createSampler({
        startOctave: 1,
        endOctave: 7,
        baseUrl: "/assets/instruments/piano/",
        notes: [
          {
            label: "C",
            slug: "C",
          },
          {
            label: "F#",
            slug: "Fs",
          },
        ],
      }),
      release: 1,
    }),
};
