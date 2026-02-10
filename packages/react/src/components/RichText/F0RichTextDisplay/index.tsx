import { experimentalComponent } from "@/lib/experimental"

import { F0RichTextDisplay as F0RichTextDisplayComponent } from "./F0RichTextDisplay"

export type {
  RichTextDisplayHandle,
  RichTextDisplayProps,
} from "./F0RichTextDisplay"

/**
 * @experimental This is an experimental component, use it at your own risk
 */
const F0RichTextDisplay = experimentalComponent(
  "F0RichTextDisplay",
  F0RichTextDisplayComponent
)

export { F0RichTextDisplay }
