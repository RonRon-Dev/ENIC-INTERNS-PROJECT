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
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Edit, MoreHorizontal, Notebook, Shield, Trash, User2Icon, UserCheck, UserMinus } from "lucide-react"
import { DataTablePagination } from "../data-table-components/data-table-pagination"
import { DataTableViewOptions } from "../data-table-components/data-table-toggle"
import { DataTableColumnHeader } from "../data-table-components/data-table-header"
import { DataTableFacetedFilter } from "../data-table-components/data-table-faceted-filter"
import { DataTableRowActions } from "./data-table-row-actions"
import { type User } from '@/data/schema'
export type { User }
import { callTypes, roles } from '@/data/data'

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
// export type User = {
//   id: string
//   name: string
//   status: "pending" | "active" | "inactive" | "deactivated"
//   username: string
//   role: "admin" | "superadmin" | "unassigned"
// }

// const statusOptions = [
//   { label: "Pending", value: "pending", badge: "bg-gray-100/30 text-gray-900 dark:text-teal-200 border-gray-200" },
//   { label: "Active", value: "active", badge: "bg-green-100/30 text-green-900 dark:text-green-200 border-green-200" },
//   { label: "Deactivated", value: "deactivated", badge: "bg-red-100/30 text-red-900 dark:text-red-200 border-red-200" },
//   { label: "Inactive", value: "inactive", badge: "bg-amber-100/30 text-amber-900 dark:text-amber-200 border-amber-200" },
// ]

// const roleOptions = [
//   { label: "Unassigned", value: "unassigned", icon: User2Icon },
//   { label: "Admin", value: "admin", icon: UserCheck },
//   { label: "Superadmin", value: "superadmin", icon: Shield },
// ]


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
    id: 'fullName',
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
      <div className="flex items-center py-4 gap-2">
        <Input
          placeholder="Filter username..."
          value={(table.getColumn("username")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("username")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <DataTableFacetedFilter
          column={table.getColumn("status") as Column<TData, unknown>}
          title="Status"
          options={statusOptions}
        />
        <DataTableFacetedFilter
          column={table.getColumn("role") as Column<TData, unknown>}
          title="Role"
          options={roleOptions}
        />
        <DataTableViewOptions table={table} />
      </div>

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