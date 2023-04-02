import * as Tone from "tone";
import { createSampler } from "../createSampler";
import type { InstrumentTemplate } from "../types";

export const PIANO: InstrumentTemplate = {
  name: "Piano",
  slug: "piano",
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
