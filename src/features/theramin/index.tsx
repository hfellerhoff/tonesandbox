import * as Tone from "tone";
import { For, onMount } from "solid-js";
// @ts-ignore
import Handsfree from "handsfree";
import clsx from "clsx";

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

type Landmark = {
  x: number;
  y: number;
  z: number;
};

export default function TheraminApp() {
  const hands = new Array(2).fill(0).map((_, i) => i);
  const fingers = new Array(22).fill(0).map((_, i) => i);

  onMount(async () => {
    const handsfree = new Handsfree({ hands: true });
    handsfree.start();

    const box = document.getElementById("box");
    const boxes: Record<string, HTMLElement> = {};

    const gain = new Tone.Gain(0).toDestination();
    const tremolo = new Tone.Tremolo(9, 0).connect(gain).start();
    const osc = new Tone.Oscillator().connect(tremolo).start();
    const signal = new Tone.Signal({
      units: "frequency",
    }).connect(osc.frequency);

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
      }
    ) => {
      if (index === FINGERS.CENTER_PALM) {
        const frequencyValue = 100 + fingerState.x * 500;
        const gainValue = 1 - fingerState.y;

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
      }
    ) => {
      const tremoloValue = 1 - fingerState.y;
      const stereoValue = fingerState.x;

      if (index === FINGERS.CENTER_PALM) {
        if (handState.startedPinch) {
          tremolo.depth.rampTo(tremoloValue, 0.1, Tone.now());
        }
        if (handState.releasedPinch) {
          tremolo.depth.rampTo(0, 0.1, Tone.now());
        }
        if (handState.holdingPinch) {
          tremolo.depth.rampTo(tremoloValue, 0.1, Tone.now());
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

        data.hands.landmarksVisible?.forEach((visible, i) => {
          if (visible) {
            data.hands.landmarks[i]?.forEach((landmark, j) => {
              boxes[`${i}-${j}`]?.setAttribute(
                "style",
                `top: ${landmark.y * 100}%; left: ${(1 - landmark.x) * 100}%`
              );
              if (i === 0) {
                handleLeftHandFinger(j, landmark, {
                  startedPinch: data.hands.pinchState?.[i]?.[0] === "start",
                  holdingPinch: data.hands.pinchState?.[i]?.[0] === "held",
                  releasedPinch: data.hands.pinchState?.[i]?.[0] === "released",
                });
              }
              if (i === 1) {
                handleRightHandFinger(j, landmark, {
                  startedPinch: data.hands.pinchState?.[i]?.[0] === "start",
                  holdingPinch: data.hands.pinchState?.[i]?.[0] === "held",
                  releasedPinch: data.hands.pinchState?.[i]?.[0] === "released",
                });
              }
            });
          } else {
            if (i === 1) {
              gain.gain.rampTo(0, 0.1, Tone.now());
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
                    "bg-red-500": hand === 0,
                    "bg-blue-500": hand === 1,
                  }
                )}
              >
                {finger}
              </div>
            )}
          </For>
        )}
      </For>
    </>
  );
}
