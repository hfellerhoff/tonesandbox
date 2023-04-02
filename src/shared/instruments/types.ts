import type { Sampler, PolySynth } from "tone";

export interface InstrumentTemplate {
  slug: string;
  name: string;
  create: () => Sampler | PolySynth;
}
