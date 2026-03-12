"use client";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { userTypes } from "@/data/const";
import { type Roles, type User } from "@/data/schema";
import type {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
} from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import * as LucideIcons from "lucide-react";
import { type LucideIcon } from "lucide-react";
import { useState } from "react";
import { DataTableColumnHeader } from "../data-table-components/data-table-header";
import { DataTablePagination } from "../data-table-components/data-table-pagination";
import { DataTableToolbar } from "../data-table-components/data-table-toolbar";
import { DataTableRowActions } from "../users/users-data-table-row-actions";
export type { User };

function resolveIcon(iconName?: string): LucideIcon | null {
  if (!iconName) return null;
  const icon =
    LucideIcons[iconName as keyof typeof LucideIcons] ??
    LucideIcons[`${iconName}Icon` as keyof typeof LucideIcons];
  if (
    typeof icon === "function" ||
    (typeof icon === "object" && icon !== null)
  ) {
    return icon as LucideIcon;
  }
  return null;
}

const statusOptions = Array.from(userTypes, ([value, badge]) => ({
  value,
  label: value.charAt(0).toUpperCase() + value.slice(1),
  badge,
})).filter(({ value }) => value !== "pending");

const includesArrayFilter = (row: any, id: string, value: string[]) => {
  if (!value?.length) return true;
  return value.includes(row.getValue(id));
};

export function useColumns({ roles }: { roles: Roles[] }) {
  const roleOptions = roles.map((role) => ({
    label: role.name.charAt(0).toUpperCase() + role.name.slice(1),
    value: role.name.toLowerCase(),
    icon: resolveIcon(role.icon) ?? undefined, // ← add ?? undefined
  }));

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "username",
      header: ({ column }) => (
        <div>
          <DataTableColumnHeader column={column} title="Username" />
        </div>
      ),
      cell: ({ row }) => <div className="ml-1">{row.original.username}</div>,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: "Name",
      enableHiding: false,
      cell: ({ row }) => <div className="capitalize">{row.original.name}</div>,
    },
    {
      accessorKey: "status",
      header: "Status",
      filterFn: includesArrayFilter,
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        const badge = userTypes.get(status as User["status"]);

        return (
          <Badge variant="outline" className={badge + " capitalize"}>
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "role",
      header: "Role",
      filterFn: includesArrayFilter,
      cell: ({ row }) => {
        const roleName = row.getValue("role") as string;
        const option = roles.find(
          (r) => r.name.toLowerCase() === roleName.toLowerCase(),
        );
        const Icon = resolveIcon(option?.icon);

        return (
          <div className="flex items-center gap-1.5 border rounded-md px-2 py-1 w-max bg-muted">
            {Icon && <Icon className="size-3.5 text-muted-foreground" />}
            <span className="capitalize">{option?.name ?? roleName}</span>
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: DataTableRowActions,
    },
  ];

  return { columns, roleOptions };
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  roleOptions: { label: string; value: string; icon?: LucideIcon }[]
}

export function DataTable<TData, TValue>({
  columns,
  data,
  roleOptions,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

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
    getFacetedRowModel: getFacetedRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  });

  return (
    <div>
      <DataTableToolbar
        table={table}
        searchPlaceholder="Search user table..."
        filters={[
          {
            columnId: "status",
            title: "Status",
            options: statusOptions,
          },
          {
            columnId: "role",
            title: "Role",
            options: roleOptions,
          },
        ]}
      />

      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                  </TableHead>
                ))}
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
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  );
}
