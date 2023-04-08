import * as Tone from "tone";
import type { InstrumentTemplate } from "../types";
import type {
  Frequency,
  NormalRange,
  Time,
} from "tone/build/esm/core/type/Units";
import { createVelocitySampler } from "../utils/createVelocitySampler";

const velocities = new Array<number>(16).fill(1).map((v, i) => v + i);
const velocityToSamplerIndexMap = new Map<number, number>();

const STEP_SIZE = 8;
velocities.forEach((velocity) => {
  const baseVelocity = velocity * STEP_SIZE;

  for (let i = 0; i < STEP_SIZE; i++) {
    velocityToSamplerIndexMap.set(baseVelocity + i, velocity);
  }
});

export class VelocityPiano extends Tone.Sampler {
  private samplers: Tone.Sampler[] = [];

  samplerCount = velocities.length;
  samplersLoaded = 0;

  constructor() {
    super();

    velocities.map((velocity) => {
      const sampler = createVelocitySampler(velocity, () => {
        this.samplersLoaded++;
      });

      sampler.toDestination();
      this.samplers.push(sampler);
    });
  }

  public getLoadingPercent() {
    return Math.round((this.samplersLoaded / this.samplerCount) * 100);
  }

  private getSampler(velocity: number) {
    const samplerIndex = velocityToSamplerIndexMap.get(velocity);

    if (samplerIndex === undefined) return null;
    return this.samplers[samplerIndex];
  }

  override triggerAttack(
    notes: Frequency | Frequency[],
    time: Time,
    velocity: NormalRange
  ): this {
    const sampler = this.getSampler(velocity * 127);

    if (sampler) {
      sampler.triggerAttack(notes, time, velocity);
    }

    return this;
  }

  override triggerRelease(notes: Frequency | Frequency[], time: Time): this {
    this.samplers.forEach((sampler) => {
      sampler.triggerRelease(notes, time);
    });

    return this;
  }

  override toDestination(): this {
    this.samplers.forEach((sampler) => {
      sampler.toDestination();
    });

    return this;
  }

  override connect(
    destination: Tone.InputNode,
    outputNum?: number,
    inputNum?: number
  ): this {
    this.samplers.forEach((sampler) => {
      sampler.connect(destination, outputNum, inputNum);
    });

    return this;
  }

  override disconnect(
    destination?: Tone.InputNode,
    outputNum?: number,
    inputNum?: number
  ): this {
    this.samplers.forEach((sampler) => {
      sampler.disconnect(destination, outputNum, inputNum);
    });

    return this;
  }
}

type PianoTemplate = InstrumentTemplate<Tone.SamplerOptions>;

const defaultConfig: PianoTemplate["config"] = {};

export const VELOCITY_PIANO: PianoTemplate = {
  name: "Velocity Piano",
  slug: "velocity-piano",
  type: "polyphonic",
  defaultConfig: { ...defaultConfig },
  config: { ...defaultConfig },
  create: () => new VelocityPiano(),
};
