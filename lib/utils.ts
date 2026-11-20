import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

/**
 * Our text styles (globals.css `@utility text-*`) bundle size, weight and line
 * height. tailwind-merge doesn't know them, so it mistook them for text
 * *colours* and dropped them whenever a colour class followed. Registering them
 * as their own group stops that, and lets a later text style override an
 * earlier one.
 */
const twMerge = extendTailwindMerge<"text-style">({
  extend: {
    classGroups: {
      "text-style": [
        {
          text: [
            "display-large",
            "display-medium",
            "heading-large",
            "heading-medium",
            "heading-small",
            "body-medium",
            "body-medium-strong",
            "body-small",
            "body-small-strong",
            "label-xsmall-strong",
          ],
        },
      ],
    },
    conflictingClassGroups: {
      "text-style": ["font-size", "font-weight", "leading"],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
