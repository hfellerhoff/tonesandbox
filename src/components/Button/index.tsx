import { ParentProps, JSX, splitProps } from "solid-js";
import classes, { type ButtonProps } from "./classes";
import { cx } from "class-variance-authority";

export default function Button(
  props: ParentProps<ButtonProps & JSX.IntrinsicElements["button"]>
) {
  const [localProps, otherProps] = splitProps(props, ["class"]);

  return (
    <button
      class={cx(
        classes({
          intent: props.intent,
        }),
        localProps.class
      )}
      {...otherProps}
    >
      {props.children}
    </button>
  );
}
