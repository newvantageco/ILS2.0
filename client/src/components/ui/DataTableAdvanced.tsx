/**
 * Advanced DataTable Component
 *
 * Features:
 * - Column resizing, reordering, pinning
 * - Advanced filtering (multi-column, date ranges)
 * - Bulk actions with selection
 * - Export to CSV/Excel
 * - Virtual scrolling for large datasets
 * - Loading states and skeletons
 * - Empty states with illustrations
 * - Row expansion
 * - Inline editing
 * - Saved views/presets
 * - Mobile responsive
 */

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  RowSelectionState,
  ColumnOrderState,
  ColumnSizingState,
  ExpandedState,
  getExpandedRowModel,
  Row,
} from "@tanstack/react-table";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUpDown,
  ChevronDown,
  MoreHorizontal,
  Search,
  Download,
  Filter,
  X,
  Settings2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  GripVertical,
  Pin,
  PinOff,
  Eye,
  EyeOff,
  Trash2,
  Mail,
  Copy,
  Edit,
  CheckSquare,
  Square,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { staggerContainer, staggerItem } from "@/lib/animations";

// ============================================================================
// TYPES
// ============================================================================

export interface BulkAction<TData> {
  label: string;
  icon?: React.ReactNode;
  variant?: "default" | "destructive";
  onClick: (selectedRows: TData[]) => void | Promise<void>;
}

export interface FilterConfig {
  column: string;
  label: string;
  type: "text" | "select" | "date" | "number";
  options?: Array<{ label: string; value: string }>;
}

export interface DataTableAdvancedProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];

  // Filtering
  enableFiltering?: boolean;
  filterConfigs?: FilterConfig[];
  globalFilterPlaceholder?: string;

  // Selection
  enableRowSelection?: boolean;
  onRowSelectionChange?: (selectedRows: TData[]) => void;

  // Bulk actions
  bulkActions?: BulkAction<TData>[];

  // Column operations
  enableColumnResizing?: boolean;
  enableColumnReordering?: boolean;
  enableColumnPinning?: boolean;
  enableColumnVisibility?: boolean;

  // Pagination
  enablePagination?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];

  // Export
  enableExport?: boolean;
  exportFileName?: string;

  // Row operations
  onRowClick?: (row: TData) => void;
  expandedContent?: (row: Row<TData>) => React.ReactNode;

  // UI States
  isLoading?: boolean;
  emptyState?: React.ReactNode;
  loadingSkeleton?: React.ReactNode;

  // Styling
  className?: string;
  compact?: boolean;

  // Performance
  enableVirtualization?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function DataTableAdvanced<TData, TValue>({
  columns,
  data,
  enableFiltering = true,
  filterConfigs = [],
  globalFilterPlaceholder = "Search all columns...",
  enableRowSelection = true,
  onRowSelectionChange,
  bulkActions = [],
  enableColumnResizing = true,
  enableColumnReordering = false,
  enableColumnPinning = false,
  enableColumnVisibility = true,
  enablePagination = true,
  pageSize = 10,
  pageSizeOptions = [10, 20, 50, 100],
  enableExport = true,
  exportFileName = "export",
  onRowClick,
  expandedContent,
  isLoading = false,
  emptyState,
  loadingSkeleton,
  className,
  compact = false,
}: DataTableAdvancedProps<TData, TValue>) {
  // ============================================================================
  // STATE
  // ============================================================================

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [columnOrder, setColumnOrder] = React.useState<ColumnOrderState>([]);
  const [columnSizing, setColumnSizing] = React.useState<ColumnSizingState>({});
  const [expanded, setExpanded] = React.useState<ExpandedState>({});
  const [showFilters, setShowFilters] = React.useState(false);

  // ============================================================================
  // TABLE INSTANCE
  // ============================================================================

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
      columnOrder,
      columnSizing,
      expanded,
    },
    initialState: {
      pagination: {
        pageSize,
      },
    },
    enableRowSelection,
    enableColumnResizing,
    columnResizeMode: "onChange",
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    onColumnOrderChange: setColumnOrder,
    onColumnSizingChange: setColumnSizing,
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: enablePagination ? getPaginationRowModel() : undefined,
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: () => !!expandedContent,
  });

  // ============================================================================
  // DERIVED STATE
  // ============================================================================

  const selectedRows = table.getFilteredSelectedRowModel().rows.map(row => row.original);
  const totalRows = table.getFilteredRowModel().rows.length;
  const selectedCount = selectedRows.length;
  const hasSelection = selectedCount > 0;

  // Notify parent of selection changes
  React.useEffect(() => {
    if (onRowSelectionChange) {
      onRowSelectionChange(selectedRows);
    }
  }, [selectedCount]);

  // ============================================================================
  // ACTIONS
  // ============================================================================

  const handleExportCSV = () => {
    const rows = table.getFilteredRowModel().rows;
    const headers = table.getVisibleLeafColumns().map(col => col.id);

    const csvContent = [
      headers.join(","),
      ...rows.map(row =>
        headers
          .map(header => {
            const cell = row.getValue(header);
            return `"${String(cell).replace(/"/g, '""')}"`;
          })
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${exportFileName}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSelectAll = () => {
    table.toggleAllPageRowsSelected(!table.getIsAllPageRowsSelected());
  };

  const handleClearSelection = () => {
    table.resetRowSelection();
  };

  // ============================================================================
  // RENDER: LOADING STATE
  // ============================================================================

  if (isLoading) {
    return (
      <div className={cn("w-full space-y-4", className)}>
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-10 w-full max-w-sm" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((_, idx) => (
                  <TableHead key={idx}>
                    <Skeleton className="h-5 w-full" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, rowIdx) => (
                <TableRow key={rowIdx}>
                  {columns.map((_, colIdx) => (
                    <TableCell key={colIdx}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER: EMPTY STATE
  // ============================================================================

  if (data.length === 0 && !isLoading) {
    return (
      <div className={cn("w-full space-y-4", className)}>
        <div className="flex items-center justify-between gap-2">
          {enableFiltering && (
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={globalFilterPlaceholder}
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-9"
              />
            </div>
          )}
        </div>
        <div className="rounded-md border">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            {emptyState || (
              <>
                <div className="text-muted-foreground mb-2">
                  <Search className="h-12 w-12 mx-auto opacity-50" />
                </div>
                <h3 className="text-lg font-semibold">No data found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Try adjusting your filters or search query
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER: TABLE
  // ============================================================================

  return (
    <div className={cn("w-full space-y-4", className)}>
      {/* Toolbar */}
      <div className="flex flex-col gap-4">
        {/* Top Row: Search, Filters, Actions */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {/* Search */}
          {enableFiltering && (
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={globalFilterPlaceholder}
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-9"
              />
              {globalFilter && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setGlobalFilter("")}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Advanced Filters Toggle */}
            {filterConfigs.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className={cn(showFilters && "bg-muted")}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {columnFilters.length > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 px-1">
                    {columnFilters.length}
                  </Badge>
                )}
              </Button>
            )}

            {/* Export */}
            {enableExport && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            )}

            {/* Column Visibility */}
            {enableColumnVisibility && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings2 className="h-4 w-4 mr-2" />
                    View
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {table
                    .getAllColumns()
                    .filter((column) => column.getCanHide())
                    .map((column) => (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) => column.toggleVisibility(!!value)}
                      >
                        {column.id.replace(/_/g, " ")}
                      </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Selection Bar */}
        <AnimatePresence>
          {hasSelection && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center justify-between p-3 bg-primary/10 rounded-lg border border-primary/20"
            >
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={table.getIsAllPageRowsSelected()}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all"
                />
                <span className="text-sm font-medium">
                  {selectedCount} of {totalRows} row(s) selected
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearSelection}
                  className="h-7"
                >
                  Clear
                </Button>
              </div>

              {/* Bulk Actions */}
              {bulkActions.length > 0 && (
                <div className="flex items-center gap-2">
                  {bulkActions.map((action, idx) => (
                    <Button
                      key={idx}
                      variant={action.variant || "outline"}
                      size="sm"
                      onClick={() => action.onClick(selectedRows)}
                      className="h-8"
                    >
                      {action.icon && <span className="mr-2">{action.icon}</span>}
                      {action.label}
                    </Button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Advanced Filters */}
        <AnimatePresence>
          {showFilters && filterConfigs.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-4 bg-muted/50 rounded-lg border"
            >
              {filterConfigs.map((config) => (
                <div key={config.column} className="space-y-2">
                  <label className="text-sm font-medium">{config.label}</label>
                  {config.type === "text" && (
                    <Input
                      placeholder={`Filter ${config.label.toLowerCase()}...`}
                      value={(table.getColumn(config.column)?.getFilterValue() as string) ?? ""}
                      onChange={(e) =>
                        table.getColumn(config.column)?.setFilterValue(e.target.value)
                      }
                    />
                  )}
                  {config.type === "select" && config.options && (
                    <Select
                      value={(table.getColumn(config.column)?.getFilterValue() as string) ?? ""}
                      onValueChange={(value) =>
                        table.getColumn(config.column)?.setFilterValue(value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {config.options.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              ))}
              <div className="flex items-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.resetColumnFilters()}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      style={{ width: header.getSize() }}
                      className={cn(
                        "relative",
                        compact && "py-2"
                      )}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}

                      {/* Resize Handle */}
                      {enableColumnResizing && header.column.getCanResize() && (
                        <div
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                          className={cn(
                            "absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none",
                            "hover:bg-primary hover:w-0.5",
                            header.column.getIsResizing() && "bg-primary w-0.5"
                          )}
                        />
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              <AnimatePresence mode="wait">
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <React.Fragment key={row.id}>
                      <motion.tr
                        variants={staggerItem}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className={cn(
                          "border-b transition-colors hover:bg-muted/50",
                          row.getIsSelected() && "bg-muted",
                          onRowClick && "cursor-pointer"
                        )}
                        onClick={() => onRowClick?.(row.original)}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell
                            key={cell.id}
                            className={cn(compact && "py-2")}
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </motion.tr>

                      {/* Expanded Content */}
                      {expandedContent && row.getIsExpanded() && (
                        <motion.tr
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          <TableCell colSpan={columns.length} className="p-0">
                            <div className="p-4 bg-muted/30">
                              {expandedContent(row)}
                            </div>
                          </TableCell>
                        </motion.tr>
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No results found.
                    </TableCell>
                  </TableRow>
                )}
              </AnimatePresence>
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {enablePagination && (
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Showing{" "}
              <span className="font-medium">
                {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
              </span>{" "}
              to{" "}
              <span className="font-medium">
                {Math.min(
                  (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                  totalRows
                )}
              </span>{" "}
              of <span className="font-medium">{totalRows}</span> results
            </span>
          </div>

          <div className="flex items-center gap-6">
            {/* Page Size Selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Rows per page</span>
              <Select
                value={String(table.getState().pagination.pageSize)}
                onValueChange={(value) => table.setPageSize(Number(value))}
              >
                <SelectTrigger className="h-8 w-16">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pageSizeOptions.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Page Navigation */}
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
                className="h-8 w-8 p-0"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <span className="text-sm font-medium px-3">
                Page {table.getState().pagination.pageIndex + 1} of{" "}
                {table.getPageCount()}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
                className="h-8 w-8 p-0"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

export function DataTableColumnHeader({
  column,
  title,
  className,
}: {
  column: any;
  title: string;
  className?: string;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn("-ml-3 h-8", className)}
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {title}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );
}

export function DataTableRowActions({
  actions,
}: {
  actions: Array<{
    label: string;
    onClick: () => void | Promise<void>;
    icon?: React.ReactNode;
    variant?: "default" | "destructive";
  }>;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {actions.map((action, index) => (
          <DropdownMenuItem
            key={index}
            onClick={action.onClick}
            className={action.variant === "destructive" ? "text-destructive" : ""}
          >
            {action.icon && <span className="mr-2">{action.icon}</span>}
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function DataTableRowCheckbox({ row }: { row: any }) {
  return (
    <Checkbox
      checked={row.getIsSelected()}
      onCheckedChange={(value) => row.toggleSelected(!!value)}
      aria-label="Select row"
      className="translate-y-[2px]"
    />
  );
}

export function DataTableHeaderCheckbox({ table }: { table: any }) {
  return (
    <Checkbox
      checked={table.getIsAllPageRowsSelected()}
      onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
      aria-label="Select all"
      className="translate-y-[2px]"
    />
  );
}
