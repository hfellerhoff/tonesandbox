import { useStore } from "@nanostores/solid";
import { atom } from "nanostores";
import { For, Show, createMemo, createSignal } from "solid-js";
import { BsBarChartFill } from "solid-icons/bs";

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
  const [isExpanded, setIsExpanded] = createSignal(false);

  const scale = useStore(scaleAtom);
  const rootNote = useStore(rootNoteAtom);
  const showNonDiatonicNotes = useStore(showNonDiatonicNotesAtom);

  const scaleValue = createMemo(() => scale().join(","));

  const onChangeScale = (event: Event) => {
    const scale = (event.target as HTMLSelectElement).value;
    setScale(scale);
  };

  return (
    <Show
      when={isExpanded()}
      fallback={
        <button
          class="p-4 absolute bg-white rounded shadow bottom-4 right-4"
          onClick={() => setIsExpanded(true)}
        >
          <BsBarChartFill />
        </button>
      }
    >
      <div class="flex flex-col gap-2 absolute bg-white p-4 rounded shadow bottom-4 right-4 w-56 z-20">
        <label
          for="scale-select"
          class="block text-sm font-medium text-gray-500 px-1"
        >
          Scale
        </label>
        <select
          id="scale-select"
          value={scaleValue()}
          onChange={onChangeScale}
          class="max-w-full box-border"
        >
          {/* <!-- Diatonic Modes --> */}
          <option value="0,2,4,5,7,9,11">Ionian (Major)</option>
          <option value="0,2,3,5,7,9,10">Dorian</option>
          <option value="0,1,3,5,7,8,10">Phrygian</option>
          <option value="0,2,4,6,7,9,11">Lydian</option>
          <option value="0,2,4,5,7,9,10">Mixolydian</option>
          <option value="0,2,3,5,7,8,10">Aeolian (Natural Minor)</option>
          <option value="0,1,3,5,6,8,10">Locrian</option>
          {/* <!-- Pentatonic Scale --> */}
          <option value="0,2,4,7,9">Pentatonic</option>
          <option value="0,3,5,7,10">Minor Pentatonic</option>
          <option value="0,3,5,6,7,10">Blues</option>
          {/* <!-- Melodic Minor Modes --> */}
          <option value="0,2,3,5,7,9,11">Melodic minor, Mode 1</option>
          <option value="0,1,3,5,7,9,10">Melodic minor, Mode 2</option>
          <option value="0,2,4,6,8,9,11">Melodic minor, Mode 3</option>
          <option value="0,2,4,6,7,9,10">Melodic minor, Mode 4</option>
          <option value="0,2,4,5,7,8,10">Melodic minor, Mode 5</option>
          <option value="0,2,3,5,6,8,10">Melodic minor, Mode 6</option>
          <option value="0,1,3,4,6,8,10">Melodic minor, Mode 7</option>
          {/* <!-- Modes of Limited Transposition --> */}
          <option value="0,2,4,6,8,10">
            Whole Tone - Mode 1, Messiaen's Modes of Limited Transposition
          </option>
          <option value="0,1,3,4,6,7,9,10">
            Octatonic - Mode 2, Messiaen's Modes of Limited Transposition
          </option>
          <option value="0,2,3,4,6,7,8,10,11">
            Mode 3, Messiaen's Modes of Limited Transposition
          </option>
          <option value="0,1,2,5,6,7,8,11">
            Mode 4, Messiaen's Modes of Limited Transposition
          </option>
          <option value="0,1,5,6,7,11">
            Mode 5, Messiaen's Modes of Limited Transposition
          </option>
          <option value="0,2,4,5,6,8,10,11">
            Mode 6, Messiaen's Modes of Limited Transposition
          </option>
          <option value="0,1,2,3,5,6,7,8,9,11">
            Mode 7, Messiaen's Modes of Limited Transposition
          </option>
        </select>
        <div class="flex flex-col gap-1 mt-2">
          <label
            for="root-note-select"
            class="text-sm font-medium text-gray-500 px-1"
          >
            Root note
          </label>
          <select
            id="root-note-select"
            value={rootNote()}
            onChange={(event) =>
              rootNoteAtom.set((event.target as HTMLSelectElement).value)
            }
            class="max-w-full"
          >
            <For each={ALL_NOTES}>
              {(note) => <option value={note}>{note}</option>}
            </For>
          </select>
        </div>
        <div class="flex items-center gap-1 mt-2 px-1">
          <input
            id="show-non-diatonic"
            type="checkbox"
            checked={showNonDiatonicNotes()}
            onChange={() =>
              showNonDiatonicNotesAtom.set(!showNonDiatonicNotes())
            }
          />
          <label
            for="show-non-diatonic"
            class="text-sm font-medium text-gray-500"
          >
            Show all notes
          </label>
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
