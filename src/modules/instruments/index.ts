import { action, atom, computed } from "nanostores";
import * as Tone from "tone";
import { PIANO } from "./presets/piano";
import { SAWTOOTH_SYNTH } from "./presets/sawtooth-synth";
import { SOFT_SYNTH } from "./presets/soft-synth";
import type {
  AllowedToneInstrument,
  AllowedToneMonoInstrument,
  InstrumentTemplate,
} from "./types";
import { KALIMBA_SYNTH } from "./presets/kalimba-synth";
import { BASS_GUITAR_SYNTH } from "./presets/bass-guitar-synth";
import { VELOCITY_PIANO } from "./presets/velocity-piano";
import { setLoadingPercent } from "@shared/isLoadingStore";

export const INSTRUMENT_PRESETS = [
  SOFT_SYNTH,
  SAWTOOTH_SYNTH,
  KALIMBA_SYNTH,
  BASS_GUITAR_SYNTH,
  PIANO,
  VELOCITY_PIANO,
] as const;
export type InstrumentSlug = (typeof INSTRUMENT_PRESETS)[number]["slug"];

type InstrumentAPI = Tone.PolySynth | Tone.Sampler;

const POLYPHONIC_SYNTH_KEY = "_";

const isVoiceMonophonic = (
  voice: AllowedToneInstrument,
  instrumentTemplate: InstrumentTemplate
): voice is AllowedToneMonoInstrument => {
  return instrumentTemplate.type === "monophonic";
};

export interface Instrument {
  slug: string;
  name: string;
  template: InstrumentTemplate;
  voices: Map<Tone.Unit.Frequency, AllowedToneInstrument>;
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

export const instrumentsAtom = atom<InstrumentTemplate[]>([]);
export const setInstruments = action(
  instrumentsAtom,
  "setInstruments",
  (previousInstrumentsAtom, instruments: InstrumentSlug[]) => {
    const instrumentTemplates = INSTRUMENT_PRESETS.filter((instrument) =>
      instruments.includes(instrument.slug)
    );
    previousInstrumentsAtom.set(instrumentTemplates);
  }
);
export const selectedInstrumentAtom = atom<Instrument | null>(null);

const getOrCreateVoice = (
  voices: Instrument["voices"],
  note: Tone.Unit.Frequency,
  instrumentTemplate: InstrumentTemplate
) => {
  if (instrumentTemplate.type === "polyphonic") {
    return voices.get(POLYPHONIC_SYNTH_KEY)!;
  }

  let voice = voices.get(note);
  if (!voice) {
    voice = instrumentTemplate.create();
    voices.set(note, voice);
  }

  return voice;
};

export const resetInstrumentConfig = action(
  selectedInstrumentAtom,
  "resetInstrumentConfig",
  (previousInstrumentStore) => {
    const previousInstrument = previousInstrumentStore.get();
    if (!previousInstrument) return null;

    const instrumentTemplate = instrumentsAtom
      .get()
      .find((instrument) => instrument.slug === previousInstrument.slug);
    if (!instrumentTemplate) return null;

    instrumentTemplate.config = { ...instrumentTemplate.defaultConfig };

    previousInstrument.disconnect();
    previousInstrument.voices.clear();
    previousInstrument.toDestination();

    return previousInstrument;
  }
);

export const updateSelectedInstrumentConfig = action(
  selectedInstrumentAtom,
  "setSelectedInstrumentConfig",
  (previousInstrumentStore) => {
    const previousInstrument = previousInstrumentStore.get();
    if (!previousInstrument) return null;

    previousInstrument.disconnect();
    previousInstrument.voices.clear();
    previousInstrument.toDestination();

    if (previousInstrument.template.type === "polyphonic") {
      previousInstrument.voices.set(
        POLYPHONIC_SYNTH_KEY,
        previousInstrument.template.create()
      );
    }

    return previousInstrument;
  }
);

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

    const voices = new Map<Tone.Unit.Frequency, AllowedToneInstrument>();

    if (instrumentTemplate.type === "polyphonic") {
      const voice = instrumentTemplate.create();
      voices.set(POLYPHONIC_SYNTH_KEY, voice);
      if (!!voice?.getLoadingPercent) {
        setLoadingPercent(0);
      }

      const interval = setInterval(() => {
        if (!voice?.getLoadingPercent) return;

        const percent = voice.getLoadingPercent();
        setLoadingPercent(percent);

        if (percent === 100) {
          clearInterval(interval);
        }
      }, 100);
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
            if (isVoiceMonophonic(voice, instrumentTemplate)) {
              voice.triggerRelease(time);
            } else {
              voice.triggerRelease(note, time);
            }
          });
        } else {
          const voice = getOrCreateVoice(voices, notes, instrumentTemplate);
          if (isVoiceMonophonic(voice, instrumentTemplate)) {
            voice.triggerRelease(time);
          } else {
            voice.triggerRelease(notes, time);
          }
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
          if (isVoiceMonophonic(voice, instrumentTemplate)) {
            voice.triggerRelease(time);
          } else {
            voice.releaseAll(time);
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
