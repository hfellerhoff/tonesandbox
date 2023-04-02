import type { JSX } from "solid-js";

export default function Button(props: JSX.IntrinsicElements["button"]) {
  return (
    <button
      class="px-4 py-2 shadow-md rounded-md bg-gray-100 active:translate-y-0.5 active:shadow"
      {...props}
    />
  );
}
