import type { SamplerOptions } from "tone";
import type { InstrumentTemplate } from "../types";
import { createVelocitySampler } from "../utils/createVelocitySampler";

type PianoTemplate = InstrumentTemplate<SamplerOptions>;

// TODO: Get piano config working
const defaultConfig: PianoTemplate["config"] = {
  // attack: 0.005,
  // release: 1,
};

export const PIANO: PianoTemplate = {
  name: "Piano",
  slug: "piano",
  type: "polyphonic",
  defaultConfig: { ...defaultConfig },
  config: { ...defaultConfig },
  create: () => createVelocitySampler(8),
};
