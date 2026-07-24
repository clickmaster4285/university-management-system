import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Search, Filter, Download, Plus, MoreHorizontal } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import {
  Pagination, PaginationContent, PaginationItem, PaginationLink,
  PaginationNext, PaginationPrevious,
} from "@/components/ui/pagination";
import { toast } from "sonner";

export interface Column<T> {
  key: keyof T | string;
  header: string;
  cell?: (row: T) => ReactNode;
  className?: string;
}

export function DataTable<T>({
  title, description, data, columns, searchKeys, pageSize = 8,
  actions, addLabel,
}: {
  title?: string; description?: string; data: T[]; columns: Column<T>[];
  searchKeys?: (keyof T)[]; pageSize?: number; actions?: ReactNode; addLabel?: string;
}) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (!q || !searchKeys) return data;
    const s = q.toLowerCase();
    return data.filter((r) => searchKeys.some((k) => String((r as Record<string, unknown>)[k as string] ?? "").toLowerCase().includes(s)));
  }, [q, data, searchKeys]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageData = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <Card className="glass">
      {(title || description) && (
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            {title && <CardTitle>{title}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <div className="flex gap-2">
            {actions}
            <Button variant="outline" size="sm" onClick={() => toast.success("Exported to CSV")}>
              <Download className="h-3.5 w-3.5" /> Export
            </Button>
            {addLabel && (
              <Button size="sm" onClick={() => toast.success(`${addLabel} — form opened`)}>
                <Plus className="h-3.5 w-3.5" /> {addLabel}
              </Button>
            )}
          </div>
        </CardHeader>
      )}
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search…" className="pl-9" />
          </div>
          <Button variant="outline" size="sm"><Filter className="h-3.5 w-3.5" /> Filter</Button>
          <Badge variant="secondary" className="ml-auto">{filtered.length} records</Badge>
        </div>
        <div className="rounded-lg border overflow-x-auto scrollbar-thin">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                {columns.map((c) => (
                  <TableHead key={String(c.key)} className={c.className}>{c.header}</TableHead>
                ))}
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageData.map((row, i) => (
                <TableRow key={i} className="hover:bg-muted/30">
                  {columns.map((c) => (
                    <TableCell key={String(c.key)} className={c.className}>
                      {c.cell ? c.cell(row) : String((row as Record<string, unknown>)[c.key as string] ?? "")}
                    </TableCell>
                  ))}
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toast.info("Row actions")}>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {pageData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={columns.length + 1} className="text-center py-10 text-muted-foreground text-sm">
                    No results found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious onClick={(e) => { e.preventDefault(); setPage(Math.max(1, page - 1)); }} />
              </PaginationItem>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((p) => (
                <PaginationItem key={p}>
                  <PaginationLink isActive={p === page} onClick={(e) => { e.preventDefault(); setPage(p); }}>{p}</PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext onClick={(e) => { e.preventDefault(); setPage(Math.min(totalPages, page + 1)); }} />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </CardContent>
    </Card>
  );
}
