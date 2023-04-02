import InstrumentManager from "@components/InstrumentManager";
import { useStore } from "@nanostores/solid";
import {
  selectedInstrumentAtom,
  setGain,
  setSelectedInstrument,
} from "@shared/instruments";
import { isToneStartedStore, setToneIsReady } from "@shared/isToneStartedStore";
import copyToClipboard from "@shared/utils/copyToClipboard";
import { FaSolidPlay } from "solid-icons/fa";
import clsx from "clsx";
import {
  Accessor,
  For,
  Setter,
  Show,
  createMemo,
  createSignal,
} from "solid-js";
import * as Tone from "tone";
import Button from "./Button";
import Input from "./Input";
import ScaleSelection, {
  ALL_NOTES,
  rootNoteAtom,
  scaleAtom,
  showNonDiatonicNotesAtom,
} from "./ScaleSelection";
import { decodeUrlToSequencerState, encodeSequencerToUrl } from "./urlUtils";

const [sequencerMeasures, setSequencerMeasures] = createSignal(1);
const [sequencerBeats, setSequencerBeats] = createSignal(4);
const [sequencerSubdivisions, setSequencerSubdivisions] = createSignal(4);

const [bpm, setBpm] = createSignal(120);
const [playbackLoop, setPlaybackLoop] = createSignal<number>(0);

type PlaybackLocation = [number, number, number];
const [playbackLocation, setPlaybackLocation] = createSignal<PlaybackLocation>([
  -1, -1, -1,
]);

const [octaves, setOctaves] = createSignal(2);
const [baseOctave, setBaseOctave] = createSignal(4);

type SequencerNote = {
  note: string;
  label: string;
  isDiatonic: boolean;
  isRootNote: boolean;
};

const [isMouseDown, setIsMouseDown] = createSignal(false);
const [mouseInteractionIntent, setMouseInteractionIntent] = createSignal<
  "select" | "deselect"
>("select");

type TileKey = `${string}-${number}-${number}-${number}`;
const [selectedTiles, setSelectedTiles] = createSignal(
  new Map<TileKey, boolean>(),
  { equals: false }
);

function StartScreen() {
  const onStart = async () => {
    await Tone.start();

    const state = decodeUrlToSequencerState(window.location.href);
    if (state.bpm) setBpm(state.bpm);
    if (state.measures) setSequencerMeasures(state.measures);
    if (state.beats) setSequencerBeats(state.beats);
    if (state.subdivisions) setSequencerSubdivisions(state.subdivisions);
    if (state.octaves) setOctaves(state.octaves);
    if (state.baseOctave) setBaseOctave(state.baseOctave);
    if (state.rootNote) rootNoteAtom.set(state.rootNote);
    if (state.scale) scaleAtom.set(state.scale);
    if (state.showNonDiatonicNotes)
      showNonDiatonicNotesAtom.set(state.showNonDiatonicNotes);
    if (state.tiles) setSelectedTiles(state.tiles);

    setGain(0.8);
    setSelectedInstrument("soft-synth");
    setToneIsReady();
  };

  return (
    <div class="absolute inset-0 z-50 bg-gray-200 grid place-items-center">
      <button
        onClick={onStart}
        class="p-8 shadow-lg rounded-full bg-gray-100 active:translate-y-0.5 active:shadow"
      >
        <FaSolidPlay size={24} />
      </button>
    </div>
  );
}

type SequencerTileProps = {
  note: SequencerNote;
  measure: number;
  beat: number;
  subdivision: number;
  handleOnMouseOverTile: (
    note: string,
    measure: number,
    beat: number,
    subdivision: number
  ) => () => void;
  handleOnMouseDownTile: (
    note: string,
    measure: number,
    beat: number,
    subdivision: number
  ) => () => void;
  handleOnClickTile: (
    note: string,
    measure: number,
    beat: number,
    subdivision: number
  ) => () => void;
};

function SequencerTile(props: SequencerTileProps) {
  const tileKey: TileKey = `${props.note.note}-${props.measure}-${props.beat}-${props.subdivision}`;

  const isSelected = createMemo(() => !!selectedTiles().get(tileKey));

  const isCurrentLocation = createMemo(() => {
    const [measure, beat, subdivision] = playbackLocation();
    const isCurrentLocation =
      measure === props.measure &&
      beat === props.beat &&
      subdivision === props.subdivision;

    return isCurrentLocation;
  });

  const onMouseOverTile = props.handleOnMouseOverTile(
    props.note.note,
    props.measure,
    props.beat,
    props.subdivision
  );

  return (
    <input
      type="checkbox"
      class={clsx("w-8 h-8 rounded-sm appearance-none", {
        "bg-white": props.note.isDiatonic && !isSelected(),
        "bg-gray-100": !props.note.isDiatonic && !isSelected(),

        "bg-gray-400": isSelected(),

        "bg-opacity-75": !isCurrentLocation(),
        "bg-opacity-100": isCurrentLocation(),
      })}
      checked={isSelected()}
      onMouseEnter={onMouseOverTile}
      onMouseLeave={onMouseOverTile}
      onMouseDown={() => {
        if (isSelected()) {
          setMouseInteractionIntent("deselect");
        } else {
          setMouseInteractionIntent("select");
        }
      }}
      onClick={props.handleOnClickTile(
        props.note.note,
        props.measure,
        props.beat,
        props.subdivision
      )}
    />
  );
}

const setLocationToStopped = () => setPlaybackLocation([-1, -1, -1]);
const setLocationToBeginning = () => setPlaybackLocation([0, 0, 0]);

const stopPlaybackLoop = () => {
  clearInterval(playbackLoop());
  setPlaybackLoop(0);
};

const playSelectedNotes = (
  currentMeasure: number,
  currentBeat: number,
  currentSubdivision: number
) => {
  const instrument = selectedInstrumentAtom.get()?.instrument;
  if (!instrument) return;

  const selectedNotes = Array.from(selectedTiles().entries())
    .filter(([_, isSelected]) => isSelected)
    .map(([key]) => {
      const [note, measure, beat, subdivision] = key.split("-");
      return {
        note,
        measure: parseInt(measure),
        beat: parseInt(beat),
        subdivision: parseInt(subdivision),
      };
    })
    .filter(
      ({ measure, beat, subdivision }) =>
        measure === currentMeasure &&
        beat === currentBeat &&
        subdivision === currentSubdivision
    )
    .map(({ note }) => note);

  const noteLengthSeconds = 60 / sequencerSubdivisions() / bpm();
  instrument.triggerAttackRelease(selectedNotes, noteLengthSeconds);
};

const createPlaybackLoop = () => {
  playSelectedNotes(...playbackLocation());

  const intervalFrequency =
    (60 / sequencerSubdivisions() / bpm()) * (4 / sequencerBeats()) * 1000;

  setPlaybackLoop(
    setInterval(() => {
      const [measure, beat, subdivision] = playbackLocation();
      let nextSubdivision = subdivision + 1;
      let nextBeat = beat;
      let nextMeasure = measure;

      if (nextSubdivision >= sequencerSubdivisions()) {
        nextSubdivision = 0;
        nextBeat = beat + 1;
      }
      if (nextBeat >= sequencerBeats()) {
        nextBeat = 0;
        nextMeasure = measure + 1;
      }
      if (nextMeasure >= sequencerMeasures()) {
        nextMeasure = 0;
      }
      setPlaybackLocation([nextMeasure, nextBeat, nextSubdivision]);
      playSelectedNotes(nextMeasure, nextBeat, nextSubdivision);
    }, intervalFrequency)
  );
};

const refreshPlaybackLoop = () => {
  if (playbackLoop()) {
    stopPlaybackLoop();
    createPlaybackLoop();
  }
};

const onTogglePlayback = () => {
  if (playbackLoop()) {
    stopPlaybackLoop();
    setLocationToStopped();
    return;
  }
  setLocationToBeginning();
  createPlaybackLoop();
};

type ConfigOptionNumberProps = {
  id: string;
  label: string;
  value: Accessor<number>;
  setValue: Setter<number>;
  onSetValue: () => void;
};

function ConfigOptionNumber(props: ConfigOptionNumberProps) {
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

function SequencerScreen() {
  const scale = useStore(scaleAtom);
  const rootNote = useStore(rootNoteAtom);
  const showNonDiatonicNotes = useStore(showNonDiatonicNotesAtom);

  const measuresArray = createMemo(() =>
    Array.from({ length: sequencerMeasures() })
      .fill(0)
      .map((_, i) => i)
  );

  const beatsArray = createMemo(() =>
    Array.from({ length: sequencerBeats() })
      .fill(0)
      .map((_, i) => i)
  );

  const subdivisionArray = createMemo(() =>
    Array.from({ length: sequencerSubdivisions() })
      .fill(0)
      .map((_, i) => i)
  );

  const notesArray = createMemo(() => {
    const diatonicIndicies = scale();
    const notes: SequencerNote[] = [];
    let octave = baseOctave();

    let noteIndex = ALL_NOTES.indexOf(rootNote());

    for (let cycle = 0; cycle < octaves(); cycle++) {
      for (let scaleIndex = 0; scaleIndex < ALL_NOTES.length; scaleIndex++) {
        if (noteIndex >= ALL_NOTES.length) {
          noteIndex = 0;
          octave += 1;
        }

        const note = ALL_NOTES[noteIndex];
        const isDiatonic = diatonicIndicies.includes(scaleIndex);

        if (showNonDiatonicNotes() || isDiatonic) {
          notes.push({
            note: `${note.split("/")[0]}${octave}`,
            label: `${note}${octave}`,
            isDiatonic,
            isRootNote: scaleIndex === 0,
          });
        }

        noteIndex++;
      }
    }

    if (noteIndex >= ALL_NOTES.length) {
      noteIndex = 0;
      octave += 1;
    }

    notes.push({
      note: `${ALL_NOTES[noteIndex].split("/")[0]}${octave}`,
      label: `${ALL_NOTES[noteIndex]}${octave}`,
      isDiatonic: true,
      isRootNote: true,
    });

    return notes.reverse();
  });

  addEventListener("mousedown", () => setIsMouseDown(true));
  addEventListener("mouseup", () => {
    setIsMouseDown(false);
  });

  const handleOnMouseOverTile =
    (note: string, measure: number, beat: number, subdivision: number) =>
    () => {
      if (isMouseDown()) {
        const tileKey: TileKey = `${note}-${measure}-${beat}-${subdivision}`;

        const isSelected = !!selectedTiles().get(tileKey);
        const canChange =
          (mouseInteractionIntent() === "select" && !isSelected) ||
          (mouseInteractionIntent() === "deselect" && isSelected);

        if (canChange) {
          selectedTiles().set(tileKey, !isSelected);
          setSelectedTiles(new Map(selectedTiles()));
        }
      }
    };

  const handleOnMouseDownTile =
    (note: string, measure: number, beat: number, subdivision: number) =>
    () => {
      const tileKey: TileKey = `${note}-${measure}-${beat}-${subdivision}`;
      if (!!selectedTiles().get(tileKey)) {
        setMouseInteractionIntent("deselect");
      } else {
        setMouseInteractionIntent("select");
      }
    };

  const handleOnClickTile =
    (note: string, measure: number, beat: number, subdivision: number) =>
    () => {
      const tileKey: TileKey = `${note}-${measure}-${beat}-${subdivision}`;
      const isSelected = !!selectedTiles().get(tileKey);
      selectedTiles().set(tileKey, !isSelected);
      setSelectedTiles(new Map(selectedTiles()));
    };

  const copyStateUrl = () => {
    const url = encodeSequencerToUrl({
      tiles: selectedTiles(),
      measures: sequencerMeasures(),
      beats: sequencerBeats(),
      subdivisions: sequencerSubdivisions(),
      bpm: bpm(),
      octaves: octaves(),
      baseOctave: baseOctave(),
      rootNote: rootNote(),
      scale: scale(),
      showNonDiatonicNotes: showNonDiatonicNotes(),
    });

    copyToClipboard(url);
  };

  return (
    <>
      <div class="max-h-screen max-w-[100vw] overflow-auto py-56 box-border">
        <div class="flex flex-col gap-0.5">
          <For each={notesArray()}>
            {(note, index) => (
              <div
                class={clsx(
                  "flex flex-row gap-2 flex-1 items-center relative px-16",
                  {
                    "mb-1": note.isRootNote,
                  }
                )}
              >
                <div class="mr-1 min-w-[3rem] absolute left-4">
                  <div class="text-gray-500 text-xs font-bold pointer-events-none">
                    {note.label}
                  </div>
                </div>
                <For each={measuresArray()}>
                  {(measure) => (
                    <div class="flex flex-row gap-1">
                      <For each={beatsArray()}>
                        {(beat) => (
                          <div class="flex flex-row gap-0.5">
                            <For each={subdivisionArray()}>
                              {(subdivision) => (
                                <SequencerTile
                                  note={note}
                                  measure={measure}
                                  beat={beat}
                                  subdivision={subdivision}
                                  handleOnMouseOverTile={handleOnMouseOverTile}
                                  handleOnMouseDownTile={handleOnMouseDownTile}
                                  handleOnClickTile={handleOnClickTile}
                                />
                              )}
                            </For>
                          </div>
                        )}
                      </For>
                    </div>
                  )}
                </For>
              </div>
            )}
          </For>
        </div>
      </div>
      <div class="flex items-center justify-center absolute inset-x-8 bottom-8 pointer-events-none">
        <div class="flex gap-2 pointer-events-auto">
          <Button onClick={onTogglePlayback}>
            {playbackLoop() ? "Stop" : "Start"}
          </Button>
          <Button onClick={() => setSelectedTiles(new Map())}>Clear</Button>
          <Button onClick={copyStateUrl}>Copy Url</Button>
        </div>
      </div>
      <div class="flex flex-col gap-2 absolute bg-white py-2 px-4 rounded shadow top-4 right-4">
        <ConfigOptionNumber
          id="base-octave"
          label="Base Octave"
          value={baseOctave}
          setValue={setBaseOctave}
          onSetValue={refreshPlaybackLoop}
        />
        <ConfigOptionNumber
          id="octaves"
          label="Octaves"
          value={octaves}
          setValue={setOctaves}
          onSetValue={refreshPlaybackLoop}
        />
        <ConfigOptionNumber
          id="measures"
          label="Measures"
          value={sequencerMeasures}
          setValue={setSequencerMeasures}
          onSetValue={refreshPlaybackLoop}
        />
        <ConfigOptionNumber
          id="beats"
          label="Beats"
          value={sequencerBeats}
          setValue={setSequencerBeats}
          onSetValue={refreshPlaybackLoop}
        />
        <ConfigOptionNumber
          id="subdivisions"
          label="Subdivisions"
          value={sequencerSubdivisions}
          setValue={setSequencerSubdivisions}
          onSetValue={refreshPlaybackLoop}
        />
        <ConfigOptionNumber
          id="bpm"
          label="BPM"
          value={bpm}
          setValue={setBpm}
          onSetValue={refreshPlaybackLoop}
        />
      </div>
      <InstrumentManager />
      <ScaleSelection />
    </>
  );
}

export default function Sequencer() {
  const isToneReady = useStore(isToneStartedStore);

  return (
    <div>
      <Show when={isToneReady()} fallback={<StartScreen />}>
        <SequencerScreen />
      </Show>
    </div>
  );
}
