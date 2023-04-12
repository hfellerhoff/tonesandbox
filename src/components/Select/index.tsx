import { ParentProps, JSX, splitProps } from "solid-js";
import classes, { type SelectProps } from "./classes";
import { cx } from "class-variance-authority";

export default function Select(
  props: ParentProps<SelectProps & JSX.IntrinsicElements["select"]>
) {
  const [localProps, otherProps] = splitProps(props, ["class"]);

  return (
    <select
      class={cx(
        classes({
          intent: props.intent,
        }),
        localProps.class
      )}
      {...otherProps}
    >
      {props.children}
    </select>
  );
}
