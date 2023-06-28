import * as Tone from "tone";
import { For, createMemo, createSignal, onMount } from "solid-js";
// @ts-ignore
import Handsfree from "handsfree";
import clsx from "clsx";
import {
  FaRegularHand,
  FaRegularHandLizard,
  FaSolidArrowsLeftRight,
  FaSolidArrowsUpDown,
  FaSolidMapPin,
  FaSolidWaveSquare,
} from "solid-icons/fa";
import FloatingModuleWrapper from "@modules/FloatingModuleWrapper";
import Select from "@components/Select";

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

const createAudioElements = (template: string) => {
  const oscillator = OSCILLATORS.find(
    (osc) => osc.label === template
  )!.createOscillator();

  const gain = new Tone.Gain(0).toDestination();
  const tremolo = new Tone.Tremolo(9, 0).connect(gain).start();
  const crusher = new Tone.BitCrusher(16).connect(tremolo);
  const osc = oscillator.connect(crusher).start();
  const signal = new Tone.Signal({
    units: "frequency",
  }).connect(osc.frequency);

  return {
    gain,
    tremolo,
    crusher,
    osc,
    signal,
  };
};

export default function TheraminApp() {
  const hands = new Array(2).fill(0).map((_, i) => i);
  const fingers = new Array(22).fill(0).map((_, i) => i);

  const [audioElements, setAudioElements] = createSignal(
    createAudioElements("Oscillator")
  );

  const onChangeOscillator = (event: Event) => {
    const template = (event.target as HTMLSelectElement).value;

    const { gain, tremolo, crusher, osc, signal } = audioElements();
    signal.dispose();
    osc.dispose();
    crusher.dispose();
    tremolo.dispose();
    gain.dispose();

    setAudioElements(createAudioElements(template));
  };

  onMount(async () => {
    const handsfree = new Handsfree({ hands: true });
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

        data.hands.landmarksVisible?.forEach((visible, i) => {
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
          } else {
            if (i === 1) {
              toneAudioElements.gain.gain.rampTo(0, 0.1, Tone.now());
            }
          }
        });
      }
    );
  });

  return (
    <>
      <For each={hands}>
        {(hand) => (
          <For each={fingers}>
            {(finger) => (
              <div
                id={`${hand}-${finger}`}
                class={clsx(
                  "absolute rounded-full h-4 w-4 text-white grid place-items-center",
                  {
                    "bg-red-500 dark:bg-red-400": hand === 0,
                    "bg-blue-500 dark:bg-blue-400": hand === 1,
                  }
                )}
              />
            )}
          </For>
        )}
      </For>
      <FloatingModuleWrapper icon={<FaSolidWaveSquare />} position="top-right">
        <label
          for="scale-select"
          class="block text-sm font-medium text-gray-500 dark:text-gray-400"
        >
          Scale
        </label>
        <Select id="scale-select" onChange={onChangeOscillator}>
          <For each={OSCILLATORS}>
            {(template) => (
              <option value={template.label}>{template.label}</option>
            )}
          </For>
        </Select>
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
