import InstrumentManager from "@modules/instruments/InstrumentModule";
import { useStore } from "@nanostores/solid";
import copyToClipboard from "@shared/utils/copyToClipboard";
import clsx from "clsx";
import { BiRegularDotsHorizontal } from "solid-icons/bi";
import { IoCheckmark, IoLink, IoPause, IoPlay, IoTrash } from "solid-icons/io";
import { OcHorizontalrule3 } from "solid-icons/oc";
import { For, createEffect, createMemo, createSignal, onMount } from "solid-js";
import PlaybackAndLengthFloatingConfig from "./PlaybackAndLengthFloatingConfig";
import ScaleSelection, {
  ALL_NOTES,
  rootNoteAtom,
  scaleAtom,
  showNonDiatonicNotesAtom,
} from "./ScaleSelection";
import type { SequencerNote } from "./SequencerTile";
import SequencerTile from "./SequencerTile";
import {
  PlaybackLocation,
  SUBDIVISION_OFFSET,
  decrementPlaybackLocation,
  incrementPlaybackLocation,
  isLocationBefore,
  onTogglePlayback,
  playbackLocation,
  playbackLoop,
  setBpm,
  subtractFromPlaybackLocation,
} from "./playback";
import {
  TileState,
  baseOctave,
  isMouseDown,
  octaves,
  selectedTiles,
  sequencerBeats,
  sequencerMeasures,
  sequencerSubdivisions,
  setIsMouseDown,
  setSelectedTiles,
  zoom,
  type TileKey,
  setBaseOctave,
  setOctaves,
  setSequencerBeats,
  setSequencerMeasures,
  setSequencerSubdivisions,
  getTileKey,
  parseTileKey,
} from "./state";
import { decodeUrlToSequencerState, encodeSequencerToUrl } from "./urlUtils";
import { setGain, setSelectedInstrument } from "@modules/instruments";
import { isToneStartedStore } from "@shared/isToneStartedStore";

// Single note
export const [mouseInteractionIntent, setMouseInteractionIntent] = createSignal<
  "select" | "deselect"
>("select");

// Extended connected note
type TentativeCombinedNote = {
  location: PlaybackLocation;
  note: string;
};
export const [tentativeCombinedStartNote, setTentativeCombinedStartNote] =
  createSignal<TentativeCombinedNote | null>(null);
export const [tentativeCombinedEndNote, setTentativeCombinedEndNote] =
  createSignal<TentativeCombinedNote | null>(null);

export default function Sequencer() {
  onMount(() => {
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

    addEventListener("mousedown", () => setIsMouseDown(true));
    addEventListener("mouseup", () => {
      setIsMouseDown(false);

      if (mouseDownMode() === "combined") {
        tentativeCombinedNotes().forEach((tileKey) => {
          selectedTiles().set(tileKey, TileState.Combined);
        });

        setSelectedTiles(new Map(selectedTiles()));
      }

      setTentativeCombinedStartNote(null);
      setTentativeCombinedEndNote(null);
    });
  });

  const scale = useStore(scaleAtom);
  const rootNote = useStore(rootNoteAtom);
  const showNonDiatonicNotes = useStore(showNonDiatonicNotesAtom);

  const [isRecentlyCopied, setIsRecentlyCopied] = createSignal(false);

  const [mouseDownMode, setMouseDownMode] = createSignal<
    "monophonic" | "combined"
  >("monophonic");

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

    const activeNotesWithoutOctave = Array.from(
      new Set(
        Array.from(selectedTiles().entries())
          .filter(([, state]) => state !== TileState.None)
          .map(([key]) => {
            const { note } = parseTileKey(key);
            return note.substring(0, note.length - 1);
          })
      )
    );

    for (let cycle = 0; cycle < octaves(); cycle++) {
      for (let scaleIndex = 0; scaleIndex < ALL_NOTES.length; scaleIndex++) {
        if (noteIndex >= ALL_NOTES.length) {
          noteIndex = 0;
          octave += 1;
        }

        const note = ALL_NOTES[noteIndex];
        const isDiatonic = diatonicIndicies.includes(scaleIndex);

        const isIncluded = activeNotesWithoutOctave.some(
          (activeNoteWithoutOctave) => {
            return note === activeNoteWithoutOctave;
          }
        );

        if (showNonDiatonicNotes() || isDiatonic || isIncluded) {
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

  const tentativeCombinedNotes = createMemo(() => {
    const tentativeTileKeys: TileKey[] = [];

    const tentativeStartLocation = tentativeCombinedStartNote();
    const tentativeEndLocation = tentativeCombinedEndNote();

    if (!tentativeStartLocation || !tentativeEndLocation)
      return tentativeTileKeys;

    const { note: startNote, location: startLocation } = tentativeStartLocation;
    const { note: endNote, location: endLocation } = tentativeEndLocation;

    let localStartLocation: PlaybackLocation = [...startLocation];

    while (
      localStartLocation[0] !== endLocation[0] ||
      localStartLocation[1] !== endLocation[1] ||
      localStartLocation[2] !== endLocation[2]
    ) {
      const tileKey: TileKey = getTileKey(startNote, ...localStartLocation);
      tentativeTileKeys.push(tileKey);

      const nextLocation = incrementPlaybackLocation(localStartLocation);
      localStartLocation[0] = nextLocation[0];
      localStartLocation[1] = nextLocation[1];
      localStartLocation[2] = nextLocation[2];
    }

    const finalTileKey: TileKey = getTileKey(endNote, ...endLocation);
    tentativeTileKeys.push(finalTileKey);

    return tentativeTileKeys;
  });

  const handleOnMouseEnterOrLeaveTile =
    (note: string, measure: number, beat: number, subdivision: number) =>
    () => {
      if (isMouseDown()) {
        const tileKey: TileKey = getTileKey(note, measure, beat, subdivision);
        const isSelected = !!selectedTiles().get(tileKey);
        const canChange =
          (mouseInteractionIntent() === "select" && !isSelected) ||
          (mouseInteractionIntent() === "deselect" && isSelected);

        if (!canChange) return;

        if (mouseDownMode() === "monophonic") {
          const targetState = isSelected ? TileState.None : TileState.Single;
          selectedTiles().set(tileKey, targetState);
          setSelectedTiles(new Map(selectedTiles()));
        }

        if (mouseDownMode() === "combined") {
          const startNote = tentativeCombinedStartNote();

          if (mouseInteractionIntent() === "select") {
            if (!startNote || note !== startNote.note) return;

            if (
              !isLocationBefore(
                [measure, beat, subdivision],
                startNote.location
              )
            ) {
              setTentativeCombinedEndNote({
                location: [measure, beat, subdivision],
                note: note,
              });
            }
          } else {
            selectedTiles().set(tileKey, TileState.None);
            setSelectedTiles(new Map(selectedTiles()));
          }
        }
      }
    };

  const handleOnMouseDownTile =
    (note: string, measure: number, beat: number, subdivision: number) =>
    () => {
      const tileKey: TileKey = getTileKey(note, measure, beat, subdivision);
      const isSelected = !!selectedTiles().get(tileKey);
      if (isSelected) {
        setMouseInteractionIntent("deselect");
      } else {
        setMouseInteractionIntent("select");
      }

      if (mouseDownMode() === "combined") {
        if (mouseInteractionIntent() === "select") {
          setTentativeCombinedStartNote({
            location: [measure, beat, subdivision],
            note: note,
          });
          setTentativeCombinedEndNote({
            location: [measure, beat, subdivision],
            note: note,
          });
        }
      }
    };

  const handleOnClickTile =
    (note: string, measure: number, beat: number, subdivision: number) =>
    () => {
      const tileKey: TileKey = getTileKey(note, measure, beat, subdivision);
      const isSelected =
        selectedTiles().has(tileKey) &&
        selectedTiles().get(tileKey) !== TileState.None;

      if (isSelected) {
        selectedTiles().set(tileKey, TileState.None);
      } else {
        if (mouseDownMode() === "monophonic") {
          selectedTiles().set(tileKey, TileState.Single);
        }
        if (mouseDownMode() === "combined") {
          selectedTiles().set(tileKey, TileState.Combined);
        }
      }
      setSelectedTiles(new Map(selectedTiles()));
    };

  const copyStateUrl = () => {
    const url = encodeSequencerToUrl();
    copyToClipboard(url);
  };

  return (
    <>
      <div class="h-screen w-screen overflow-auto py-56 box-border mx-auto grid place-items-center px-32">
        <div
          class="flex flex-col items-center"
          style={{
            transform: `scale(${zoom()})`,
            "transform-origin": "50% 50%",
            width: `${100 * (1 / zoom())}%`,
          }}
        >
          <For each={notesArray()}>
            {(note) => (
              <div
                class={clsx("flex flex-row flex-1 items-center relative", {
                  "mb-1": note.isRootNote,
                })}
              >
                <div class="mr-1 min-w-[3rem] absolute -left-14 text-right">
                  <div class="text-gray-400 dark:text-gray-500 text-xs font-bold pointer-events-none select-none">
                    {note.label}
                  </div>
                </div>
                <For each={measuresArray()}>
                  {(measure) => (
                    <div class="flex flex-row mt-0.5">
                      <For each={beatsArray()}>
                        {(beat) => (
                          <div class="flex flex-row">
                            <For each={subdivisionArray()}>
                              {(subdivision) => {
                                const tileKey: TileKey = getTileKey(
                                  note.note,
                                  measure,
                                  beat,
                                  subdivision
                                );

                                const previousTileLocation =
                                  decrementPlaybackLocation([
                                    measure,
                                    beat,
                                    subdivision,
                                  ]);
                                const previousTileKey: TileKey = getTileKey(
                                  note.note,
                                  ...previousTileLocation
                                );

                                const nextTileLocation =
                                  incrementPlaybackLocation([
                                    measure,
                                    beat,
                                    subdivision,
                                  ]);
                                const nextTileKey: TileKey = getTileKey(
                                  note.note,
                                  ...nextTileLocation
                                );

                                const isCurrentLocation = createMemo(() => {
                                  const [
                                    locationMeasure,
                                    locationBeat,
                                    locationSubdivision,
                                  ] = subtractFromPlaybackLocation(
                                    playbackLocation(),
                                    SUBDIVISION_OFFSET
                                  );

                                  return (
                                    measure === locationMeasure &&
                                    beat === locationBeat &&
                                    subdivision === locationSubdivision
                                  );
                                });
                                return (
                                  <SequencerTile
                                    note={note}
                                    measure={measure}
                                    beat={beat}
                                    subdivision={subdivision}
                                    onMouseEnterTile={
                                      handleOnMouseEnterOrLeaveTile
                                    }
                                    onMouseLeaveTile={
                                      handleOnMouseEnterOrLeaveTile
                                    }
                                    onMouseDownTile={handleOnMouseDownTile}
                                    onClickTile={handleOnClickTile}
                                    isTentativeCombinedNote={tentativeCombinedNotes().includes(
                                      tileKey
                                    )}
                                    tileState={selectedTiles().get(tileKey)}
                                    nextTileState={
                                      selectedTiles().get(nextTileKey) ??
                                      TileState.None
                                    }
                                    previousTileState={
                                      selectedTiles().get(previousTileKey) ??
                                      TileState.None
                                    }
                                    isCurrentLocation={isCurrentLocation()}
                                  />
                                );
                              }}
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
      <div class="flex flex-col sm:flex-row gap-0 sm:gap-12 items-center justify-center absolute inset-x-8 bottom-4 sm:bottom-8 pointer-events-none">
        <div class="flex gap-2 pointer-events-auto">
          <button
            onClick={() => setMouseDownMode("monophonic")}
            class={clsx(
              "grid place-items-center h-12 w-12 shadow-md rounded-full bg-white dark:bg-gray-800 dark:text-white active:translate-y-0.5 active:shadow border-2 transition-colors",
              {
                "border-purple-600": mouseDownMode() === "monophonic",
                "border-transparent": mouseDownMode() !== "monophonic",
              }
            )}
          >
            <BiRegularDotsHorizontal size={18} />
          </button>
          <button
            onClick={() => setMouseDownMode("combined")}
            class={clsx(
              "grid place-items-center h-12 w-12 shadow-md rounded-full bg-white dark:bg-gray-800 dark:text-white active:translate-y-0.5 active:shadow border-2 transition-colors",
              {
                "border-purple-600": mouseDownMode() === "combined",
                "border-transparent": mouseDownMode() !== "combined",
              }
            )}
          >
            <OcHorizontalrule3 size={18} />
          </button>
        </div>
        <div class="flex gap-2 pointer-events-auto">
          <button
            onClick={onTogglePlayback}
            class="grid place-items-center h-12 w-12 shadow-md rounded-full bg-white dark:bg-gray-800 dark:text-white active:translate-y-0.5 active:shadow border-2 border-transparent transition-colors"
          >
            {playbackLoop() ? <IoPause /> : <IoPlay />}
          </button>
          <button
            onClick={() => setSelectedTiles(new Map())}
            class="grid place-items-center h-12 w-12 shadow-md rounded-full bg-white dark:bg-gray-800 dark:text-white active:translate-y-0.5 active:shadow border-2 border-transparent transition-colors"
          >
            <IoTrash />
          </button>
          <button
            onClick={() => {
              copyStateUrl();
              setIsRecentlyCopied(true);
              setTimeout(() => {
                setIsRecentlyCopied(false);
              }, 3000);
            }}
            class="grid place-items-center h-12 w-12 shadow-md rounded-full bg-white dark:bg-gray-800 dark:text-white active:translate-y-0.5 active:shadow border-2 border-transparent transition-colors"
          >
            {isRecentlyCopied() ? <IoCheckmark /> : <IoLink />}
          </button>
        </div>
      </div>
      <PlaybackAndLengthFloatingConfig />
      <ScaleSelection />
    </>
  );
}
