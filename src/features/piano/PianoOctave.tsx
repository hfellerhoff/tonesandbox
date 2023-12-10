import { h, Fragment } from "preact";
import type { PianoStyle } from ".";
import PianoKey from "./PianoKey";

interface Props {
  octave: number;
  style: PianoStyle;
  activeNotes: Record<string, boolean>;
  isMouseDown: boolean;
}

const PianoOctave = ({ octave, style, activeNotes, isMouseDown }: Props) => {
  return (
    <div className="flex relative">
      <PianoKey
        note="C"
        octave={octave}
        style={style}
        activeNotes={activeNotes}
        isMouseDown={isMouseDown}
      />
      <PianoKey
        note="C#"
        octave={octave}
        style={style}
        activeNotes={activeNotes}
        isMouseDown={isMouseDown}
      />
      <PianoKey
        note="D"
        octave={octave}
        style={style}
        activeNotes={activeNotes}
        isMouseDown={isMouseDown}
      />
      <PianoKey
        note="D#"
        octave={octave}
        style={style}
        activeNotes={activeNotes}
        isMouseDown={isMouseDown}
      />
      <PianoKey
        note="E"
        octave={octave}
        style={style}
        activeNotes={activeNotes}
        isMouseDown={isMouseDown}
      />
      <PianoKey
        note="F"
        octave={octave}
        style={style}
        activeNotes={activeNotes}
        isMouseDown={isMouseDown}
      />
      <PianoKey
        note="F#"
        octave={octave}
        style={style}
        activeNotes={activeNotes}
        isMouseDown={isMouseDown}
      />
      <PianoKey
        note="G"
        octave={octave}
        style={style}
        activeNotes={activeNotes}
        isMouseDown={isMouseDown}
      />
      <PianoKey
        note="G#"
        octave={octave}
        style={style}
        activeNotes={activeNotes}
        isMouseDown={isMouseDown}
      />
      <PianoKey
        note="A"
        octave={octave}
        style={style}
        activeNotes={activeNotes}
        isMouseDown={isMouseDown}
      />
      <PianoKey
        note="A#"
        octave={octave}
        style={style}
        activeNotes={activeNotes}
        isMouseDown={isMouseDown}
      />
      <PianoKey
        note="B"
        octave={octave}
        style={style}
        activeNotes={activeNotes}
        isMouseDown={isMouseDown}
      />
    </div>
  );
};

export default PianoOctave;
