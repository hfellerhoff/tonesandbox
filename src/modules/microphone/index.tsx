import FloatingModuleWrapper from "@modules/FloatingModuleWrapper";
import type { BaseModule } from "@modules/index";
import { useStore } from "@nanostores/solid";
import { microphoneStore, setMicrophoneStatus } from "@shared/microphoneStore";
import clsx from "clsx";
import { onMount } from "solid-js";
import * as Tone from "tone";

interface MicrophoneModuleProps extends BaseModule {}

function MicrophoneModule(props: MicrophoneModuleProps) {
  const microphone = useStore(microphoneStore);

  onMount(() => {
    const connectMicrophone = async () => {
      const microphoneToOpen = new Tone.UserMedia();

      const microphone = await microphoneToOpen.open().catch((e) => {
        setMicrophoneStatus("disconnected");
      });

      if (!microphone) {
        setMicrophoneStatus("disconnected");
        return;
      }

      const meter = new Tone.Meter();

      //   microphone.connect(meter).toDestination();

      microphoneStore.set({
        status: "connected",
        microphone,
        meter,
      });
    };

    if (microphone().status !== "connected") {
      connectMicrophone();
    }
  });

  return (
    <FloatingModuleWrapper
      icon={
        <div
          class={clsx("w-3 h-3 rounded-full", {
            "bg-green-600": microphone().status === "connected",
            "bg-yellow-500": microphone().status === "loading",
            "bg-red-600": microphone().status === "disconnected",
          })}
        />
      }
      position={props.position}
      shouldCollapse={true}
    >
      <div class="flex justify-between text-sm">
        <div>
          {microphone().status === "loading"
            ? "Connecting microphone..."
            : microphone().status === "connected"
            ? "Microphone connected"
            : "Microphone not connected"}
        </div>
        <div
          class={clsx("ml-2 w-3 h-3 rounded-full", {
            "bg-green-600": microphone().status === "connected",
            "bg-yellow-500": microphone().status === "loading",
            "bg-red-600": microphone().status === "disconnected",
          })}
        />
      </div>
    </FloatingModuleWrapper>
  );
}

export default MicrophoneModule;
