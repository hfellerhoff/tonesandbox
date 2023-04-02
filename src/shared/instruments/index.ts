import { action, atom, computed } from "nanostores";
import * as Tone from "tone";
import { PIANO } from "./default/piano";
import { SAWTOOTH_SYNTH } from "./default/sawtooth-synth";
import { SOFT_SYNTH } from "./default/soft-synth";
import type { InstrumentTemplate } from "./types";

export interface Instrument {
  slug: string;
  name: string;
  instrument: Tone.Sampler | Tone.PolySynth;
}

export const instrumentsAtom = atom<InstrumentTemplate[]>([
  SOFT_SYNTH,
  SAWTOOTH_SYNTH,
  PIANO,
]);

export const selectedInstrumentAtom = atom<Instrument | null>(null);
export const setSelectedInstrument = action(
  selectedInstrumentAtom,
  "setSelectedInstrument",
  (previousInstrumentStore, slug: string) => {
    const previousInstrument = previousInstrumentStore.get();
    if (previousInstrument) {
      previousInstrument.instrument.disconnect();
    }
    selectedInstrumentAtom.set(null);

    const instrumentTemplate = instrumentsAtom
      .get()
      .find((instrument) => instrument.slug === slug);
    if (!instrumentTemplate) return null;

    const newInstrument = {
      name: instrumentTemplate.name,
      slug: instrumentTemplate.slug,
      instrument: instrumentTemplate.create(),
    };

    const toneGain = toneGainAtom.get();
    if (toneGain) {
      newInstrument.instrument.connect(toneGain);
    }

    newInstrument.instrument.volume.value = -20;
    selectedInstrumentAtom.set(newInstrument);
  }
);
export const selectedInstrumentSlugAtom = computed(
  selectedInstrumentAtom,
  (instrument) => instrument?.slug || ""
);

const toneGainAtom = atom<Tone.Gain | null>(null);
export const gainAtom = computed(
  toneGainAtom,
  (toneGain) => toneGain?.gain.value || 0
);
export const setGain = action(
  toneGainAtom,
  "setGain",
  (toneGainStore, gain: number) => {
    const toneGain = toneGainStore.get();

    if (toneGain) {
      toneGain.gain.value = gain;
    } else {
      const newToneGain = new Tone.Gain(gain).toDestination();
      selectedInstrumentAtom.get()?.instrument.connect(newToneGain);
      toneGainAtom.set(newToneGain);
    }
  }
);
