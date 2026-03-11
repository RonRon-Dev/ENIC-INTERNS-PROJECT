"use client";

import type {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
} from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFacetedUniqueValues,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { DataTablePagination } from "../data-table-components/data-table-pagination";
import { DataTableToolbar } from "../data-table-components/data-table-toolbar";
import { DataTableColumnHeader } from "../data-table-components/data-table-header";
import { type ActivityLog, type Roles } from "@/data/schema";
export type { ActivityLog };
import { useLogs } from "@/components/act-logs/logs-provider";
import { CircleCheck, CircleX, Info } from "lucide-react";
import { type LucideIcon } from "lucide-react";
import * as LucideIcons from "lucide-react";

function resolveIcon(iconName?: string): LucideIcon | null {
  if (!iconName) return null;

  const icon =
    LucideIcons[iconName as keyof typeof LucideIcons] ??
    LucideIcons[`${iconName}Icon` as keyof typeof LucideIcons];

  // forwardRef components are objects, not functions
  if (
    typeof icon === "function" ||
    (typeof icon === "object" && icon !== null)
  ) {
    return icon as LucideIcon;
  }

  return null;
}

export function useColumns({ roles }: { roles: Roles[] }) {
  const { setOpen, setCurrentRow } = useLogs();

  const columns: ColumnDef<ActivityLog>[] = [
    {
      id: "ID",
      header: "Ref. ID",
      accessorKey: "id",
    },
    {
      id: "dateTime",
      header: "Date & Time",
      accessorFn: (row: ActivityLog) => {
        const date = new Date(row.date + "T" + row.time);
        const formatted = date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        });
        const time = date.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
        return `${formatted}, ${time}`;
      },
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.getValue("dateTime")}
        </span>
      ),
    },
    {
      id: "name",
      accessorFn: (row: ActivityLog) => row.user.name,
      header: ({ column }) => (
        <div>
          <DataTableColumnHeader column={column} title="Name" />
        </div>
      ),
      cell: ({ row }: any) => (
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
      id: "role",
      header: "Role",
      accessorFn: (row: ActivityLog) => row.user.role,
      filterFn: (row, id, value) => {
        if (!value?.length) return true;
        return value.includes(row.getValue(id));
      },
      cell: ({ row }) => {
        const roleName = row.getValue("role") as string;
        const option = roles.find(
          (r) => r.name.toLowerCase() === roleName.toLowerCase(),
        );
        const Icon = resolveIcon(option?.icon);
        return (
          <div className="flex items-center gap-1.5 border border-border rounded-md px-2 py-1 w-max bg-muted">
            {Icon && <Icon className="size-3.5 text-muted-foreground" />}
            <span className="capitalize">{option?.name ?? roleName}</span>
          </div>
        );
      },
    },
    {
      id: "description",
      header: "Action Taken",
      accessorFn: (row: ActivityLog) => row.description,
      cell: ({ row }) => (
        <button
          className="flex items-center gap-1.5 max-w-[150px] text-left hover:text-foreground transition-colors cursor-pointer"
          onClick={() => {
            setCurrentRow(row.original);
            setOpen("desc");
          }}
        >
          <Info className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate">
            {row.original.description.charAt(0).toUpperCase() +
              row.original.description.slice(1)}
          </span>
        </button>
      ),
    },

    {
      id: "Remarks",
      header: "Remarks",
      accessorFn: (row: ActivityLog) => row.description,
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={`gap-x-1 py-1 ${row.original.success ? "text-green-600 border-green-600 bg-green-50" : "text-red-500 border-red-500 bg-red-50"}`}
        >
          {row.original.success ? (
            <CircleCheck className="w-4 h-4" />
          ) : (
            <CircleX className="w-4 h-4" />
          )}
          {row.original.success ? "Success" : "Failed"}
        </Badge>
      ),
    },
  ];

  return columns;
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  roles: Roles[];
}

export function DataTable<TData, TValue>({
  columns,
  data,
  roles,
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
    state: {
      sorting,
      columnFilters,
    },
  });

  console.log("Activity logs data:", roles);

  const roleOptions = roles.map((role) => {
    return {
      label: role.name.charAt(0).toUpperCase() + role.name.slice(1),
      value: role.name.toLowerCase(),
      icon: resolveIcon(role.icon) ?? undefined, // null → undefined
    };
  });

  console.log("Role options for filter:", roleOptions);
  console.log(LucideIcons["Shield"]); // undefined or function?
  console.log(LucideIcons["Settings"]); // likely undefined
  console.log(LucideIcons["Code"]); // undefined or function?
  return (
    <div>
      <DataTableToolbar
        table={table}
        searchPlaceholder="Search activity logs..."
        // searchKey='username'
        filters={[
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
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                    </TableHead>
                  );
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
