"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import type { CellContext, ColumnDef, ColumnFiltersState, SortingState } from "@tanstack/react-table"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { MoreHorizontal, UserCheck, UserX } from "lucide-react"
import { useState } from "react"
import { DataTableColumnHeader } from "../data-table-components/data-table-header"
import { DataTablePagination } from "../data-table-components/data-table-pagination"
import { DataTableToolbar } from "../data-table-components/data-table-toolbar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuShortcut, DropdownMenuTrigger } from "../ui/dropdown-menu"
import type { UserRequest } from "../users/users-provider"
import { useUsers } from "../users/users-provider"
import type { User } from "./users-column"

export type { UserRequest }

interface DataTableProps {
  columns: ColumnDef<UserRequest>[]
  data: UserRequest[]
  // onApprove: (req: UserRequest) => void
}

export function getColumns(onApprove: (req: UserRequest) => void): ColumnDef<UserRequest>[] {
  return [
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
      cell: ({ row }) => <div className="capitalize">{row.original.name}</div>,
      enableHiding: false,
    },
    {
      accessorKey: 'userName',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Username" />,
      cell: ({ row }) => <div>{row.original.userName}</div>,
      enableHiding: false,
    },
    {
      accessorKey: 'requestType',
      header: 'Request Type',
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.requestType}</Badge>
      ),
    },
    {
      accessorKey: 'requestDate',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {new Date(row.original.requestDate).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric',
          })}
        </span>
      ),
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Action</div>,
      cell: (props) => (
        <div className="text-right">
          <RequestRowActions {...props} onApprove={onApprove} />
        </div>
      ),
    },
  ]
}

export function DataTable({ columns, data }: DataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const table = useReactTable({
    data,
    columns,
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: { sorting, columnFilters },
  })

  return (
    <div>
      <DataTableToolbar
        table={table}
        searchPlaceholder="Search requests..."
        filters={[]}
      />
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, i) => (
                <TableRow key={row.id}
                  className={i % 2 === 0 ? "" : ""}
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
                  No pending requests.
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

type RequestRowActionsProps = CellContext<UserRequest, unknown> & {
  onApprove: (req: UserRequest) => void
}

export function RequestRowActions({ row, onApprove }: RequestRowActionsProps) {
  const { setOpen, setCurrentRow, setCurrentRequest } = useUsers()

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex h-8 w-8 p-0 data-[state=open]:bg-muted">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuItem
          onClick={() => onApprove(row.original)}
          className="text-green-600 focus:text-green-700"
        >
          {row.original.requestType === 'Account Registration' ? 'Approve' : 'Approve Reset'}
          <DropdownMenuShortcut>
            <UserCheck size={16} />
          </DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            setCurrentRequest(row.original)
            setCurrentRow({
              id: String(row.original.userId),
              name: row.original.name,
              username: row.original.userName,
              status: 'pending',
              role: ((row.original.currentRole?.name ?? 'guest').toLowerCase() === 'developer'
                ? 'dev'
                : (row.original.currentRole?.name ?? 'guest').toLowerCase()) as User['role'],
            })
            setOpen('reject')
          }}
          className="text-red-500 focus:text-red-600"
        >
          Reject
          <DropdownMenuShortcut>
            <UserX size={16} />
          </DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
