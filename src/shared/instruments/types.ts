import type { FMSynth, MonoSynth, Sampler, Synth, SynthOptions } from "tone";
import type { RecursivePartial } from "tone/build/esm/core/util/Interface";

export type AllowedToneMonoInstrument = Synth | FMSynth | MonoSynth;
export type AllowedToneInstrument = AllowedToneMonoInstrument | Sampler;
export interface InstrumentTemplate<
  T extends AllowedToneInstrument = Synth,
  O extends object = SynthOptions
> {
  slug: string;
  name: string;
  type: "single" | "poly";
  defaultConfig: RecursivePartial<O>;
  config: RecursivePartial<O>;
  create: () => AllowedToneInstrument;
}
