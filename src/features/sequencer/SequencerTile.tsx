import clsx from "clsx";
import { Accessor, createEffect, createMemo } from "solid-js";
import { type TileKey, selectedTiles, TileState } from "./state";
import { playbackLocation } from "./playback";

type MouseEventInteractionHandler = (
  note: string,
  measure: number,
  beat: number,
  subdivision: number
) => () => void;

export type SequencerNote = {
  note: string;
  label: string;
  isDiatonic: boolean;
  isRootNote: boolean;
};

type SequencerTileProps = {
  note: SequencerNote;
  measure: number;
  beat: number;
  subdivision: number;
  onMouseEnterTile: MouseEventInteractionHandler;
  onMouseLeaveTile: MouseEventInteractionHandler;
  onMouseDownTile: MouseEventInteractionHandler;
  onClickTile: MouseEventInteractionHandler;
  isTentativeCombinedNote: boolean;
  isCurrentLocation: boolean;
  tileState: TileState | undefined;
  previousTileState: TileState | undefined;
  nextTileState: TileState | undefined;
};

export default function SequencerTile(props: SequencerTileProps) {
  const tileState = createMemo(() => props.tileState || TileState.None);
  const isStateNone = createMemo(() => tileState() === TileState.None);
  const isStateSingle = createMemo(() => tileState() === TileState.Single);
  const isStateCombined = createMemo(() => tileState() === TileState.Combined);

  const tileKey: TileKey = `${props.note.note}-${props.measure}-${props.beat}-${props.subdivision}`;

  const connectToNextNote = createMemo(() => {
    return isStateCombined() && props.nextTileState === TileState.Combined;
  });
  const connectToPreviousNote = createMemo(() => {
    return isStateCombined() && props.previousTileState === TileState.Combined;
  });

  const isFirstSubdivision = props.subdivision === 0 && props.beat !== 0;
  const isFirstBeat =
    props.beat === 0 && props.subdivision === 0 && props.measure !== 0;

  return (
    <input
      type="checkbox"
      class={clsx("w-8 h-8 appearance-none rounded-sm", {
        "bg-white":
          props.note.isDiatonic &&
          isStateNone() &&
          !props.isTentativeCombinedNote,
        "bg-gray-100":
          !props.note.isDiatonic &&
          isStateNone() &&
          !props.isTentativeCombinedNote,

        "bg-gray-400": !isStateNone() && !props.isTentativeCombinedNote,

        "bg-opacity-75": !props.isCurrentLocation,
        "bg-opacity-100": props.isCurrentLocation,

        "rounded-r-none": connectToNextNote(),
        "rounded-l-none": connectToPreviousNote(),

        "w-[2.125rem]": connectToPreviousNote() && !isFirstSubdivision,
        "w-[2.25rem]": connectToPreviousNote() && isFirstSubdivision,
        "w-[2.5rem]": connectToPreviousNote() && isFirstBeat,

        "ml-0.5": !connectToPreviousNote() && !isFirstSubdivision,
        "ml-1": !connectToPreviousNote() && isFirstSubdivision,
        "ml-2": !connectToPreviousNote() && isFirstBeat,

        "bg-gray-300": props.isTentativeCombinedNote,
      })}
      checked={!isStateNone()}
      onMouseEnter={props.onMouseEnterTile(
        props.note.note,
        props.measure,
        props.beat,
        props.subdivision
      )}
      onMouseLeave={props.onMouseLeaveTile(
        props.note.note,
        props.measure,
        props.beat,
        props.subdivision
      )}
      onMouseDown={props.onMouseDownTile(
        props.note.note,
        props.measure,
        props.beat,
        props.subdivision
      )}
      onClick={props.onClickTile(
        props.note.note,
        props.measure,
        props.beat,
        props.subdivision
      )}
    />
  );
}
