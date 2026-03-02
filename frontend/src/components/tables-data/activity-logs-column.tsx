"use client"

import type {
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
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { DataTablePagination } from "../data-table-components/data-table-pagination"
import { DataTableToolbar } from "../data-table-components/data-table-toolbar"
import { DataTableColumnHeader } from "../data-table-components/data-table-header"
import { type ActivityLog } from '@/data/schema'
export type { ActivityLog }
import { activityTypes } from '@/data/const'
import { roles } from '@/data/const'

export const columns: ColumnDef<ActivityLog>[] = [
  {
    accessorKey: 'username',
    header: ({ column }) => (
      <div className="ml-3">
        <DataTableColumnHeader column={column} title="Username" />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center">
        <div className="ml-5">{row.original.user.username}</div>
      </div>
    ),
    enableHiding: false,
  },
  {
    id: 'name',
    header: 'Name',
    accessorFn: (row) => `${row.user.name}`,
    enableHiding: false,
  },
  {
    id: 'role',
    header: 'Role',
    accessorFn: (row) => row.user.role,
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
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => {
      const type = row.getValue('type') as string
      const badge = activityTypes.get(type as ActivityLog['type'])

      return (
        <Badge variant="outline" className={badge + ' capitalize'} >
          {type}
        </Badge>
      )
    },
  },
  {
    id: 'description',
    header: 'Description',
    accessorFn: (row) => row.description,
    cell: ({ row }) => (
      <div className="max-w-[150px] line-clamp-1">
        {row.original.description}
      </div>
    ),
  },
  {
    id: 'date',
    header: 'Date',
    accessorFn: (row) => {
      const date = new Date(row.date + 'T00:00:00'); // prevent timezone shift
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    },
  },
  {
    id: 'time',
    header: 'Time',
    accessorFn: (row) => {
      const [hourStr, minute] = row.time.split(':');
      const hour = parseInt(hourStr, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minute} ${ampm}`;
    },
  },
  // {
  //   id: 'actions',
  //   cell: DataTableRowActions,
  // },
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
        searchPlaceholder='Search activity logs...'
      // searchKey='username'
      // filters={[
      //   {
      //     columnId: 'status',
      //     title: 'Status',
      //     options: statusOptions,
      //   },
      //   {
      //     columnId: 'role',
      //     title: 'Role',
      //     options: roleOptions,
      //   },
      // ]}
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