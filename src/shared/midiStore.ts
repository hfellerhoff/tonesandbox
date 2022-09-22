import { atom } from 'nanostores';
import { Note, Scale } from 'theory.js';

export type MIDIMessage = [instruction: number, note: number, velocity: number];

export const midiMessagesStore = atom<MIDIMessage[]>([]);

export const clearMidiMessage = (message: MIDIMessage) =>
  midiMessagesStore.set(
    midiMessagesStore.get().filter((storeMessage) => storeMessage !== message)
  );

export const queueMidiMessage = (message: MIDIMessage) => {
  midiMessagesStore.set([...midiMessagesStore.get(), message]);
};
