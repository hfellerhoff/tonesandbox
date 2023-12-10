import * as Tone from "tone";
import { For, Show, createMemo, createSignal, onMount } from "solid-js";
// @ts-ignore
import Handsfree from "handsfree";
import clsx from "clsx";
import {
  FaRegularHand,
  FaRegularHandLizard,
  FaSolidArrowsLeftRight,
  FaSolidArrowsUpDown,
  FaSolidWaveSquare,
} from "solid-icons/fa";
import FloatingModuleWrapper from "@modules/FloatingModuleWrapper";
import Select from "@components/Select";
import { CgSpinner } from "solid-icons/cg";

enum FINGERS {
  WRIST,
  THUMB_CMC,
  THUMB_MCP,
  THUMB_IP,
  THUMB_TIP,
  INDEX_FINGER_MCP,
  INDEX_FINGER_PIP,
  INDEX_FINGER_DIP,
  INDEX_FINGER_TIP,
  MIDDLE_FINGER_MCP,
  MIDDLE_FINGER_PIP,
  MIDDLE_FINGER_DIP,
  MIDDLE_FINGER_TIP,
  RING_FINGER_MCP,
  RING_FINGER_PIP,
  RING_FINGER_DIP,
  RING_FINGER_TIP,
  PINKY_MCP,
  PINKY_PIP,
  PINKY_DIP,
  PINKY_TIP,
  CENTER_PALM,
}

const defaultParams = {
  flipHorizontal: false,
  outputStride: 16,
  imageScaleFactor: 1,
  maxNumBoxes: 20,
  iouThreshold: 0.2,
  scoreThreshold: 0.4,
  modelType: "ssd320fpnlite",
  modelSize: "large",
  bboxLineWidth: "2",
  fontSize: 17,
};

type ActiveNote = {
  pitch: number;
  volume: number;
  gain: Tone.Gain;
  oscillator: Tone.PWMOscillator;
  signal: Tone.Signal<"frequency">;
};

const MAX_PITCH = 1260;
const MIN_PITCH = 40;

type Prediction = {
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

const frequencies = new Array(120)
  .fill(0)
  .map((_, i) => 40 + i)
  .map((noteNumber) => {
    return 440 * 2 ** ((noteNumber - 69) / 12);
  });

const autotune = (frequency: number) => {
  return frequencies.reduce((prev, curr) => {
    return Math.abs(curr - frequency) < Math.abs(prev - frequency)
      ? curr
      : prev;
  });
};

function clamp(num: number, min: number, max: number) {
  return num <= min ? min : num >= max ? max : num;
}

/**
 * Given a value between 0 and 1, interpolate it to a new range
 */
function interpolate({
  input = 0,
  outputMin = 0,
  outputMax = 1,
  inputMin = 0,
  inputMax = 1,
}) {
  return ((input - inputMin) * (outputMax - outputMin)) / (inputMax - inputMin);
}

const OSCILLATORS = [
  {
    createOscillator: () => new Tone.Oscillator(),
    label: "Oscillator",
  },
  {
    createOscillator: () => new Tone.AMOscillator(),
    label: "AM Oscillator",
  },
  {
    createOscillator: () => new Tone.FMOscillator(),
    label: "FM Oscillator",
  },
  {
    createOscillator: () => new Tone.FatOscillator(),
    label: "Fat Oscillator",
  },
  {
    createOscillator: () => new Tone.PWMOscillator(60, 1),
    label: "Pulse Oscillator",
  },
];

type Landmark = {
  x: number;
  y: number;
  z: number;
};

const CONFIG = {
  VIBRATO_FREQUENCY: {
    MIN: 10,
    MAX: 25,
  },
  VIBRATO_DEPTH: {
    MIN: 0.45,
    MAX: 0.8,
  },
};

type VibratoConfig = {
  frequency: number;
  depth: number;
};
function getVibratoConfig(input: number): VibratoConfig {
  const { VIBRATO_FREQUENCY, VIBRATO_DEPTH } = CONFIG;

  const frequency = interpolate({
    input,
    outputMin: VIBRATO_FREQUENCY.MIN,
    outputMax: VIBRATO_FREQUENCY.MAX,
  });

  const depth = interpolate({
    input,
    outputMin: VIBRATO_DEPTH.MIN,
    outputMax: VIBRATO_DEPTH.MAX,
  });

  return {
    frequency,
    depth,
  };
}

const createAudioElements = ({
  oscillatorName,
  vibratoConfig,
}: {
  oscillatorName: string;
  vibratoConfig: VibratoConfig;
}) => {
  const oscillator = OSCILLATORS.find(
    (osc) => osc.label === oscillatorName
  )!.createOscillator();

  const gain = new Tone.Gain(0).toDestination();
  const vibrato = new Tone.Vibrato(
    vibratoConfig.frequency,
    vibratoConfig.depth
  ).connect(gain);
  const tremolo = new Tone.Tremolo(9, 0).connect(vibrato).start();
  const crusher = new Tone.BitCrusher(16).connect(tremolo);
  const osc = oscillator.connect(crusher).start();
  const signal = new Tone.Signal({
    units: "frequency",
  }).connect(osc.frequency);

  return {
    gain,
    vibrato,
    tremolo,
    crusher,
    osc,
    signal,
  };
};

export default function ThereminApp() {
  const hands = new Array(2).fill(0).map((_, i) => i);
  const fingers = new Array(22).fill(0).map((_, i) => i);
  const [hasHandsShowing, setHasHandsShowing] = createSignal(false);
  const [hasLoadedModel, setHasLoadedModel] = createSignal(false);

  const [vibratoValue, setVibratoValue] = createSignal(0.5);
  const [audioElements, setAudioElements] = createSignal(
    createAudioElements({
      oscillatorName: "Oscillator",
      vibratoConfig: getVibratoConfig(vibratoValue()),
    })
  );

  const onChangeOscillator = (event: Event) => {
    const template = (event.target as HTMLSelectElement).value;

    const { gain, vibrato, tremolo, crusher, osc, signal } = audioElements();
    signal.dispose();
    osc.dispose();
    crusher.dispose();
    tremolo.dispose();
    vibrato.dispose();
    gain.dispose();

    setAudioElements(
      createAudioElements({
        oscillatorName: template,
        vibratoConfig: getVibratoConfig(vibratoValue()),
      })
    );
  };

  onMount(async () => {
    const handsfree = new Handsfree({ hands: true });
    handsfree.on("handsModelReady", () => {
      setHasLoadedModel(true);
    });
    handsfree.start();

    const box = document.getElementById("box");
    const boxes: Record<string, HTMLElement> = {};

    for (const hand of hands) {
      for (const finger of fingers) {
        boxes[`${hand}-${finger}`] = document.getElementById(
          `${hand}-${finger}`
        )!;
      }
    }

    const handleRightHandFinger = (
      index: number,
      fingerState: Landmark,
      handState: {
        startedPinch: boolean;
        holdingPinch: boolean;
        releasedPinch: boolean;
      },
      { gain, tremolo, signal }: ReturnType<typeof audioElements>
    ) => {
      if (index === FINGERS.CENTER_PALM) {
        const frequencyValue = 100 + fingerState.x * 500;
        const gainAdjustment = 100 / frequencyValue;
        const gainValue = 1 - fingerState.y + gainAdjustment;

        if (handState.startedPinch) {
          signal.rampTo(frequencyValue, 0.1, Tone.now());
          gain.gain.rampTo(gainValue, 0.1, Tone.now());
          tremolo.depth.rampTo(0, 0.1, Tone.now());
        }
        if (handState.releasedPinch) {
          gain.gain.rampTo(0, 0.1, Tone.now());
        }
        if (handState.holdingPinch) {
          gain.gain.rampTo(gainValue, 0.1, Tone.now());
          signal.rampTo(frequencyValue, 0.1, Tone.now());
        }
      }
    };

    const handleLeftHandFinger = (
      index: number,
      fingerState: Landmark,
      handState: {
        startedPinch: boolean;
        holdingPinch: boolean;
        releasedPinch: boolean;
      },
      { tremolo, crusher }: ReturnType<typeof audioElements>
    ) => {
      const tremoloValue = 1 - fingerState.y;
      const crusherValue = clamp(Math.round(fingerState.x ** 2 * 16), 1, 16);

      if (index === FINGERS.CENTER_PALM) {
        if (handState.startedPinch) {
          tremolo.depth.rampTo(tremoloValue, 0.1, Tone.now());
          crusher.bits.rampTo(crusherValue, 0.1, Tone.now());
        }
        if (handState.releasedPinch) {
          tremolo.depth.rampTo(0, 0.1, Tone.now());
          crusher.bits.rampTo(16, 0.1, Tone.now());
        }
        if (handState.holdingPinch) {
          tremolo.depth.rampTo(tremoloValue, 0.1, Tone.now());
          crusher.bits.rampTo(crusherValue, 0.1, Tone.now());
        }
      }
    };

    handsfree.use(
      "logger",
      (data: {
        hands: {
          landmarksVisible: boolean[];
          landmarks: Landmark[][];
          pinchState: string[][];
        };
      }) => {
        if (!data.hands) {
          return;
        }

        const toneAudioElements = audioElements();

        const updatedHasHandsShowing = data.hands.landmarksVisible?.some(
          (visible) => visible
        );
        setHasHandsShowing(updatedHasHandsShowing);

        data.hands.landmarksVisible?.forEach((visible, i) => {
          const handContainer = document.getElementById(`hand-${i}`);
          if (visible) {
            data.hands.landmarks[i]?.forEach((landmark, j) => {
              boxes[`${i}-${j}`]?.setAttribute(
                "style",
                `top: ${landmark.y * 100}%; left: ${(1 - landmark.x) * 100}%`
              );
              if (i === 0) {
                handleLeftHandFinger(
                  j,
                  landmark,
                  {
                    startedPinch: data.hands.pinchState?.[i]?.[0] === "start",
                    holdingPinch: data.hands.pinchState?.[i]?.[0] === "held",
                    releasedPinch:
                      data.hands.pinchState?.[i]?.[0] === "released",
                  },
                  toneAudioElements
                );
              }
              if (i === 1) {
                handleRightHandFinger(
                  j,
                  landmark,
                  {
                    startedPinch: data.hands.pinchState?.[i]?.[0] === "start",
                    holdingPinch: data.hands.pinchState?.[i]?.[0] === "held",
                    releasedPinch:
                      data.hands.pinchState?.[i]?.[0] === "released",
                  },
                  toneAudioElements
                );
              }
            });

            if (handContainer && handContainer.style.display !== "block") {
              handContainer.setAttribute("style", "display: block");
            }
          } else {
            if (i === 1) {
              toneAudioElements.gain.gain.rampTo(0, 0.1, Tone.now());
            }
            if (handContainer && handContainer.style.display !== "none") {
              handContainer.setAttribute("style", "display: none");
            }
          }
        });
      }
    );
  });

  return (
    <>
      <Show
        when={hasLoadedModel()}
        fallback={
          <div
            class={clsx(
              "text-gray-400 dark:text-gray-700 text-center flex flex-col gap-2 items-center transition-opacity select-none"
            )}
          >
            <div class="flex gap-2 items-center">
              <CgSpinner size={32} class="animate-spin" />
            </div>
            <div class="max-w-[230px]">
              Loading the theremin... this may take a few seconds.
            </div>
          </div>
        }
        keyed
      >
        <div
          class={clsx(
            "text-gray-400 dark:text-gray-700 text-center flex flex-col gap-2 items-center transition-opacity select-none",
            {
              "opacity-0": hasHandsShowing(),
              "opacity-100": !hasHandsShowing(),
              hidden: !hasLoadedModel(),
            }
          )}
        >
          <div class="flex gap-2 items-center">
            <FaRegularHand class="scale-x-[-1] w-12 h-12" />
            <FaRegularHand class="w-12 h-12" />
          </div>
          <div class="max-w-[230px]">
            Pinch your fingers together in front of your camera to start making
            music!
          </div>
        </div>
      </Show>
      <For each={hands}>
        {(hand) => (
          <div id={`hand-${hand}`}>
            <For each={fingers}>
              {(finger) => (
                <div
                  id={`${hand}-${finger}`}
                  class={clsx(
                    "absolute rounded-full h-4 w-4 text-white grid place-items-center",
                    {
                      "bg-red-500 dark:bg-red-400": hand === 0,
                      "bg-blue-500 dark:bg-blue-400": hand === 1,
                      hidden: !hasHandsShowing() || !hasLoadedModel(),
                    }
                  )}
                />
              )}
            </For>
          </div>
        )}
      </For>
      <FloatingModuleWrapper icon={<FaSolidWaveSquare />} position="top-right">
        <label
          for="scale-select"
          class="block text-sm font-medium text-gray-500 dark:text-gray-400"
        >
          Sound
        </label>
        <Select id="scale-select" onChange={onChangeOscillator}>
          <For each={OSCILLATORS}>
            {(template) => (
              <option value={template.label}>{template.label}</option>
            )}
          </For>
        </Select>
        <label
          for="vibrato-slider"
          class="mt-2 block text-sm font-medium text-gray-500 dark:text-gray-400"
        >
          Vibrato
        </label>
        <input
          id="vibrato-slider"
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={vibratoValue()}
          onChange={(e) => {
            const newValue = parseFloat(e.target.value);
            setVibratoValue(newValue);

            const { frequency, depth } = getVibratoConfig(newValue);
            const { vibrato } = audioElements();

            vibrato.frequency.rampTo(frequency, 0.1, Tone.now());
            vibrato.depth.rampTo(depth, 0.1, Tone.now());
          }}
        />
      </FloatingModuleWrapper>
      <FloatingModuleWrapper
        icon={<FaRegularHand class="scale-x-[-1]" />}
        position="bottom-left"
      >
        <div class="text-8 font-bold uppercase text-gray-400 dark:text-gray-500">
          Left Hand
        </div>
        <div class="flex flex-col gap-1 mb-2">
          <div class="flex items-center gap-2">
            <FaRegularHandLizard /> Start/Stop Effects
          </div>
          <div class="flex items-center gap-2">
            <FaSolidArrowsUpDown /> Tremolo
          </div>
          <div class="flex items-center gap-2">
            <FaSolidArrowsLeftRight /> Bitcrusher
          </div>
        </div>
      </FloatingModuleWrapper>
      <FloatingModuleWrapper icon={<FaRegularHand />} position="bottom-right">
        <div class="text-8 font-bold uppercase text-gray-400 dark:text-gray-500">
          Right Hand
        </div>
        <div class="flex flex-col gap-1 mb-2">
          <div class="flex items-center gap-2">
            <FaRegularHandLizard /> Start/Stop Pitch
          </div>
          <div class="flex items-center gap-2">
            <FaSolidArrowsUpDown /> Volume
          </div>
          <div class="flex items-center gap-2">
            <FaSolidArrowsLeftRight /> Frequency
          </div>
        </div>
      </FloatingModuleWrapper>
    </>
  );
}
