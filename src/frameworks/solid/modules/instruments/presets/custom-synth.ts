import * as Tone from "tone";
import type { InstrumentTemplate } from "../types";

type CustomTemplate = InstrumentTemplate<Tone.SynthOptions>;

const defaultConfig: CustomTemplate["config"] = {};

export const CUSTOM_SYNTH: CustomTemplate = {
  slug: "custom-synth",
  name: "Custom Synth",
  type: "monophonic",
  defaultConfig: { ...defaultConfig },
  config: { ...defaultConfig },
  create: function () {
    return new Tone.Synth(this.config).toDestination();
  },
};
