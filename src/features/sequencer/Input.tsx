import type { JSX } from "solid-js";

export default function Input(props: JSX.IntrinsicElements["input"]) {
  return <input class="w-16 rounded-sm py-0.5 px-1 text-end" {...props} />;
}
