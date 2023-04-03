import type { Accessor, Setter } from "solid-js";
import Input from "./Input";
import {
  baseOctave,
  octaves,
  sequencerBeats,
  sequencerMeasures,
  sequencerSubdivisions,
  setBaseOctave,
  setOctaves,
  setSequencerBeats,
  setSequencerMeasures,
  setSequencerSubdivisions,
} from "./state";
import { refreshPlaybackLoop, bpm, setBpm } from "./playback";

type ConfigureNumberInputProps = {
  id: string;
  label: string;
  value: Accessor<number>;
  setValue: Setter<number>;
  onSetValue: () => void;
};

function ConfigureNumberInput(props: ConfigureNumberInputProps) {
  const onChange = (e: any) => {
    const newValue = parseInt(e.target.value);
    if (Number.isSafeInteger(newValue)) {
      props.setValue(newValue);
      props.onSetValue();
    }
  };

  return (
    <div class="flex flex-row gap-2 items-center justify-between max-w-[12rem]">
      <label class="text-gray-500 text-sm" for={props.id}>
        {props.label}
      </label>
      <Input
        type="number"
        id={props.id}
        value={props.value()}
        onBlur={onChange}
        onSubmit={onChange}
        class="text-sm max-w-[6rem] text-right"
      />
    </div>
  );
}

export default function PlaybackAndLengthFloatingConfig() {
  return (
    <div class="flex flex-col gap-2 absolute bg-white py-2 px-4 rounded shadow top-4 right-4">
      <ConfigureNumberInput
        id="base-octave"
        label="Base Octave"
        value={baseOctave}
        setValue={setBaseOctave}
        onSetValue={refreshPlaybackLoop}
      />
      <ConfigureNumberInput
        id="octaves"
        label="Octaves"
        value={octaves}
        setValue={setOctaves}
        onSetValue={refreshPlaybackLoop}
      />
      <ConfigureNumberInput
        id="measures"
        label="Measures"
        value={sequencerMeasures}
        setValue={setSequencerMeasures}
        onSetValue={refreshPlaybackLoop}
      />
      <ConfigureNumberInput
        id="beats"
        label="Beats"
        value={sequencerBeats}
        setValue={setSequencerBeats}
        onSetValue={refreshPlaybackLoop}
      />
      <ConfigureNumberInput
        id="subdivisions"
        label="Subdivisions"
        value={sequencerSubdivisions}
        setValue={setSequencerSubdivisions}
        onSetValue={refreshPlaybackLoop}
      />
      <ConfigureNumberInput
        id="bpm"
        label="BPM"
        value={bpm}
        setValue={setBpm}
        onSetValue={refreshPlaybackLoop}
      />
    </div>
  );
}
