import * as Tone from "tone";
import { selectedInstrumentAtom } from "@shared/instruments";
import { createSignal } from "solid-js";
import {
  TileState,
  selectedTiles,
  sequencerBeats,
  sequencerMeasures,
  sequencerSubdivisions,
} from "./state";

export const [velocity, setVelocity] = createSignal(0.5);

export const [bpm, setBpm] = createSignal(120);
export const [playbackLoop, setPlaybackLoop] = createSignal<number>(0);

export type PlaybackLocation = [number, number, number];
export const [playbackLocation, setPlaybackLocation] =
  createSignal<PlaybackLocation>([-1, -1, -1]);

export const setLocationToStopped = () => setPlaybackLocation([-1, -1, -1]);
export const setLocationToBeginning = () => setPlaybackLocation([0, 0, 0]);

const compareLocations = (
  location1: PlaybackLocation,
  location2: PlaybackLocation
) => {
  const [measure1, beat1, subdivision1] = location1;
  const [measure2, beat2, subdivision2] = location2;

  if (measure1 < measure2) return -1;
  if (measure1 > measure2) return 1;

  if (beat1 < beat2) return -1;
  if (beat1 > beat2) return 1;

  if (subdivision1 < subdivision2) return -1;
  if (subdivision1 > subdivision2) return 1;

  return 0;
};
export const isLocationBefore = (
  location1: PlaybackLocation,
  location2: PlaybackLocation
) => compareLocations(location1, location2) === -1;

export const isLocationAfter = (
  location1: PlaybackLocation,
  location2: PlaybackLocation
) => compareLocations(location1, location2) === 1;

export const stopPlaybackLoop = () => {
  clearInterval(playbackLoop());
  setPlaybackLoop(0);
  const instrument = selectedInstrumentAtom.get();
  if (instrument) {
    instrument.releaseAll();
  }
};

export const incrementPlaybackLocation = ([
  measure,
  beat,
  subdivision,
]: PlaybackLocation) => {
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

  return [nextMeasure, nextBeat, nextSubdivision] as PlaybackLocation;
};

export const decrementPlaybackLocation = ([
  measure,
  beat,
  subdivision,
]: PlaybackLocation) => {
  let nextSubdivision = subdivision - 1;
  let nextBeat = beat;
  let nextMeasure = measure;

  if (nextSubdivision < 0) {
    nextSubdivision = sequencerSubdivisions() - 1;
    nextBeat = beat - 1;
  }
  if (nextBeat < 0) {
    nextBeat = sequencerBeats() - 1;
    nextMeasure = measure - 1;
  }
  if (nextMeasure < 0) {
    nextMeasure = sequencerMeasures() - 1;
  }

  return [nextMeasure, nextBeat, nextSubdivision] as PlaybackLocation;
};

export const playSelectedNotes = (location: PlaybackLocation) => {
  const instrument = selectedInstrumentAtom.get();
  if (!instrument) return;

  const [currentMeasure, currentBeat, currentSubdivision] = location;

  const selectedNotes = Array.from(selectedTiles().entries())
    .filter(([_, state]) => !!state)
    .map(([key, state]) => {
      const [note, measure, beat, subdivision] = key.split("-");
      return {
        note,
        measure: parseInt(measure),
        beat: parseInt(beat),
        subdivision: parseInt(subdivision),
        state,
      };
    });

  const currentSelectedNotes = selectedNotes.filter(
    ({ measure, beat, subdivision }) =>
      measure === currentMeasure &&
      beat === currentBeat &&
      subdivision === currentSubdivision
  );

  const currentSelectedSingleNotes = currentSelectedNotes
    .filter(({ state }) => state === TileState.Single)
    .map(({ note }) => note);

  const currentSelectedCombinedNotes = currentSelectedNotes.filter(
    ({ state }) => state === TileState.Combined
  );

  const previousSelectedCombinedNotes = selectedNotes
    .filter(({ measure, beat, subdivision }) => {
      let previousSubdivision = currentSubdivision - 1;
      let previousBeat = currentBeat;
      let previousMeasure = currentMeasure;

      if (previousSubdivision < 0) {
        previousSubdivision = sequencerSubdivisions() - 1;
        previousBeat = currentBeat - 1;
      }
      if (previousBeat < 0) {
        previousBeat = sequencerBeats() - 1;
        previousMeasure = currentMeasure - 1;
      }
      if (previousMeasure < 0) {
        previousMeasure = sequencerMeasures() - 1;
      }

      return (
        measure === previousMeasure &&
        beat === previousBeat &&
        subdivision === previousSubdivision
      );
    })
    .filter(({ state }) => state === TileState.Combined);

  const newlySelectedCombinedNotes = currentSelectedCombinedNotes
    .filter(
      ({ note }) => !previousSelectedCombinedNotes.find((n) => n.note === note)
    )
    .map(({ note }) => note);

  const endedSelectedCombinedNotes = previousSelectedCombinedNotes
    .filter(
      ({ note }) => !currentSelectedCombinedNotes.find((n) => n.note === note)
    )
    .map(({ note }) => note);

  instrument.triggerRelease(endedSelectedCombinedNotes);

  const noteLengthSeconds = 60 / sequencerSubdivisions() / bpm();
  instrument.triggerAttackRelease(
    currentSelectedSingleNotes,
    noteLengthSeconds,
    Tone.now(),
    velocity()
  );

  instrument.triggerAttack(newlySelectedCombinedNotes, Tone.now(), velocity());
};

export const createPlaybackLoop = () => {
  playSelectedNotes(playbackLocation());

  const intervalFrequency =
    (60 / sequencerSubdivisions() / bpm()) * (4 / sequencerBeats()) * 1000;

  setPlaybackLoop(
    setInterval(() => {
      const nextLocation = incrementPlaybackLocation(playbackLocation());
      setPlaybackLocation(nextLocation);
      playSelectedNotes(nextLocation);
    }, intervalFrequency)
  );
};

export const refreshPlaybackLoop = () => {
  if (playbackLoop()) {
    stopPlaybackLoop();
    createPlaybackLoop();
  }
};

export const onTogglePlayback = () => {
  if (playbackLoop()) {
    stopPlaybackLoop();
    setLocationToStopped();

    return;
  }
  setLocationToBeginning();
  createPlaybackLoop();
};
