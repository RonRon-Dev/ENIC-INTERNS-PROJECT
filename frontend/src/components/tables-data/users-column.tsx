"use client"

import type {
  Column,
  ColumnDef,
  ColumnFiltersState,
  SortingState,
} from "@tanstack/react-table"
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFacetedUniqueValues,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { DataTablePagination } from "../data-table-components/data-table-pagination"
import { DataTableToolbar } from "../data-table-components/data-table-toolbar"
import { DataTableColumnHeader } from "../data-table-components/data-table-header"
import { DataTableFacetedFilter } from "../data-table-components/data-table-faceted-filter"
import { DataTableRowActions } from "./users-data-table-row-actions"
import { type User } from '@/data/schema'
export type { User }
import { callTypes, roles } from '@/data/data'

const statusOptions = Array.from(callTypes, ([value, badge]) => ({
  value,
  label: value.charAt(0).toUpperCase() + value.slice(1),
  badge,
}))

const roleOptions = roles.map(({ label, value, icon }) => ({
  label,
  value,
  icon,
}))

export const columns: ColumnDef<User>[] = [
  {
    id: 'name',
    header: 'Name',
    accessorFn: (row) => `${row.name}`,
  },
  {
    accessorKey: 'username',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Username" />
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    filterFn: (row, id, value) => {
      if (!value?.length) return true
      return value.includes(row.getValue(id))
    },
    cell: ({ row }) => {
      const status = row.getValue('status') as string
      const badge = callTypes.get(status as User['status'])
      return (
        <Badge variant="outline" className={badge}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'role',
    header: 'Role',
    filterFn: (row, id, value) => {
      if (!value?.length) return true
      return value.includes(row.getValue(id))
    },
    cell: ({ row }) => {
      const role = row.getValue('role') as string
      const option = roles.find((r) => r.value === role)
      const Icon = option?.icon
      return (
        <div className="flex items-center gap-1.5">
          {Icon && <Icon className="size-3.5 text-muted-foreground" />}
          <span className="capitalize">{option?.label ?? role}</span>
        </div>
      )
    },
  },
  {
    id: 'actions',
    cell: DataTableRowActions,
  },
]

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(
    []
  )

  const table = useReactTable({
    data,
    columns,
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    state: {
      sorting,
      columnFilters,
    },
  })

  return (
    <div>
      <DataTableToolbar
        table={table}
        searchPlaceholder='Filter users...'
        searchKey='username'
        filters={[
          {
            columnId: 'status',
            title: 'Status',
            options: statusOptions,
          },
          {
            columnId: 'role',
            title: 'Role',
            options: roleOptions,
          },
        ]}
      />


      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  )
}