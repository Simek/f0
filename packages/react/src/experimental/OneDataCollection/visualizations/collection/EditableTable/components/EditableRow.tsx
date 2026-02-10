import { forwardRef, useEffect, useMemo, useState } from "react"

import { FiltersDefinition } from "@/components/OneFilterPicker/types"
import { Input } from "@/experimental/Forms/Fields/Input"
import { DataCollectionSource } from "@/experimental/OneDataCollection/hooks/useDataCollectionSource/types"
import { ItemActionsDefinition } from "@/experimental/OneDataCollection/item-actions"
import { NavigationFiltersDefinition } from "@/experimental/OneDataCollection/navigationFilters/types"
import { SummariesDefinition } from "@/experimental/OneDataCollection/summary"
import { TableCell, TableRow } from "@/experimental/OneTable"
import {
  GroupingDefinition,
  RecordType,
  SortingsDefinition,
} from "@/hooks/datasource"
import { useI18n } from "@/lib/providers/i18n"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/ui/checkbox"

import { renderProperty } from "@/experimental/OneDataCollection/property-render"
import type { EditableTableColumnDefinition } from "../types"

import { NestedRow } from "../../Table/components/NestedRow"
import { type RowProps } from "../../Table/components/Row"
import { useSticky } from "../../Table/useSticky"

function getCellValue<R extends RecordType>(
  item: R,
  column: EditableTableColumnDefinition<
    R,
    SortingsDefinition,
    SummariesDefinition
  >
): string {
  if (column.id !== undefined && column.id in item) {
    const v = item[column.id as keyof R]
    return v === null || v === undefined ? "" : String(v)
  }
  const rendered = column.render(item)
  if (typeof rendered === "string") return rendered
  if (typeof rendered === "number") return String(rendered)
  return ""
}

export type EditableRowProps<
  R extends RecordType,
  Filters extends FiltersDefinition,
  Sortings extends SortingsDefinition,
  Summaries extends SummariesDefinition,
  ItemActions extends ItemActionsDefinition<R>,
  NavigationFilters extends NavigationFiltersDefinition,
  Grouping extends GroupingDefinition<R>,
> = Omit<
  RowProps<
    R,
    Filters,
    Sortings,
    Summaries,
    ItemActions,
    NavigationFilters,
    Grouping
  >,
  "columns"
> & {
  columns: ReadonlyArray<EditableTableColumnDefinition<R, Sortings, Summaries>>
  onCellChange?: (updatedItem: R) => void | Promise<void>
}

const EditableRowInner = <
  R extends RecordType,
  Filters extends FiltersDefinition,
  Sortings extends SortingsDefinition,
  Summaries extends SummariesDefinition,
  ItemActions extends ItemActionsDefinition<R>,
  NavigationFilters extends NavigationFiltersDefinition,
  Grouping extends GroupingDefinition<R>,
>(
  props: EditableRowProps<
    R,
    Filters,
    Sortings,
    Summaries,
    ItemActions,
    NavigationFilters,
    Grouping
  >,
  ref: React.ForwardedRef<HTMLTableRowElement>
) => {
  const {
    source,
    item,
    onCheckedChange,
    selectedItems,
    columns,
    frozenColumnsLeft,
    checkColumnWidth,
    index,
    groupIndex,
    nestedRowProps,
    noBorder = false,
    loading = false,
    disableHover = false,
    tableWithChildren,
    onCellChange,
  } = props

  const i18n = useI18n()
  const id = source.selectable ? source.selectable(item) : undefined
  const rowWithChildren = !!source.itemsWithChildren?.(item)
  const hasChildrenLoaded =
    nestedRowProps?.hasLoadedChildren === undefined ||
    nestedRowProps?.hasLoadedChildren

  // Local copy of the item so typing updates immediately (parent/cache update is async)
  const [localItem, setLocalItem] = useState<R>(item)

  // Per-column error messages (keyed by column id)
  const [cellErrors, setCellErrors] = useState<Record<string, string>>({})

  // Sync from parent when the item reference changes (e.g. different row or refetch)
  useEffect(() => {
    setLocalItem(item)
    setCellErrors({})
  }, [item])

  const getDisplayValue = (
    column: EditableTableColumnDefinition<
      R,
      SortingsDefinition,
      SummariesDefinition
    >
  ) => {
    return getCellValue(localItem, column)
  }

  const handleCellChange = (
    column: EditableTableColumnDefinition<
      R,
      SortingsDefinition,
      SummariesDefinition
    >,
    value: string
  ) => {
    const updatedItem =
      column.id !== undefined
        ? ({ ...localItem, [column.id]: value } as R)
        : localItem

    setLocalItem(updatedItem)

    // Clear previous error for this column
    if (column.id && column.id in cellErrors) {
      setCellErrors((prev) => {
        const { [column.id!]: _, ...rest } = prev
        return rest
      })
    }

    try {
      const result = onCellChange?.(updatedItem)

      // Handle async onCellChange that returns a rejected promise
      if (result instanceof Promise) {
        result.catch((error: unknown) => {
          if (column.id) {
            setCellErrors((prev) => ({
              ...prev,
              [column.id!]:
                error instanceof Error ? error.message : "Save failed",
            }))
          }
        })
      }
    } catch (error) {
      // Handle synchronous errors
      if (column.id) {
        setCellErrors((prev) => ({
          ...prev,
          [column.id!]: error instanceof Error ? error.message : "Save failed",
        }))
      }
    }
  }

  const sourceWithoutItemActions = useMemo(
    (): DataCollectionSource<
      R,
      Filters,
      Sortings,
      Summaries,
      ItemActions,
      NavigationFilters,
      Grouping
    > => ({ ...source, itemActions: undefined }),
    [source]
  )

  const { getStickyPosition } = useSticky(
    frozenColumnsLeft,
    columns,
    !!source.selectable
  )

  if (rowWithChildren && hasChildrenLoaded) {
    return (
      <NestedRow
        source={sourceWithoutItemActions}
        item={item}
        onCheckedChange={onCheckedChange}
        selectedItems={selectedItems}
        columns={columns}
        frozenColumnsLeft={frozenColumnsLeft}
        checkColumnWidth={checkColumnWidth}
        index={index}
        groupIndex={groupIndex}
        nestedRowProps={nestedRowProps}
        tableWithChildren={tableWithChildren}
        ref={ref}
      />
    )
  }

  return (
    <TableRow
      ref={ref}
      className={cn(
        "group transition-colors hover:bg-f1-background-hover",
        "after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-px after:w-full after:bg-f1-border-secondary after:content-['']",
        noBorder && "after:bg-white-100",
        disableHover && "hover:bg-transparent"
      )}
    >
      {source.selectable && (
        <TableCell
          width={checkColumnWidth}
          sticky={{ left: 0 }}
          loading={loading}
        >
          {id !== undefined && (
            <div className="pointer-events-auto flex items-center justify-end">
              <Checkbox
                checked={selectedItems.has(id)}
                onCheckedChange={onCheckedChange}
                title={`Select ${String(source.selectable?.(item))}`}
                hideLabel
              />
            </div>
          )}
        </TableCell>
      )}
      {columns.map((column, cellIndex) => (
        <TableCell
          key={`editable-cell-${groupIndex}-${index}-${cellIndex}`}
          firstCell={cellIndex === 0}
          width={column.width}
          sticky={getStickyPosition(cellIndex)}
          loading={loading}
        >
          <div
            className={cn(
              "flex w-full min-w-0",
              column.editType === "text" && "cursor-text",
              column.align === "right" && "justify-end"
            )}
          >
            {column.editType === "text" ? (
              <Input
                type="text"
                label={column.label}
                hideLabel
                value={getDisplayValue(column)}
                onChange={(value) => handleCellChange(column, value)}
                error={column.id ? cellErrors[column.id] : undefined}
              />
            ) : (
              renderProperty(item, column, "editableTable", i18n)
            )}
          </div>
        </TableCell>
      ))}
    </TableRow>
  )
}

export const EditableRow = forwardRef(EditableRowInner) as <
  R extends RecordType,
  Filters extends FiltersDefinition,
  Sortings extends SortingsDefinition,
  Summaries extends SummariesDefinition,
  ItemActions extends ItemActionsDefinition<R>,
  NavigationFilters extends NavigationFiltersDefinition,
  Grouping extends GroupingDefinition<R>,
>(
  props: EditableRowProps<
    R,
    Filters,
    Sortings,
    Summaries,
    ItemActions,
    NavigationFilters,
    Grouping
  > & { ref?: React.ForwardedRef<HTMLTableRowElement> }
) => ReturnType<typeof EditableRowInner>
