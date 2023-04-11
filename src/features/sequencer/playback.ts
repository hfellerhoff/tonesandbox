import * as Tone from "tone";
import { Note } from "theory.js";
import { selectedInstrumentAtom } from "@modules/instruments";
import { createSignal } from "solid-js";
import {
  TileKey,
  TileState,
  selectedTiles,
  sequencerBeats,
  sequencerMeasures,
  sequencerSubdivisions,
} from "./state";
import anime from "animejs";

const startAnimation = {
  keyframes: [{ scale: 1.01, translateY: -3, translateX: -3, duration: 300 }],
} satisfies anime.AnimeParams;

const stopAnimation = {
  keyframes: [{ scale: 1, translateY: 0, translateX: 0, duration: 100 }],
} satisfies anime.AnimeParams;

const startStopAnimation: anime.AnimeParams = {
  keyframes: [
    { scale: 1.01, translateY: -3, translateX: -3, duration: 100 },
    { scale: 1, translateY: 0, translateX: 0, duration: 100 },
  ],
};

export const [velocity, setVelocity] = createSignal(0.5);

export const [bpm, setBpm] = createSignal(120);
export const [playbackLoop, setPlaybackLoop] = createSignal<number>(0);

export type PlaybackLocation = [number, number, number];
export const [playbackLocation, setPlaybackLocation] =
  createSignal<PlaybackLocation>([-1, -1, -1]);

export const setLocationToStopped = () => setPlaybackLocation([-1, -1, -1]);
export const setLocationToBeginning = () => setPlaybackLocation([0, 0, 0]);

export const SUBDIVISION_OFFSET = 1;
export const subtractFromPlaybackLocation = (
  location: PlaybackLocation,
  subdivisions: number
) => {
  let [measure, beat, subdivision] = location;

  for (let i = 0; i < subdivisions; i++) {
    if (subdivision === 0) {
      if (beat === 0) {
        if (measure === 0) {
          measure = sequencerMeasures() - 1;
          beat = sequencerBeats() - 1;
          subdivision = sequencerSubdivisions() - 1;
        } else {
          measure = measure - 1;
          beat = sequencerBeats() - 1;
          subdivision = sequencerSubdivisions() - 1;
        }
      } else {
        beat = beat - 1;
        subdivision = sequencerSubdivisions() - 1;
      }
    } else {
      subdivision = subdivision - 1;
    }
  }

  return [measure, beat, subdivision] as PlaybackLocation;
};

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
  Tone.Transport.stop();
  clearInterval(playbackLoop());
  setPlaybackLoop(0);
  const instrument = selectedInstrumentAtom.get();
  if (instrument) {
    instrument.releaseAll(Tone.now());
  }

  const delay = Tone.Time(`0:0:${SUBDIVISION_OFFSET}`).toSeconds();
  setTimeout(() => {
    selectedTiles().forEach((_, key) => {
      anime({
        targets: `#${key}`,
        ...stopAnimation,
      });
    });
  }, delay * 1000);
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

const getVelocity = (note: string) => {
  const midiValue = new Note(note).midi;
  const velocityValue = velocity();

  const interpolatedMidi = midiValue / 127;

  // Cut volume of high end, maintain volume of low end
  const computedInterpolatedMidi = Math.sin((interpolatedMidi * Math.PI) / 2);

  const velocityToSubtract = velocityValue * computedInterpolatedMidi;
  const computedVelocity = velocityValue - velocityToSubtract;

  return computedVelocity;
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

  const delay = Tone.Time(`0:0:${SUBDIVISION_OFFSET}`).toSeconds();
  const toneTime = Tone.now() + delay;

  instrument.triggerRelease(endedSelectedCombinedNotes, toneTime);
  endedSelectedCombinedNotes.forEach((note) => {
    const tileIds: string[] = [];
    let previousPostion = decrementPlaybackLocation(location);
    let previousTileKey: TileKey = `${note}-${previousPostion[0]}-${previousPostion[1]}-${previousPostion[2]}`;
    let previousSelectedTile = selectedTiles().get(previousTileKey);
    while (previousSelectedTile === TileState.Combined) {
      tileIds.push(`#${previousTileKey}`);
      previousPostion = decrementPlaybackLocation(previousPostion);
      previousTileKey = `${note}-${previousPostion[0]}-${previousPostion[1]}-${previousPostion[2]}`;
      previousSelectedTile = selectedTiles().get(previousTileKey);
    }

    if (tileIds.length <= 1) return;

    anime({
      ...stopAnimation,
      targets: tileIds,
      delay: delay * 1000,
    });
  });

  const noteLengthSeconds = 60 / sequencerSubdivisions() / bpm();

  const playedSingleNoteIds = currentSelectedSingleNotes.map((note) => {
    instrument.triggerAttackRelease(
      note,
      noteLengthSeconds,
      toneTime,
      getVelocity(note)
    );
    return `#${note}-${currentMeasure}-${currentBeat}-${currentSubdivision}`;
  });
  anime({
    ...startStopAnimation,
    targets: playedSingleNoteIds,
    delay: delay * 1000,
  });

  newlySelectedCombinedNotes.forEach((note) => {
    instrument.triggerAttack(note, toneTime, getVelocity(note));

    const startDelay = delay * 1000;
    const tileIds: string[] = [];

    let nextPostion = location;
    let nextTileKey: TileKey = `${note}-${currentMeasure}-${currentBeat}-${currentSubdivision}`;
    let nextSelectedTile = selectedTiles().get(nextTileKey);
    while (nextSelectedTile === TileState.Combined) {
      tileIds.push(`#${nextTileKey}`);
      nextPostion = incrementPlaybackLocation(nextPostion);
      nextTileKey = `${note}-${nextPostion[0]}-${nextPostion[1]}-${nextPostion[2]}`;
      nextSelectedTile = selectedTiles().get(nextTileKey);
    }

    if (tileIds.length <= 1) {
      anime({
        ...startStopAnimation,
        targets: tileIds,
        delay: startDelay,
      });
      return;
    }

    anime({
      ...startAnimation,
      targets: tileIds,
      delay: startDelay,
    });
  });
};

export const createPlaybackLoop = () => {
  Tone.Transport.bpm.value = bpm();
  Tone.Transport.start();

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
