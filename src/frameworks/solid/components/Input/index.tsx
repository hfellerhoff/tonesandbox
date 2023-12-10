import { ParentProps, JSX, splitProps } from "solid-js";
import classes, { type InputProps } from "./classes";
import { cx } from "class-variance-authority";

export default function Input(
  props: ParentProps<InputProps & JSX.IntrinsicElements["input"]>
) {
  const [localProps, otherProps] = splitProps(props, ["class"]);

  return (
    <input
      class={cx(
        classes({
          intent: props.intent,
        }),
        localProps.class
      )}
      {...otherProps}
    >
      {props.children}
    </input>
  );
}
