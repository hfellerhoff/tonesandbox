import { useCallback, useEffect, useState } from "preact/hooks";
import { Scale, Note } from "theory.js";
import * as Tone from "tone";

import { useStore } from "@nanostores/preact";
import {
  clearMidiMessage,
  MIDIMessage,
  midiMessagesStore,
} from "../../shared/midiStore";
import {
  instrumentsAtom,
  selectedInstrumentAtom,
  setGain,
} from "@shared/instruments";
import { setSelectedInstrument } from "@shared/instruments";

const useHandlePlayback = () => {
  const $midiMessages = useStore(midiMessagesStore);
  const $instruments = useStore(instrumentsAtom);
  const $selectedInstrument = useStore(selectedInstrumentAtom);
  const [activeNotes, setActiveNotes] = useState<Record<string, boolean>>({});
  const [sustainedNotes, setSustainedNotes] = useState<Record<string, boolean>>(
    {}
  );
  const [isSustained, setIsSustained] = useState(false);

  useEffect(() => {
    if ($instruments.length === 0) {
      return;
    }

    if (!$selectedInstrument) {
      setGain(1);
      setSelectedInstrument("piano");
    }
  }, [$instruments, $selectedInstrument]);

  const onMessage = useCallback(
    (message: MIDIMessage) => {
      if ($selectedInstrument) {
        const type = message[0];
        const note = new Scale(new Note(message[1]), []).getStringArray()[0];
        const velocity = message[2] / 127;

        const instrument = $selectedInstrument;

        switch (type) {
          // Note On
          case 144:
            instrument.triggerAttack(note, Tone.immediate(), velocity);
            activeNotes[note] = true;
            if (isSustained) sustainedNotes[note] = true;
            break;
          // Note Off
          case 128:
            if (!sustainedNotes[note]) {
              instrument.triggerRelease(note, Tone.immediate());
            }
            activeNotes[note] = false;
            break;
          // Sustain
          case 176:
            if (message[2] === 127) {
              setIsSustained(true);
              setSustainedNotes({ ...activeNotes });
            } else {
              Object.entries(sustainedNotes).forEach(([n, isPlaying]) => {
                if (isPlaying && !activeNotes[n]) {
                  instrument.triggerRelease(n, Tone.immediate());
                }
                sustainedNotes[n] = false;
              });
              setIsSustained(false);
            }
          default:
            break;
        }

        clearMidiMessage(message);
      }
    },
    [activeNotes, $selectedInstrument, isSustained, sustainedNotes]
  );

  useEffect(() => {
    if ($midiMessages.length > 0) {
      $midiMessages.forEach((message) => onMessage(message));
    }
  }, [$midiMessages, onMessage]);

  return { activeNotes, sustainedNotes };
};

export default useHandlePlayback;
