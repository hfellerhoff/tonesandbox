import type { Sampler, Synth } from "tone";

export interface InstrumentTemplate {
  slug: string;
  name: string;
  type: "single" | "poly";
  create: () => Sampler | Synth;
}
