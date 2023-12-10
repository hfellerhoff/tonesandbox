import clsx from "clsx";
import type { BaseModule } from "..";
import { createEffect, createMemo, createSignal, onMount } from "solid-js";
import FloatingModuleWrapper from "@solid/modules/FloatingModuleWrapper";
import { queueMidiMessage, type MIDIMessage } from "@shared/midiStore";

export type MIDIInput = {
  connection: string;
  id: string;
  manufacturer: string;
  name: string;
  onmidimessage: null | ((message: MIDIMessageEvent) => void);
  onstatechange: null | (() => void);
  state: string;
  type: string;
  version: string;
};

export type MIDIMessageEvent = {
  data: [number, number, number];
};

export type MIDIStatus = "not-connected" | "not-supported" | "connected";

interface MIDIDeviceModuleProps extends BaseModule {}

export default function MIDIDeviceModule(props: MIDIDeviceModuleProps) {
  const [isLoading, setIsLoading] = createSignal(true);
  const [doesSupportMIDI, setDoesSupportMIDI] = createSignal(true);

  const [inputs, setInputs] = createSignal<MIDIInput[]>([]);
  const [inputID, setInputID] = createSignal("0");

  onMount(() => {
    setDoesSupportMIDI(!!(navigator as any).requestMIDIAccess);
    setIsLoading(false);
  });

  createEffect(() => {
    const updateInputs = (access: any) => {
      // Get lists of available MIDI controllers
      const inputIterator = access.inputs.values();

      let input = inputIterator.next();

      const currentInputs = [];
      while (input.value) {
        currentInputs.push(input.value);
        input = inputIterator.next;
      }
      setInputs(currentInputs);

      if (currentInputs.length > 0) {
        setInputID(currentInputs[0].id);
      }
    };
    if (doesSupportMIDI()) {
      (navigator as any).requestMIDIAccess().then(function (access: any) {
        updateInputs(access);
        access.onstatechange = function (e: any) {
          setIsLoading(true);
          updateInputs(access);
          setIsLoading(false);
        };
      });
    } else {
      setDoesSupportMIDI(false);
    }
  });

  createEffect(() => {
    inputs().forEach((input) => (input.onmidimessage = null));

    if (inputs().length > 0) {
      if (!inputs()[0].onmidimessage) {
        inputs()[0].onmidimessage = (rawMessage: any) => {
          const message = Array.from(rawMessage.data) as MIDIMessage;
          queueMidiMessage(message);
        };
      }
    }
  });

  const status = createMemo<MIDIStatus>(() => {
    if (doesSupportMIDI()) {
      if (inputs.length === 0 || isLoading()) {
        return "not-connected";
      }
      return "connected";
    }
    return "not-supported";
  });

  return (
    <FloatingModuleWrapper
      icon={
        <div
          class={clsx("w-3 h-3 rounded-full", {
            "bg-green-600": status() === "connected",
            "bg-yellow-500": status() === "not-connected",
            "bg-red-600": status() === "not-supported",
          })}
        />
      }
      position={props.position}
      shouldCollapse={true}
    >
      <div class="flex items-start justify-between text-sm">
        {status() === "connected" ? (
          <div>
            <p>{inputs()[0].name}</p>
            {/* <Select>
            {inputs.map((input) => (
              <option key={input.id} value={input.id}>
                {input.name}
              </option>
            ))}
          </Select> */}
          </div>
        ) : status() === "not-supported" ? (
          <p>MIDI Not Supported</p>
        ) : (
          <p>No MIDI device connected</p>
        )}
        <div
          class={clsx("ml-2 w-3 h-3 rounded-full", {
            "bg-green-600": status() === "connected",
            "bg-yellow-500": status() === "not-connected",
            "bg-red-600": status() === "not-supported",
          })}
        />
      </div>
    </FloatingModuleWrapper>
  );
}
