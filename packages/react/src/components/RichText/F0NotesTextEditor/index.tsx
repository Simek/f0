import { experimentalComponent } from "@/lib/experimental"

import {
  F0NotesTextEditor as F0NotesTextEditorComponent,
  F0NotesTextEditorSkeleton,
} from "./F0NotesTextEditor"

export { F0NotesTextEditorSkeleton }
export type {
  NotesTextEditorHandle,
  NotesTextEditorProps,
  NotesTextEditorSkeletonProps,
  HeaderStatusProps,
  ImageUploadConfig,
  enhanceConfig,
  EnhancementOption,
  Message,
  User,
} from "./F0NotesTextEditor"

/**
 * @experimental This is an experimental component, use it at your own risk
 */
const F0NotesTextEditor = experimentalComponent(
  "F0NotesTextEditor",
  F0NotesTextEditorComponent
)

export { F0NotesTextEditor }
