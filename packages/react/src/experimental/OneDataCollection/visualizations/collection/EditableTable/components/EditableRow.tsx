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
  if (column.field !== undefined && column.field in item) {
    const v = item[column.field as keyof R]
    return v === null || v === undefined ? "" : String(v)
  }
  const rendered = column.render(item)
  if (typeof rendered === "string") return rendered
  if (typeof rendered === "number") return String(rendered)
  return ""
}

function getColumnId<R extends RecordType>(
  column: EditableTableColumnDefinition<
    R,
    SortingsDefinition,
    SummariesDefinition
  >
): string {
  return column.id ?? column.label ?? "column"
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
  onCellChange?: (item: R, columnId: string, value: string) => void
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

  // Local cell values so typing updates immediately (parent/cache update is async)
  const [localValues, setLocalValues] = useState<Record<string, string>>({})

  // Sync from item when it changes from parent (e.g. different row or refetch with new item ref)
  useEffect(() => {
    setLocalValues({})
  }, [item])

  const getDisplayValue = (
    column: EditableTableColumnDefinition<
      R,
      SortingsDefinition,
      SummariesDefinition
    >
  ) => {
    const columnId = getColumnId(column)
    if (columnId in localValues) return localValues[columnId]
    return getCellValue(item, column)
  }

  const handleCellChange = (
    column: EditableTableColumnDefinition<
      R,
      SortingsDefinition,
      SummariesDefinition
    >,
    value: string
  ) => {
    const columnId = getColumnId(column)
    setLocalValues((prev) => ({ ...prev, [columnId]: value }))
    onCellChange?.(item, columnId, value)
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
