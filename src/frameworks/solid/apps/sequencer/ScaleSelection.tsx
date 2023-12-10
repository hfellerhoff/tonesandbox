import Select from "@solid/components/Select";
import FloatingModuleWrapper from "@solid/modules/FloatingModuleWrapper";
import { useStore } from "@nanostores/solid";
import { atom } from "nanostores";
import { BsBarChartFill } from "solid-icons/bs";
import { For, createMemo } from "solid-js";

const SCALES: {
  value: string;
  name: string;
}[] = [
  /* Diatonic Modes */
  {
    value: "0,2,4,5,7,9,11",
    name: "Ionian (Major)",
  },
  {
    value: "0,2,3,5,7,9,10",
    name: "Dorian",
  },
  {
    value: "0,1,3,5,7,8,10",
    name: "Phrygian",
  },
  {
    value: "0,2,4,6,7,9,11",
    name: "Lydian",
  },
  {
    value: "0,2,4,5,7,9,10",
    name: "Mixolydian",
  },
  {
    value: "0,2,3,5,7,8,10",
    name: "Aeolian (Natural Minor)",
  },
  {
    value: "0,1,3,5,6,8,10",
    name: "Locrian",
  },
  /* Pentatonic Scale */
  {
    value: "0,2,4,7,9",
    name: "Pentatonic",
  },
  {
    value: "0,3,5,7,10",
    name: "Minor Pentatonic",
  },
  {
    value: "0,3,5,6,7,10",
    name: "Blues",
  },
  /* Melodic Minor Modes */
  {
    value: "0,2,3,5,7,9,11",
    name: "Melodic minor, Mode 1",
  },
  {
    value: "0,1,3,5,7,9,10",
    name: "Melodic minor, Mode 2",
  },
  {
    value: "0,2,4,6,8,9,11",
    name: "Melodic minor, Mode 3",
  },
  {
    value: "0,2,4,6,7,9,10",
    name: "Melodic minor, Mode 4",
  },
  {
    value: "0,2,4,5,7,8,10",
    name: "Melodic minor, Mode 5",
  },
  {
    value: "0,2,3,5,6,8,10",
    name: "Melodic minor, Mode 6",
  },
  {
    value: "0,1,3,4,6,8,10",
    name: "Melodic minor, Mode 7",
  },
  /* Modes of Limited Transposition */
  {
    value: "0,2,4,6,8,10",
    name: "Whole Tone - Mode 1, Messiaen's Modes of Limited Transposition",
  },
  {
    value: "0,1,3,4,6,7,9,10",
    name: "Octatonic - Mode 2, Messiaen's Modes of Limited Transposition",
  },
  {
    value: "0,2,3,4,6,7,8,10,11",
    name: "Mode 3, Messiaen's Modes of Limited Transposition",
  },
  {
    value: "0,1,2,5,6,7,8,11",
    name: "Mode 4, Messiaen's Modes of Limited Transposition",
  },
  {
    value: "0,1,5,6,7,11",
    name: "Mode 5, Messiaen's Modes of Limited Transposition",
  },
  {
    value: "0,2,4,5,6,8,10,11",
    name: "Mode 6, Messiaen's Modes of Limited Transposition",
  },
  {
    value: "0,1,2,3,5,6,7,8,9,11",
    name: "Mode 7, Messiaen's Modes of Limited Transposition",
  },
];

export const scaleAtom = atom([0, 2, 4, 7, 9]);
export const rootNoteAtom = atom("C");
export const showNonDiatonicNotesAtom = atom(false);

export const ALL_NOTES = [
  "C",
  "C#/Db",
  "D",
  "D#/Eb",
  "E",
  "F",
  "F#/Gb",
  "G",
  "G#/Ab",
  "A",
  "A#/Bb",
  "B",
];

const setScale = (value: string) => {
  const scale = value.split(",").map((note) => parseInt(note));
  scaleAtom.set(scale);
};

export default function ScaleSelection() {
  const scale = useStore(scaleAtom);
  const rootNote = useStore(rootNoteAtom);
  const showNonDiatonicNotes = useStore(showNonDiatonicNotesAtom);

  const scaleValue = createMemo(() => scale().join(","));

  const onChangeScale = (event: Event) => {
    const scale = (event.target as HTMLSelectElement).value;
    setScale(scale);
  };

  return (
    <FloatingModuleWrapper icon={<BsBarChartFill />} position="bottom-right">
      <label
        for="scale-select"
        class="block text-sm font-medium text-gray-500 dark:text-gray-400"
      >
        Scale
      </label>
      <Select id="scale-select" onChange={onChangeScale}>
        <For each={SCALES}>
          {(scale) => (
            <option selected={scaleValue() === scale.value} value={scale.value}>
              {scale.name}
            </option>
          )}
        </For>
      </Select>
      <div class="flex flex-col gap-1 mt-2">
        <label
          for="root-note-select"
          class="block text-sm font-medium text-gray-500 dark:text-gray-400"
        >
          Root note
        </label>
        <Select
          id="root-note-select"
          onChange={(event) =>
            rootNoteAtom.set((event.target as HTMLSelectElement).value)
          }
        >
          <For each={ALL_NOTES}>
            {(note) => (
              <option value={note} selected={note === rootNote()}>
                {note}
              </option>
            )}
          </For>
        </Select>
      </div>
      <div class="flex items-center gap-1 mt-2">
        <input
          id="show-non-diatonic"
          type="checkbox"
          checked={showNonDiatonicNotes()}
          onChange={() => showNonDiatonicNotesAtom.set(!showNonDiatonicNotes())}
        />
        <label
          for="show-non-diatonic"
          class="block text-sm font-medium text-gray-500 dark:text-gray-400"
        >
          Show all notes
        </label>
      </div>
    </FloatingModuleWrapper>
  );
}
