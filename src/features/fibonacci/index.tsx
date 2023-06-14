import Button from "@components/Button";
import Input from "@components/Input";
import { createSignal, onMount } from "solid-js";
import * as Tone from 'tone';
import { Vex, Stave, StaveNote, Formatter } from "vexflow";

function fib(n: number, cache: number[] = [0, 1]): [number, number[]] {
    if(cache[n] === undefined){
        cache[n] = fib(n-1, cache)[0] + fib(n-2, cache)[0];
    }

    return [cache[n], cache];
}

function fibonacci(n: number) {
    return fib(n)[1];
}

const NOTES = [
    'C',
    'C#',
    'D',
    'D#',
    'E',
    'F',
    'F#',
    'G',
    'G#',
    'A',
    'A#',
    'B'
]

const NOTES_IN_SCALE = NOTES.length

function generateNotes(length: number, mod: number = 24, baseOctave: number = 3) {
    const notes = fibonacci(length).map((noteIndex) => {
        const notePartialMod = noteIndex % mod;
        const octaveModifier = Math.floor(notePartialMod / NOTES_IN_SCALE);
        
        const note = NOTES[noteIndex % NOTES_IN_SCALE];
        const octave = baseOctave + octaveModifier;

        return `${note}/${octave}`;
    });

    return notes;
}

const BASE_STAVE_WIDTH = 80;
const NOTE_WIDTH = 25;
const EXTRA_OCTAVE_HEIGHT = 50;

export default function FibonacciPage() {
    const [numberOfNotes, setNumberOfNotes] = createSignal<number>(16);
    const [mod, setMod] = createSignal<number>(24);
    const [notes, setNotes] = createSignal<string[]>(generateNotes(numberOfNotes(), mod()));
    const [isPlaying, setIsPlaying] = createSignal<boolean>(false);
    const [synth, setSynth] = createSignal<Tone.Synth | null>(null);
    const [baseOctave, setBaseOctave] = createSignal<number>(3);

    const start = () => {
        if (!synth()) {
            setSynth(new Tone.Synth().toDestination());
        }

        const now = Tone.now();

        const playableNotes = notes().map((note) => {
            const [name, octave] = note.split('/');
            const octaveNumber = parseInt(octave);
            return name + octaveNumber;
        });

        playableNotes.forEach((note, i) => {
            synth()!.triggerAttackRelease(note, '8n', now + i * 0.25);
        });
   };

   const stop = () => {
        synth()?.disconnect();
        synth()?.dispose();
        setSynth(null);
    }

    const togglePlayback = () => {
        if (isPlaying()) {
            stop();
            setIsPlaying(false);
        }
        else {
            start();
            setIsPlaying(true);
        }
    }

  const renderScore = () => {
    // Create an SVG renderer and attach it to the DIV element named "vf".
    const parentDiv = document.getElementById("vf") as HTMLDivElement | null;
    if (!parentDiv) return;
    parentDiv.innerHTML = "";

    const isDarkMode = document.getElementsByTagName('html').item(0)?.classList.contains('dark');

    const childDiv = document.createElement("div");
    childDiv.style.width = "max-content";
    childDiv.style.marginInline = "auto";
    parentDiv.appendChild(childDiv);
    const renderer = new Vex.Flow.Renderer(childDiv, Vex.Flow.Renderer.Backends.SVG);

    // Configure the rendering context.
    const width = BASE_STAVE_WIDTH + (NOTE_WIDTH * numberOfNotes());
    let height = 180;

    const topOctave = baseOctave() + Math.floor(mod() / 12);
    const extraOctavesBelow = Math.max(0, 3 - baseOctave());
    if (extraOctavesBelow > 0) {
        height += (EXTRA_OCTAVE_HEIGHT * extraOctavesBelow);
    }
    const extraOctavesAbove = Math.max(0, topOctave - 5);
    if (extraOctavesAbove > 0) {
        height += (EXTRA_OCTAVE_HEIGHT * extraOctavesAbove);
    }

    const topOffset = extraOctavesAbove > extraOctavesBelow ? (extraOctavesAbove - extraOctavesBelow) * (EXTRA_OCTAVE_HEIGHT) : 0;

    renderer.resize(width, height);
    const context = renderer.getContext();
    context.setFont("Arial", 10);
    context.setFillStyle(isDarkMode ? "#FFF" : '#000');
    context.setStrokeStyle(isDarkMode ? "#FFF" : '#000');

    const trebleStave = new Stave(10, topOffset, width - 10);
    const bassStave = new Stave(10, topOffset + 65, width - 10);

    // Add a clef and time signature.
    trebleStave.addClef("treble").addTimeSignature("4/4");
    bassStave.addClef("bass").addTimeSignature("4/4");

    // Connect it to the rendering context and draw!
    trebleStave.setContext(context).draw();
    bassStave.setContext(context).draw();

    const [bassNotes, trebleNotes] = notes().reduce(([bassAcc, trebleAcc], note) => {
        const [, octave] = note.split('/');
        const octaveNumber = parseInt(octave);

        if (octaveNumber <= 3) {
            trebleAcc.push(null);
            bassAcc.push(note);
        }
        else {
            trebleAcc.push(note);
            bassAcc.push(null);
        }

        return [bassAcc, trebleAcc];
    }, [[], []] as [(string | null)[], (string | null)[]]);


    const trebleNotesToDraw = trebleNotes.map((note) => {
        if (!note) return new StaveNote({
            clef: "treble",
            keys: ["b/4"],
            duration: "qr",
        }).setStyle({
            fillStyle: "transparent",
        })

        return new StaveNote({
            clef: "treble",
            keys: [note],
            duration: "q",
        })
    });
    const bassNotesToDraw = bassNotes.map((note) => {
        if (!note) return new StaveNote({
            clef: "bass",
            keys: ["d/3"],
            duration: "qr",
        }).setStyle({
            fillStyle: "transparent",
        })

        return new StaveNote({
            clef: "bass",
            keys: [note],
            duration: "q",
        });
    });

    // Helper function to justify and draw a 4/4 voice.
    Formatter.FormatAndDraw(context, trebleStave, trebleNotesToDraw);
    Formatter.FormatAndDraw(context, bassStave, bassNotesToDraw);
  }

  const refresh = () => {
    setNotes(generateNotes(numberOfNotes(), mod(), baseOctave()));
    renderScore()
  }

  onMount(() => {
    renderScore();
  })

  return (
    <div class="w-full h-full overflow-y-scroll flex flex-col items-center justify-center dark:text-white">
        <div id="vf" class="w-full overflow-x-scroll px-4 lg:px-8 box-border" />
        <div class='mt-4 max-w-sm mx-auto w-full px-4'>
            <fieldset class="bg-gray-50 dark:bg-gray-800 rounded border border-solid border-gray-300 dark:border-gray-700 px-4 pt-2 pb-4">
                <legend># of notes</legend>
                <Input value={numberOfNotes()} onChange={(e) => {
                    const value = parseInt(e.currentTarget.value);
                    setNumberOfNotes(value);
                    refresh();
                }} />
            </fieldset>
            <fieldset class="bg-gray-50 dark:bg-gray-800 rounded border border-solid border-gray-300 dark:border-gray-700 px-4 pt-2 pb-4">
                <legend>Mod #</legend>
                <Input value={mod()} onChange={(e) => {
                    const value = parseInt(e.currentTarget.value);
                    setMod(value);
                    refresh();
                }} />
            </fieldset>
            <fieldset class="bg-gray-50 dark:bg-gray-800 rounded border border-solid border-gray-300 dark:border-gray-700 px-4 pt-2 pb-4">
                <legend>Base Octave</legend>
                <Input value={baseOctave()} onChange={(e) => {
                    const value = parseInt(e.currentTarget.value);
                    setBaseOctave(value);
                    refresh();
                }} />
            </fieldset>
            <div class="grid place-items-center mt-4">
                <button onClick={togglePlayback} class="w-full py-3 px-4 font-medium rounded active:translate-y-0.5 flex items-center justify-center gap-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100">
                    {isPlaying() ? 'Stop' : 'Play'}
                </button>
            </div>
        </div>
    </div>
  );
}