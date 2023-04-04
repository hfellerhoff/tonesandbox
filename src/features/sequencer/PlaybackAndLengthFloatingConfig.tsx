import { Accessor, Setter, Show, createSignal } from "solid-js";
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
  setZoom,
  zoom,
} from "./state";
import {
  refreshPlaybackLoop,
  bpm,
  setBpm,
  setVelocity,
  velocity,
} from "./playback";
import { VsSettings } from "solid-icons/vs";

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
        min={props.min}
        max={props.max}
      />
    </div>
  );
}

export default function PlaybackAndLengthFloatingConfig() {
  const [isExpanded, setIsExpanded] = createSignal(false);

  return (
    <Show
      when={isExpanded()}
      fallback={
        <button
          class="p-4 absolute bg-white rounded shadow top-4 right-4"
          onClick={() => setIsExpanded(true)}
        >
          <VsSettings />
        </button>
      }
    >
      <div class="flex flex-col gap-2 absolute bg-white p-4 rounded shadow top-4 right-4 w-56 z-20">
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
        <div class="flex flex-row gap-2 items-center justify-between">
          <label class="text-gray-500 text-sm" for="velocity">
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
        <div class="flex flex-row gap-2 items-center justify-between">
          <label class="text-gray-500 text-sm" for="zoom">
            Zoom
          </label>
          <input
            type="range"
            id="zoom"
            value={zoom()}
            min={0.2}
            max={1.8}
            step={0.1}
            onChange={(e) => {
              setZoom(parseFloat(e.target.value));
            }}
          />
        </div>
        <button
          class="py-1 px-2 bg-gray-100 rounded"
          onClick={() => setIsExpanded(false)}
        >
          Close
        </button>
      </div>
    </Show>
  );
}
