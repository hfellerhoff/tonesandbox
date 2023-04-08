import { useStore } from "@nanostores/solid";
import { loadingPercentAtom } from "@shared/isLoadingStore";
import { ParentProps, Show } from "solid-js";

export default function LoadingOverlay(props: ParentProps) {
  const loadingPercent = useStore(loadingPercentAtom);

  return (
    <Show
      when={loadingPercent() === 100}
      fallback={
        <div class="fixed w-screen h-screen inset-0 z-50 bg-gray-200 bg-opacity-50 flex flex-col items-center justify-center gap-4">
          <div class="max-w-[100px] bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 w-full bg-gray-200 rounded h-4 relative">
            <div
              class="bg-gray-200 h-full rounded-r-[inherit] absolute right-0"
              style={{
                width: `${100 - loadingPercent()}%`,
              }}
            />
          </div>
        </div>
      }
    >
      {props.children}
    </Show>
  );
}
