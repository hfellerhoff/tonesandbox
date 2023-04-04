import { action, atom, computed } from "nanostores";
import * as Tone from "tone";
import { PIANO } from "./default/piano";
import { SAWTOOTH_SYNTH } from "./default/sawtooth-synth";
import { SOFT_SYNTH } from "./default/soft-synth";
import type { InstrumentTemplate } from "./types";

type AllowedToneInstruments = Tone.Synth | Tone.Sampler;
type InstrumentAPI = Tone.PolySynth | Tone.Sampler;

const POLYPHONIC_SYNTH_KEY = "_";

export interface Instrument {
  slug: string;
  name: string;
  template: InstrumentTemplate;
  voices: Map<Tone.Unit.Frequency, AllowedToneInstruments>;
  triggerAttack: (...args: Parameters<InstrumentAPI["triggerAttack"]>) => void;
  triggerRelease: (
    ...args: Parameters<InstrumentAPI["triggerRelease"]>
  ) => void;
  triggerAttackRelease: (
    ...args: Parameters<InstrumentAPI["triggerAttackRelease"]>
  ) => void;
  releaseAll: (...args: Parameters<InstrumentAPI["releaseAll"]>) => void;
  disconnect: (...args: Parameters<InstrumentAPI["disconnect"]>) => void;
  connect: (...args: Parameters<InstrumentAPI["connect"]>) => void;
  volume: {
    _value: number;
    set: (value: number) => void;
    get: () => number;
  };
  toDestination: (...args: Parameters<InstrumentAPI["toDestination"]>) => void;
}

export const instrumentsAtom = atom<InstrumentTemplate[]>([
  SOFT_SYNTH,
  SAWTOOTH_SYNTH,
  PIANO,
]);

export const selectedInstrumentAtom = atom<Instrument | null>(null);

const getOrCreateVoice = (
  voices: Instrument["voices"],
  note: Tone.Unit.Frequency,
  instrumentTemplate: InstrumentTemplate
) => {
  if (instrumentTemplate.type === "poly") {
    return voices.get(POLYPHONIC_SYNTH_KEY)!;
  }

  let voice = voices.get(note);
  if (!voice) {
    voice = instrumentTemplate.create();
    voices.set(note, voice);
  }
  return voice;
};

export const setSelectedInstrument = action(
  selectedInstrumentAtom,
  "setSelectedInstrument",
  (previousInstrumentStore, slug: string) => {
    const previousInstrument = previousInstrumentStore.get();
    if (previousInstrument) {
      previousInstrument.disconnect();
    }
    selectedInstrumentAtom.set(null);

    const instrumentTemplate = instrumentsAtom
      .get()
      .find((instrument) => instrument.slug === slug);
    if (!instrumentTemplate) return null;

    const voices = new Map<Tone.Unit.Frequency, AllowedToneInstruments>();

    if (instrumentTemplate.type === "poly") {
      voices.set(POLYPHONIC_SYNTH_KEY, instrumentTemplate.create());
    }

    const newInstrument: Instrument = {
      voices,
      name: instrumentTemplate.name,
      slug: instrumentTemplate.slug,
      template: instrumentTemplate,
      triggerAttack: (notes, time = undefined, velocity = undefined) => {
        if (Array.isArray(notes)) {
          notes.forEach((note) => {
            const voice = getOrCreateVoice(voices, note, instrumentTemplate);
            voice.triggerAttack(note, time, velocity);
          });
        } else {
          const voice = getOrCreateVoice(voices, notes, instrumentTemplate);
          voice.triggerAttack(notes, time, velocity);
        }
      },
      triggerRelease: (notes, time = undefined) => {
        if (Array.isArray(notes)) {
          notes.forEach((note) => {
            const voice = getOrCreateVoice(voices, note, instrumentTemplate);
            voice.triggerRelease(note, time);
          });
        } else {
          const voice = getOrCreateVoice(voices, notes, instrumentTemplate);
          voice.triggerAttack(notes, time);
        }
      },
      triggerAttackRelease: (
        notes,
        duration,
        time = undefined,
        velocity = undefined
      ) => {
        if (Array.isArray(notes)) {
          notes.forEach((note) => {
            const voice = getOrCreateVoice(voices, note, instrumentTemplate);
            if (!Array.isArray(duration)) {
              voice.triggerAttackRelease(note, duration, time, velocity);
            } else {
              voice.triggerAttackRelease(
                note,
                duration[notes.indexOf(note)],
                time,
                velocity
              );
            }
          });
        } else {
          const voice = getOrCreateVoice(voices, notes, instrumentTemplate);
          if (!Array.isArray(duration)) {
            voice.triggerAttackRelease(notes, duration, time, velocity);
          }
        }
      },
      releaseAll: (time = undefined) => {
        voices.forEach((voice) => {
          if ("releaseAll" in voice) {
            voice.releaseAll(time);
          } else {
            voice.triggerRelease(time);
          }
        });
      },
      disconnect: () => {
        voices.forEach((voice) => {
          voice.disconnect();
        });
      },
      connect: (destination) => {
        voices.forEach((voice) => {
          voice.connect(destination);
        });
      },
      volume: {
        _value: -20,
        set: (value) => {
          voices.forEach((voice) => {
            voice.volume.value = value;
          });
        },
        get() {
          return this._value;
        },
      },
      toDestination: () => {
        voices.forEach((voice) => {
          voice.toDestination();
        });
      },
    };

    // const toneGain = toneGainAtom.get();
    // if (toneGain) {
    //   newInstrument.connect(toneGain);
    // }

    newInstrument.volume.set(-20);
    newInstrument.toDestination();

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
      // selectedInstrumentAtom.get()?.connect(newToneGain);
      toneGainAtom.set(newToneGain);
    }
  }
);
