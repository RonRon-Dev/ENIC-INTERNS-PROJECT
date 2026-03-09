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
import { useLogs } from '@/components/act-logs/logs-provider'
import { Check, CircleCheck, CircleX, UserCheck, UserX } from "lucide-react"

export function useColumns() {
  const { setOpen, setCurrentRow } = useLogs()

  const columns: ColumnDef<ActivityLog>[] = [
    {
      id: 'id',
      header: 'Reference ID',
      accessorKey: 'id',
    },
    {
      id: 'dateTime',
      header: 'Date & Time',
      accessorFn: (row) => {
        const date = new Date(row.date + 'T' + row.time);
        const formatted = date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        });
        const time = date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
        return `${formatted}, ${time}`;
      },
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.getValue('dateTime')}</span>
      ),
    },
    {
      id: 'username',
      accessorFn: (row) => row.user.username,
      header: ({ column }) => (
        <div>
          <DataTableColumnHeader column={column} title="Username" />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex flex-col ml-1">
          <div className="capitalize font-bold">{row.original.user.name}</div>
          <div className="text-xs text-muted-foreground">
            {row.original.user.username}
          </div>
        </div>
      ),
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
          <div className="flex items-center gap-1.5 border rounded-md px-2 py-1 w-max bg-muted">
            {Icon && <Icon className="size-3.5 text-muted-foreground" />}
            <span className="capitalize">{option?.label ?? role}</span>
          </div>
        )
      },
    },
    // {
    //   id: 'type',
    //   accessorKey: 'type',
    //   header: 'Type',
    //   filterFn: (row, id, value) => {
    //     if (!value?.length) return true
    //     return value.includes(row.getValue(id))
    //   },
    //   cell: ({ row }) => {
    //     const type = row.getValue('type') as string
    //     const badge = activityTypes.get(type as ActivityLog['type'])

    //     return (
    //       <Badge variant="outline" className={badge + ' capitalize'}>
    //         {type}
    //       </Badge>
    //     )
    //   },
    // },
    {
      id: 'description',
      header: 'Action Taken',
      accessorFn: (row) => row.description,
      cell: ({ row }) => (
        <button
          className="max-w-[150px] truncate text-left hover:text-foreground transition-colors cursor-pointer"
          onClick={() => {
            setCurrentRow(row.original)
            setOpen('desc')
          }}
        >
          {row.original.description.charAt(0).toUpperCase() + row.original.description.slice(1)}
        </button>
      ),
    },

    {
      id: 'description',
      header: 'Action Taken',
      accessorFn: (row) => row.description,
      cell: ({ row }) => (
        <Badge
          variant='outline'
          className={`gap-x-1 py-1 ${row.original.isSuccess ? 'text-green-600 border-green-600 bg-green-50' : 'text-red-500 border-red-500 bg-red-50'}`}>
          {row.original.isSuccess ? <CircleCheck className="w-4 h-4" /> : <CircleX className="w-4 h-4" />}
          {row.original.isSuccess ? 'Success' : 'Failed'}
        </Badge>
      ),
    },
    // {
    //   id: 'actions',
    //   cell: DataTableRowActions,
    // },
  ]

  return columns
}

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

  const roleOptions = roles.map(({ label, value, icon }) => ({
    label: label
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase()), value,
    icon,
  }))

  const activityTypeOptions = Array.from(activityTypes.keys()).map((key) => ({
    label: key
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase()),
    value: key,
  }))

  return (
    <div>
      <DataTableToolbar
        table={table}
        searchPlaceholder='Search activity logs...'
        // searchKey='username'
        filters={[
          {
            columnId: 'role',
            title: 'Role',
            options: roleOptions,
          },
          {
            columnId: 'type',
            title: 'Type',
            options: activityTypeOptions,
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