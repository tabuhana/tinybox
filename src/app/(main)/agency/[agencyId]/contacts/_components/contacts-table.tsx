"use client";

import type { ColumnDef, FilterFn } from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { MoreHorizontal, Search, Trash2, Users2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { ContactForm } from "@/app/(main)/agency/[agencyId]/contacts/_components/contact-form";
import { deleteContact, saveActivityLogsNotification } from "@/lib/queries";
import type { Contact } from "@/lib/types";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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

type ContactsTableProps = {
  agencyId: string;
  contacts: Contact[];
};

const globalFilter: FilterFn<Contact> = (row, _, filterValue) => {
  const search = String(filterValue).trim().toLowerCase();

  if (!search) {
    return true;
  }

  const target = `${row.original.name} ${row.original.email ?? ""} ${row.original.phone ?? ""}`.toLowerCase();
  return target.includes(search);
};

function formatDate(date: Date | string | null) {
  if (!date) {
    return "Unknown";
  }

  const parsedDate = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(parsedDate.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsedDate);
}

export function ContactsTable({ agencyId, contacts }: ContactsTableProps) {
  const router = useRouter();
  const [globalSearch, setGlobalSearch] = useState("");
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Contact | null>(null);
  const [isPending, startTransition] = useTransition();

  const columns = useMemo<ColumnDef<Contact>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => <p className="font-medium text-foreground">{row.original.name}</p>,
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.email || "No email provided"}
          </span>
        ),
      },
      {
        accessorKey: "phone",
        header: "Phone",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.phone || "No phone provided"}
          </span>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{formatDate(row.original.createdAt)}</span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const contact = row.original;

          return (
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Open actions for ${contact.name}`}
                      disabled={isPending}
                    />
                  }
                >
                  <MoreHorizontal className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => setEditingContact(contact)} disabled={isPending}>
                    Edit contact
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => setDeleteCandidate(contact)}
                    disabled={isPending}
                  >
                    <Trash2 className="size-4" />
                    Delete contact
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [isPending],
  );

  // TanStack Table exposes an imperative table instance by design.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: contacts,
    columns,
    state: {
      globalFilter: globalSearch,
    },
    globalFilterFn: globalFilter,
    onGlobalFilterChange: setGlobalSearch,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const removeContact = () => {
    if (!deleteCandidate) {
      return;
    }

    startTransition(async () => {
      try {
        await deleteContact(deleteCandidate.id);
        await saveActivityLogsNotification({
          agencyId,
          description: `Deleted contact ${deleteCandidate.name}.`,
        });

        toast.success("Contact deleted", {
          description: `${deleteCandidate.name} has been removed.`,
        });
        setDeleteCandidate(null);
        router.refresh();
      } catch (error) {
        console.error(error);
        toast.error("Could not delete contact", {
          description: "Please try again in a moment.",
        });
      }
    });
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 rounded-[1.75rem] border border-border/60 bg-background/80 p-4 shadow-sm shadow-primary/5 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Directory</p>
            <p className="text-sm text-muted-foreground">
              Search your contact list, update details, or clean up outdated entries.
            </p>
          </div>
          <div className="relative w-full md:max-w-sm">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={globalSearch}
              onChange={(event) => table.setGlobalFilter(event.target.value)}
              placeholder="Search by name, email, or phone"
              className="pl-9"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-border/60 bg-card/85 shadow-lg shadow-primary/5">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="border-border/60 bg-muted/20">
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className={header.id === "actions" ? "text-right" : undefined}
                    >
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
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} className="border-border/60">
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={cell.column.id === "actions" ? "text-right" : undefined}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="p-0">
                    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
                      <div className="rounded-full border border-border/60 bg-muted/40 p-4">
                        <Users2 className="size-6 text-primary" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">No matching contacts</p>
                        <p className="max-w-sm text-sm text-muted-foreground">
                          Add your first contact to start tracking outreach and ticket activity.
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <ContactForm
        agencyId={agencyId}
        contact={editingContact}
        open={Boolean(editingContact)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingContact(null);
          }
        }}
        showTrigger={false}
      />

      <AlertDialog
        open={Boolean(deleteCandidate)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteCandidate(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <Trash2 className="size-7 text-destructive" />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete contact</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteCandidate ? (
                <>
                  Delete <span className="font-medium text-foreground">{deleteCandidate.name}</span>{" "}
                  from your agency contacts. This action cannot be undone.
                </>
              ) : (
                "Delete this contact from your agency."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={removeContact}
              disabled={isPending}
            >
              {isPending ? "Deleting..." : "Delete contact"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
