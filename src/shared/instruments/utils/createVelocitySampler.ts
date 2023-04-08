import * as Tone from "tone";

const getVelocitySamplerConfig = ({
  baseUrl,
  notes,
  startOctave,
  endOctave,
  velocity,
}: {
  baseUrl: string;
  notes: string[];
  startOctave: number;
  endOctave: number;
  velocity: number;
}): {
  urls: Record<string, string>;
  baseUrl: string;
} => {
  let pianoNotes: string[] = [];

  for (let o = startOctave; o <= endOctave; o++) {
    notes.forEach((note) => pianoNotes.push(`${note}${o}`));
  }

  return {
    urls: pianoNotes.reduce((acc, cur) => {
      const filename = `${cur}v${velocity}.ogg`;

      let noteName = cur;
      if (cur[1] === "s") noteName = cur[0] + "#" + cur[2];

      acc[noteName] = filename;
      return acc;
    }, {} as Record<string, string>),
    baseUrl,
  };
};

export const createVelocitySampler = (
  velocity: number,
  onload?: () => void
) => {
  return new Tone.Sampler({
    ...getVelocitySamplerConfig({
      baseUrl: "/assets/instruments/piano/",
      notes: ["A", "C", "Ds", "Fs"],
      startOctave: 1,
      endOctave: 7,
      velocity,
    }),
    release: 1,
    onload,
    onerror: (e) => console.log(e),
  });
};
