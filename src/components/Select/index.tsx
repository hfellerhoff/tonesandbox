import { ParentProps, JSX, splitProps, Accessor, createMemo } from "solid-js";
import classes, { type SelectProps } from "./classes";
import { cx } from "class-variance-authority";

export default function Select(
  props: ParentProps<
    SelectProps &
      Omit<JSX.IntrinsicElements["select"], "value"> & {
        value?: Accessor<string> | string;
      }
  >
) {
  const [localProps, otherProps] = splitProps(props, ["class", "value"]);

  const value = createMemo(() => {
    if (typeof props.value === "string") {
      return props.value;
    } else if (typeof props.value === "function") {
      return props.value();
    }
    return "";
  });

  return (
    <select
      class={cx(
        classes({
          intent: props.intent,
        }),
        localProps.class
      )}
      value={value()}
      {...otherProps}
    >
      {props.children}
    </select>
  );
}
