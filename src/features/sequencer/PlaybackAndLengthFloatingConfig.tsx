import FloatingModuleWrapper from "@modules/FloatingModuleWrapper";
import { VsSettings } from "solid-icons/vs";
import {
  bpm,
  refreshPlaybackLoop,
  setBpm,
  setVelocity,
  velocity,
} from "./playback";
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
  setZoom,
  zoom,
} from "./state";
import type { Accessor, Setter } from "solid-js";
import Input from "@components/Input";

type ConfigureNumberInputProps = {
  id: string;
  label: string;
  value: Accessor<number>;
  setValue: Setter<number>;
  onSetValue: () => void;
  min?: number;
  max?: number;
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
    <div class="flex flex-row gap-2 items-center justify-between">
      <label
        class="block text-sm font-medium text-gray-500 dark:text-gray-400"
        for={props.id}
      >
        {props.label}
      </label>
      <Input
        type="number"
        id={props.id}
        value={props.value()}
        onBlur={onChange}
        onSubmit={onChange}
        class="text-right max-w-[5rem]"
        min={props.min}
        max={props.max}
      />
    </div>
  );
}

export default function PlaybackAndLengthFloatingConfig() {
  return (
    <FloatingModuleWrapper icon={<VsSettings />} position="top-right">
      <ConfigureNumberInput
        id="base-octave"
        label="Base Octave"
        value={baseOctave}
        setValue={setBaseOctave}
        onSetValue={refreshPlaybackLoop}
        min={0}
        max={8}
      />
      <ConfigureNumberInput
        id="octaves"
        label="Octaves"
        value={octaves}
        setValue={setOctaves}
        onSetValue={refreshPlaybackLoop}
        min={1}
        max={8}
      />
      <ConfigureNumberInput
        id="measures"
        label="Measures"
        value={sequencerMeasures}
        setValue={setSequencerMeasures}
        onSetValue={refreshPlaybackLoop}
        min={1}
        max={128}
      />
      <ConfigureNumberInput
        id="beats"
        label="Beats"
        value={sequencerBeats}
        setValue={setSequencerBeats}
        onSetValue={refreshPlaybackLoop}
        min={1}
        max={128}
      />
      <ConfigureNumberInput
        id="subdivisions"
        label="Subdivisions"
        value={sequencerSubdivisions}
        setValue={setSequencerSubdivisions}
        onSetValue={refreshPlaybackLoop}
        min={1}
        max={128}
      />
      <ConfigureNumberInput
        id="bpm"
        label="BPM"
        value={bpm}
        setValue={setBpm}
        onSetValue={refreshPlaybackLoop}
        min={1}
      />
      <div class="flex flex-row gap-2 items-center justify-between mt-2">
        <label
          class="block text-sm font-medium text-gray-500 dark:text-gray-400"
          for="velocity"
        >
          Velocity
        </label>
        <input
          type="range"
          id="velocity"
          value={velocity()}
          min={0}
          max={1}
          step={0.01}
          onChange={(e) => {
            setVelocity(parseFloat(e.target.value));
            refreshPlaybackLoop();
          }}
        />
      </div>
      <div class="flex flex-row gap-2 items-center justify-between mt-2">
        <label
          class="block text-sm font-medium text-gray-500 dark:text-gray-400"
          for="zoom"
        >
          Zoom
        </label>
        <input
          type="range"
          id="zoom"
          value={zoom()}
          min={0.1}
          max={1}
          step={0.1}
          onChange={(e) => {
            setZoom(parseFloat(e.target.value));
          }}
        />
      </div>
    </FloatingModuleWrapper>
  );
}
