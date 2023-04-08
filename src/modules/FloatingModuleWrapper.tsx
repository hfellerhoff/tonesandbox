import { JSX, onMount } from "solid-js";
import { ParentProps, Show, createSignal } from "solid-js";
import clsx from "clsx";
import type { BaseModule } from ".";

type FloatingModuleWrapperProps = {
  position: BaseModule["position"];
  icon: JSX.Element;
  shouldCollapse?: boolean;
};

const HIDE_MENU_AT_WIDTH = 1000;

export default function FloatingModuleWrapper(
  props: ParentProps<FloatingModuleWrapperProps>
) {
  const shouldCollapse = props.shouldCollapse ?? false;
  const [isExpanded, setIsExpanded] = createSignal(false);

  onMount(() => {
    if (shouldCollapse) return;
    setIsExpanded(window.innerWidth >= HIDE_MENU_AT_WIDTH);
  });

  return (
    <Show
      when={isExpanded()}
      fallback={
        <button
          class={clsx("p-4 absolute bg-white rounded shadow grid", {
            "bottom-4 left-4": props.position === "bottom-left",
            "bottom-4 right-4": props.position === "bottom-right",
            "top-4 left-4": props.position === "top-left",
            "top-4 right-4": props.position === "top-right",
          })}
          onClick={() => setIsExpanded(true)}
        >
          {props.icon}
        </button>
      }
    >
      <div
        class={clsx(
          "flex flex-col gap-2 absolute bg-white py-4 px-4 rounded shadow w-80 z-20 max-h-[90vh] overflow-y-auto",
          {
            "bottom-4 left-4": props.position === "bottom-left",
            "bottom-4 right-4": props.position === "bottom-right",
            "top-4 left-4": props.position === "top-left",
            "top-4 right-4": props.position === "top-right",
          }
        )}
      >
        {props.children}
        <button
          class="py-1 px-2 bg-gray-100 rounded"
          onClick={() => setIsExpanded(false)}
        >
          Close
        </button>
      </div>
    </Show>
  );
}
