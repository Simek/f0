import { ControllerRenderProps, FieldValues } from "react-hook-form"

import { F0RichTextEditor } from "@/components/RichText/F0RichTextEditor"

import type { F0RichTextField, RichTextValue } from "./types"

interface RichTextFieldRendererProps {
  field: F0RichTextField
  formField: ControllerRenderProps<FieldValues>
}

/**
 * Renders a rich text editor field
 */
export function RichTextFieldRenderer({
  field,
  formField,
}: RichTextFieldRendererProps) {
  const currentValue = formField.value as RichTextValue | undefined

  return (
    <F0RichTextEditor
      title={field.label}
      placeholder={field.placeholder ?? ""}
      maxCharacters={field.maxCharacters}
      mentionsConfig={field.mentionsConfig}
      height={field.height}
      plainHtmlMode={field.plainHtmlMode}
      initialEditorState={{
        content: currentValue?.value ?? "",
      }}
      onChange={(result) => {
        formField.onChange({
          value: result.value,
          mentionIds: result.mentionIds,
        } satisfies RichTextValue)
      }}
    />
  )
}
