import * as Tone from 'tone';
import { atom } from 'nanostores';

interface Instrument {
  slug: string;
  name: string;
  instrument: Tone.Sampler;
}

type PianoNoteInformation = {
  label: string;
  slug: string;
};

const createSampler = (
  baseUrl: string,
  notes: PianoNoteInformation[],
  startOctave: number,
  endOctave: number
): {
  urls: Record<string, string>;
  baseUrl: string;
} => {
  let pianoNotes: {
    label: string;
    filename: string;
  }[] = [];

  for (let o = startOctave; o <= endOctave; o++) {
    notes.forEach((note) =>
      pianoNotes.push({
        label: `${note.label}${o}`,
        filename: `${note.slug}${o}`,
      })
    );
  }

  return {
    urls: pianoNotes.reduce((acc, cur) => {
      acc[cur.label] = `${cur.filename}.ogg`;
      return acc;
    }, {} as Record<string, string>),
    baseUrl,
  };
};

export const instrumentStore = atom<Instrument[]>([]);

export const selectedInstrumentStore = atom<Instrument | undefined>();

export const initializeInstrumentStore = () => {
  if (instrumentStore.get().length > 0) return;

  instrumentStore.set([
    {
      name: 'Piano',
      slug: 'piano',
      instrument: new Tone.Sampler({
        ...createSampler(
          '/assets/instruments/piano/',
          [
            {
              label: 'C',
              slug: 'C',
            },
            {
              label: 'F#',
              slug: 'Fs',
            },
          ],
          1,
          7
        ),
        release: 1,
      }),
    },
  ]);
};
