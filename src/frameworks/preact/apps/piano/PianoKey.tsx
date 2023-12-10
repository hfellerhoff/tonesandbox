// https://docs.astro.build/en/guides/typescript/#errors-typing-multiple-jsx-frameworks-at-the-same-time
/** @jsxImportSource preact */

import { h, Fragment } from "preact";
import { Note } from "theory.js";
import type { PianoStyle } from ".";
import clsx from "clsx";
import { queueMidiMessage } from "@shared/midiStore";

interface Props {
  note: string;
  octave: number;
  style: PianoStyle;
  activeNotes: Record<string, boolean>;
  isMouseDown: boolean;
}

const PianoKey = ({ note, octave, style, activeNotes, isMouseDown }: Props) => {
  const name = note + octave;

  const isAccidental = note.includes("#") || note.includes("b");

  const width = isAccidental ? style.width / 2 : style.width;
  const height = isAccidental ? style.height / 1.5 : style.height;

  const offset = isAccidental
    ? note === "C#"
      ? 1
      : note === "D#"
      ? 2
      : note === "F#"
      ? 4
      : note === "G#"
      ? 5
      : 6
    : 0;
  const left = offset * style.width - width / 2;

  const isActive = activeNotes[name];

  const playNote = (note: string) => {
    queueMidiMessage([144, new Note(note).midi, 100]);
  };
  const stopNote = (note: string) => {
    queueMidiMessage([128, new Note(note).midi, 100]);
  };

  return (
    <div
      className={clsx(
        "w-3 h-40 rounded border-2 border-gray-100 dark:border-gray-700 flex items-end justify-center pb-4 transition-all",
        {
          "text-gray-700 dark:text-gray-200": !isAccidental,
          "bg-white dark:bg-gray-800 shadow": !isAccidental && !isActive,
          "text-transparent w-8 h-20 absolute": isAccidental,
          "bg-gray-900 dark:bg-gray-900": isAccidental && !isActive,
          "shadow-inner bg-indigo-400 dark:bg-indigo-500": isActive,
        }
      )}
      style={{
        left: `${left}rem`,
        width: `${width}rem`,
        height: `${height}rem`,
      }}
      onMouseDown={() => playNote(name)}
      onMouseUp={() => stopNote(name)}
      onMouseEnter={() => isMouseDown && playNote(name)}
      onMouseLeave={() => stopNote(name)}
      onFocus={() => playNote(name)}
    >
      <p>{name}</p>
    </div>
  );
};

export default PianoKey;
