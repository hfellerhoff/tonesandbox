import type { FMSynth, MonoSynth, Sampler, Synth, SynthOptions } from "tone";
import type { RecursivePartial } from "tone/build/esm/core/util/Interface";

export type AllowedToneMonoInstrument = Synth | FMSynth | MonoSynth;
export type AllowedToneInstrument = (AllowedToneMonoInstrument | Sampler) & {
  getLoadingPercent?: () => number;
};
export interface InstrumentTemplate<O extends object = SynthOptions> {
  slug: string;
  name: string;
  type: "monophonic" | "polyphonic";
  defaultConfig: RecursivePartial<O>;
  config: RecursivePartial<O>;
  create: () => AllowedToneInstrument;
}
