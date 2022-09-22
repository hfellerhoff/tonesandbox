import clsx from 'clsx';
import { useEffect, useState } from 'preact/hooks';
import { Note, Scale } from 'theory.js';
import { MIDIMessage, queueMidiMessage } from '../shared/midiStore';

export type MIDIInput = {
  connection: string;
  id: string;
  manufacturer: string;
  name: string;
  onmidimessage: null | ((message: MIDIMessageEvent) => void);
  onstatechange: null | (() => void);
  state: string;
  type: string;
  version: string;
};

export type MIDIMessageEvent = {
  data: [number, number, number];
};

export type MIDIStatus = 'not-connected' | 'not-supported' | 'connected';

interface Props {}

const ExternalMIDIManager = ({}: Props) => {
  const [isLoading, setIsLoading] = useState(true);

  const [inputs, setInputs] = useState<MIDIInput[]>([]);
  const [inputID, setInputID] = useState('0');
  const [doesSupportMIDI, setDoesSupportMIDI] = useState(true);

  useEffect(() => {
    const updateInputs = (access: any) => {
      // Get lists of available MIDI controllers
      const inputIterator = access.inputs.values();

      let input = inputIterator.next();

      const currentInputs = [];
      while (input.value) {
        currentInputs.push(input.value);
        input = inputIterator.next;
      }
      setInputs(currentInputs);

      if (currentInputs.length > 0) {
        setInputID(currentInputs[0].id);
      }
    };

    const doesSupportMIDI = (navigator as any).requestMIDIAccess;
    if (doesSupportMIDI) {
      (navigator as any).requestMIDIAccess().then(function (access: any) {
        updateInputs(access);

        access.onstatechange = function (e: any) {
          setIsLoading(true);
          updateInputs(access);
          setIsLoading(false);
        };
      });
    } else {
      setDoesSupportMIDI(false);
    }

    setIsLoading(false);
  }, [inputID]);

  useEffect(() => {
    if (inputs.length > 0) {
      if (!inputs[0].onmidimessage) {
        inputs[0].onmidimessage = (rawMessage: any) => {
          const message = Array.from(rawMessage.data) as MIDIMessage;

          queueMidiMessage(message);
        };
      }
    }

    return () => {
      inputs.forEach((input) => (input.onmidimessage = null));
    };
  }, [queueMidiMessage, inputs]);

  const status: MIDIStatus = doesSupportMIDI
    ? inputs.length === 0 || isLoading
      ? 'not-connected'
      : 'connected'
    : 'not-supported';

  return (
    <div className='flex items-center justify-between'>
      {status === 'connected' ? (
        <div>
          <p>{inputs[0].name}</p>
          {/* <Select>
            {inputs.map((input) => (
              <option key={input.id} value={input.id}>
                {input.name}
              </option>
            ))}
          </Select> */}
        </div>
      ) : status === 'not-supported' ? (
        // <Tooltip content='To connect to a MIDI controller, use Chrome, Opera, or Edge.'>
        //   MIDI Not Supported
        // </Tooltip>
        <></>
      ) : (
        <></>
      )}
      <div
        className={clsx('ml-2 w-3 h-3 rounded-full', {
          'bg-green-600': status === 'connected',
          'bg-orange-600': status === 'not-connected',
          'bg-red-600': status === 'not-supported',
        })}
      />
    </div>
  );
};

export default ExternalMIDIManager;
