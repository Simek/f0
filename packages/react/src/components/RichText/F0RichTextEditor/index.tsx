import { experimentalComponent } from "@/lib/experimental"

import { F0RichTextEditor as F0RichTextEditorComponent } from "./F0RichTextEditor"

export * from "./utils/constants"
export * from "./utils/types"
export type {
  RichTextEditorHandle,
  RichTextEditorProps,
} from "./F0RichTextEditor"

/**
 * @experimental This is an experimental component, use it at your own risk
 */
const F0RichTextEditor = experimentalComponent(
  "F0RichTextEditor",
  F0RichTextEditorComponent
)

export { F0RichTextEditor }
