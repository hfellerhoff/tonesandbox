import { atom } from 'nanostores';
import type * as Tone from 'tone';

type MicrophoneStatus = 'loading' | 'disconnected' | 'connected';
type MicrophoneStore = {
  status: MicrophoneStatus;
  microphone?: Tone.UserMedia;
  meter?: Tone.Meter;
};

export const microphoneStore = atom<MicrophoneStore>({
  status: 'loading',
  microphone: undefined,
  meter: undefined,
});

export const setMicrophoneStatus = (status: MicrophoneStatus) => {
  microphoneStore.set({ ...microphoneStore.get(), status });
};
