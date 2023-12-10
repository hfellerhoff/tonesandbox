import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";

const classes = cva(
  "text-sm rounded-md shadow-sm py-1 px-2 block focus:outline-none focus:ring-indigo-500 focus:border-indigo-500",
  {
    variants: {
      intent: {
        primary:
          "bg-white dark:bg-gray-800 dark:text-white border border-gray-300 dark:border-gray-700",
      },
    },
    defaultVariants: {
      intent: "primary",
    },
  }
);

export type SelectProps = VariantProps<typeof classes>;

export default classes;
