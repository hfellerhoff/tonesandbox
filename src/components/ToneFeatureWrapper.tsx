import { useStore } from "@nanostores/solid";
import { isToneStartedStore, setToneIsReady } from "@shared/isToneStartedStore";
import { FaSolidPlay } from "solid-icons/fa";
import { ParentProps, Show } from "solid-js";
import * as Tone from "tone";

export default function ToneFeatureWrapper(
  props: ParentProps<{ onStart?: () => void }>
) {
  const isToneReady = useStore(isToneStartedStore);

  const onStart = async () => {
    await Tone.start();
    if (props.onStart) {
      props.onStart();
    }
    setToneIsReady();
  };

  return (
    <Show
      when={isToneReady()}
      fallback={
        <div class="absolute inset-0 z-50 bg-gray-200 grid place-items-center">
          <button
            onClick={onStart}
            class="p-8 shadow-lg rounded-full bg-gray-100 active:translate-y-0.5 active:shadow"
          >
            <FaSolidPlay size={24} />
          </button>
        </div>
      }
    >
      {props.children}
    </Show>
  );
}
