export const createSampler = (options: {
  baseUrl: string;
  notes: {
    label: string;
    slug: string;
  }[];
  startOctave: number;
  endOctave: number;
}): {
  urls: Record<string, string>;
  baseUrl: string;
} => {
  const { baseUrl, notes, startOctave, endOctave } = options;

  let pianoNotes: {
    label: string;
    filename: string;
  }[] = [];

  for (let o = startOctave; o <= endOctave; o++) {
    notes.forEach((note) =>
      pianoNotes.push({
        label: `${note.label}${o}`,
        filename: `${note.slug}${o}`,
      })
    );
  }

  return {
    urls: pianoNotes.reduce((acc, cur) => {
      acc[cur.label] = `${cur.filename}.ogg`;
      return acc;
    }, {} as Record<string, string>),
    baseUrl,
  };
};
