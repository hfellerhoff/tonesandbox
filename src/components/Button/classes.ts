import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";

const classes = cva(
  "py-2 px-2 font-medium rounded active:translate-y-0.5 flex items-center justify-center gap-2 text-sm",
  {
    variants: {
      intent: {
        primary:
          "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100",
      },
    },
    defaultVariants: {
      intent: "primary",
    },
  }
);

export type ButtonProps = VariantProps<typeof classes>;

export default classes;
