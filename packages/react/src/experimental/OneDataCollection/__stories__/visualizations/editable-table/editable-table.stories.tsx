import { Meta, StoryObj } from "@storybook/react-vite"
import { useMemo, useRef, useState } from "react"

import {
  createDataAdapter,
  ExampleComponent,
  generateMockUsers,
  getMockVisualizations,
  type MockUser,
} from "../../mockData"

const meta = {
  title: "Data Collection/Visualizations/Editable Table",
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Editable table view. Same as Table but with independent column order and visibility state (stored under 'editableTable' key).",
      },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

function useEditableTableData(
  initialItems: MockUser[] = generateMockUsers(10)
) {
  const [items, setItems] = useState<MockUser[]>(initialItems)
  const itemsRef = useRef(items)
  itemsRef.current = items

  const onCellChange = (updatedItem: MockUser) => {
    console.log("onCellChange", updatedItem)
    setItems((prev) =>
      prev.map((i) => (i.id === updatedItem.id ? updatedItem : i))
    )
  }

  const dataAdapter = useMemo(() => {
    console.log("useEditableTableData: creating data adapter")
    const adapter = createDataAdapter({
      data: items,
      paginationType: "pages",
      perPage: 10,
    })
    adapter.fetchData = (options: unknown) => {
      console.log("fetchData: useEditableTableData")
      const currentAdapter = createDataAdapter({
        data: itemsRef.current,
        paginationType: "pages",
        perPage: 10,
      })
      return currentAdapter.fetchData(options as never)
    }
    return adapter
  }, [items])

  return { items, dataAdapter, onCellChange }
}

export const BasicEditableTable: Story = {
  render: () => {
    const mockVisualizations = getMockVisualizations()
    const { dataAdapter, onCellChange } = useEditableTableData()
    console.log("BasicEditableTable: rendering")
    return (
      <ExampleComponent
        visualizations={[
          {
            type: "editableTable" as const,
            options: {
              ...(
                mockVisualizations.editableTable as Extract<
                  typeof mockVisualizations.editableTable,
                  { type: "editableTable" }
                >
              ).options,
              onCellChange,
            },
          },
        ]}
        dataAdapter={dataAdapter}
        id="editable-table-basic/v1"
      />
    )
  },
}

export const EditableTableWithColumnSettings: Story = {
  render: () => {
    const mockVisualizations = getMockVisualizations({
      table: {
        allowColumnHiding: true,
        allowColumnReordering: true,
      },
    })
    const { dataAdapter, onCellChange } = useEditableTableData()
    console.log("EditableTableWithColumnSettings: rendering")
    return (
      <ExampleComponent
        tableAllowColumnReordering
        tableAllowColumnHiding
        visualizations={[
          {
            type: "editableTable" as const,
            options: {
              ...(
                mockVisualizations.editableTable as Extract<
                  typeof mockVisualizations.editableTable,
                  { type: "editableTable" }
                >
              ).options,
              onCellChange,
            },
          },
        ]}
        dataAdapter={dataAdapter}
        id="editable-table-settings/v1"
      />
    )
  },
}

export const TableAndEditableTable: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Both Table and Editable Table in the same collection. Switch via the settings selector; each view keeps its own column order and visibility.",
      },
    },
  },
  render: () => {
    const mockVisualizations = getMockVisualizations({
      table: {
        allowColumnHiding: true,
        allowColumnReordering: true,
      },
    })
    const { dataAdapter, onCellChange } = useEditableTableData()

    return (
      <ExampleComponent
        tableAllowColumnReordering
        tableAllowColumnHiding
        visualizations={[
          mockVisualizations.table,
          {
            type: "editableTable" as const,
            options: {
              ...(
                mockVisualizations.editableTable as Extract<
                  typeof mockVisualizations.editableTable,
                  { type: "editableTable" }
                >
              ).options,
              onCellChange,
            },
          },
        ]}
        dataAdapter={dataAdapter}
        id="table-and-editable/v1"
      />
    )
  },
}
