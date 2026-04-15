"use client";

import type { ColumnDef, FilterFn } from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Crown,
  MoreHorizontal,
  PencilLine,
  Search,
  Trash2,
  UserMinus,
  Users2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { deleteUser, saveActivityLogsNotification, updateUser } from "@/lib/queries";
import type { User } from "@/lib/types";

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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type EditableRole = Extract<User["role"], "AGENCY_ADMIN" | "AGENCY_MEMBER" | "AGENCY_USER">;

const editableRoles: readonly EditableRole[] = [
  "AGENCY_ADMIN",
  "AGENCY_MEMBER",
  "AGENCY_USER",
];

const globalFilter: FilterFn<User> = (row, _, filterValue) => {
  const search = String(filterValue).trim().toLowerCase();

  if (!search) {
    return true;
  }

  const target = `${row.original.name} ${row.original.email} ${row.original.role}`.toLowerCase();
  return target.includes(search);
};

function getInitials(name?: string | null) {
  const parts = (name ?? "")
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2);

  if (!parts.length) {
    return "TB";
  }

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}

function formatRoleLabel(role: User["role"]) {
  return role
    .toLowerCase()
    .split("_")
    .map((segment) => segment[0]?.toUpperCase() + segment.slice(1))
    .join(" ");
}

function getRoleVariant(role: User["role"]) {
  if (role === "AGENCY_OWNER") {
    return "default" as const;
  }

  if (role === "AGENCY_ADMIN") {
    return "secondary" as const;
  }

  return "outline" as const;
}

function canManageMember(member: User) {
  return member.role !== "AGENCY_OWNER";
}

export function TeamTable({
  agencyId,
  users,
  currentUserEmail,
}: {
  agencyId: string;
  users: User[];
  currentUserEmail?: string | null;
}) {
  const router = useRouter();
  const [globalSearch, setGlobalSearch] = useState("");
  const [editingMember, setEditingMember] = useState<User | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<EditableRole>("AGENCY_USER");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (
      editingMember &&
      editableRoles.includes(editingMember.role as EditableRole)
    ) {
      setSelectedRole(editingMember.role as EditableRole);
    }
  }, [editingMember]);

  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      {
        accessorFn: (row) => `${row.name} ${row.email}`,
        id: "member",
        header: "Member",
        cell: ({ row }) => {
          const member = row.original;
          const isCurrentUser = member.email === currentUserEmail;

          return (
            <div className="flex items-center gap-3">
              <Avatar size="lg" className="ring-2 ring-background">
                <AvatarImage src={member.avatarUrl ?? undefined} alt={member.name} />
                <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium text-foreground">{member.name}</p>
                  {isCurrentUser ? <Badge variant="secondary">You</Badge> : null}
                </div>
                <p className="truncate text-sm text-muted-foreground">{member.email}</p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{row.original.email}</span>
        ),
      },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => {
          const member = row.original;

          return (
            <Badge variant={getRoleVariant(member.role)} className="gap-1.5">
              {member.role === "AGENCY_OWNER" ? <Crown className="size-3" /> : null}
              {formatRoleLabel(member.role)}
            </Badge>
          );
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const member = row.original;
          const disabled = isPending || !canManageMember(member);

          return (
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Open actions for ${member.name}`}
                      disabled={disabled}
                    />
                  }
                >
                  <MoreHorizontal className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => setEditingMember(member)} disabled={disabled}>
                    <PencilLine className="size-4" />
                    Edit role
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => setDeleteCandidate(member)}
                    disabled={disabled}
                  >
                    <Trash2 className="size-4" />
                    Remove member
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [currentUserEmail, isPending],
  );

  // TanStack Table exposes an imperative table instance by design.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: users,
    columns,
    state: {
      globalFilter: globalSearch,
    },
    globalFilterFn: globalFilter,
    onGlobalFilterChange: setGlobalSearch,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const saveRole = () => {
    if (!editingMember) {
      return;
    }

    startTransition(async () => {
      try {
        await updateUser({
          email: editingMember.email,
          role: selectedRole,
        });
        await saveActivityLogsNotification({
          agencyId,
          description: `Updated ${editingMember.name}'s role to ${formatRoleLabel(selectedRole)}.`,
        });
        toast.success("Role updated", {
          description: `${editingMember.name} is now ${formatRoleLabel(selectedRole)}.`,
        });
        setEditingMember(null);
        router.refresh();
      } catch (error) {
        console.error(error);
        toast.error("Could not update role", {
          description: "Please try again in a moment.",
        });
      }
    });
  };

  const removeMember = () => {
    if (!deleteCandidate) {
      return;
    }

    startTransition(async () => {
      try {
        await deleteUser(deleteCandidate.id);
        await saveActivityLogsNotification({
          agencyId,
          description: `Removed ${deleteCandidate.name} from the team.`,
        });
        toast.success("Member removed", {
          description: `${deleteCandidate.name} no longer has agency access.`,
        });
        setDeleteCandidate(null);
        router.refresh();
      } catch (error) {
        console.error(error);
        toast.error("Could not remove member", {
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
              Search, update roles, or remove access without leaving the team roster.
            </p>
          </div>
          <div className="relative w-full md:max-w-sm">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={globalSearch}
              onChange={(event) => table.setGlobalFilter(event.target.value)}
              placeholder="Search by name, email, or role"
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
                        <p className="font-medium text-foreground">No matching teammates</p>
                        <p className="max-w-sm text-sm text-muted-foreground">
                          Adjust the search or send a fresh invitation to start building
                          your agency roster.
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

      <Dialog
        open={Boolean(editingMember)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingMember(null);
          }
        }}
      >
        <DialogContent className="max-w-lg border border-border/60 bg-card/95 p-0 backdrop-blur">
          <div className="border-b border-border/60 px-6 py-6">
            <DialogHeader className="space-y-2">
              <DialogTitle className="text-xl font-semibold tracking-tight">
                Update team access
              </DialogTitle>
              <DialogDescription className="leading-6">
                Adjust the workspace permissions for{" "}
                <span className="font-medium text-foreground">
                  {editingMember?.name ?? "this teammate"}
                </span>
                .
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="space-y-5 px-6 py-6">
            <div className="rounded-[1.5rem] border border-border/60 bg-muted/20 p-4">
              <p className="font-medium text-foreground">{editingMember?.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{editingMember?.email}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="member-role">Role</Label>
              <Select
                value={selectedRole}
                onValueChange={(value) => setSelectedRole(value as EditableRole)}
                disabled={isPending}
              >
                <SelectTrigger id="member-role" className="w-full justify-between">
                  <SelectValue placeholder="Choose a role" />
                </SelectTrigger>
                <SelectContent>
                  {editableRoles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {formatRoleLabel(role)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="border-t border-border/60 pt-5" showCloseButton>
              <Button onClick={saveRole} disabled={isPending}>
                {isPending ? "Saving..." : "Save role"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

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
              <UserMinus className="size-7 text-destructive" />
            </AlertDialogMedia>
            <AlertDialogTitle>Remove team member</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteCandidate ? (
                <>
                  Remove <span className="font-medium text-foreground">{deleteCandidate.name}</span>{" "}
                  from this agency. They will lose access immediately.
                </>
              ) : (
                "Remove this member from the agency."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={removeMember}
              disabled={isPending}
            >
              {isPending ? "Removing..." : "Remove access"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
