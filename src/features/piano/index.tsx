import { useEffect, useRef, useState } from "preact/hooks";
import PianoOctave from "./PianoOctave";
import useHandlePlayback from "./useHandlePlayback";
import * as Tone from "tone";

interface Props {
  style?: PianoStyle;
  noScroll?: boolean;
}

export type PianoStyle = {
  width: number;
  height: number;
  gap: number;
};

const octaves = Array(8)
  .fill(1)
  .map((v, i) => v + i);

const Piano = ({
  style = {
    width: 4,
    height: 20,
    gap: 0.5,
  },
  noScroll = false,
}: Props) => {
  const { activeNotes } = useHandlePlayback();
  const pianoRef = useRef<HTMLDivElement>(null);

  const [isMouseDown, setIsMouseDown] = useState(false);

  useEffect(() => {
    if (pianoRef.current && !noScroll) {
      pianoRef.current.scrollTo({
        left: pianoRef.current.clientWidth / 2,
        behavior: "smooth",
      });
    }
  }, [pianoRef, noScroll]);

  useEffect(() => {
    const onMouseDown = () => {
      setIsMouseDown(true);

      if (Tone.context.state !== "running") {
        Tone.context.resume();
      }
    };
    const onMouseUp = () => setIsMouseDown(false);

    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  return (
    <>
      <div
        ref={pianoRef}
        className="flex-1 flex items-center p-16 w-full h-full select-none overflow-auto whitespace-nowrap"
      >
        {octaves.map((octave) => (
          <PianoOctave
            octave={octave}
            style={style}
            activeNotes={activeNotes}
            isMouseDown={isMouseDown}
          />
        ))}
      </div>
    </>
  );
};

export default Piano;
