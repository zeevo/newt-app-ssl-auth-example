"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";
import { AddUserDialog } from "@/app/admin/add-user-dialog";
import { EditUserDialog } from "@/app/admin/edit-user-dialog";
import { Unauthorized } from "@/app/unauthorized";
import { Badge } from "@newt-app-ssl-auth-example/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@newt-app-ssl-auth-example/ui/table";

// listUsers is typed without the ssl plugin's dn field, though it returns it.
const userRow = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string().nullish(),
  dn: z.string().nullish(),
});

async function listUsers() {
  const { data, error } = await authClient.admin.listUsers({
    query: { limit: 100, sortBy: "name", sortDirection: "asc" },
  });
  if (error) throw new Error(error.message ?? "Could not load users");
  return z.array(userRow).parse(data.users);
}

export default function AdminPage() {
  const { data: session } = authClient.useSession();
  const isAdmin = session?.user.role === "admin";
  const queryClient = useQueryClient();

  const users = useQuery({ queryKey: ["admin", "users"], queryFn: listUsers, enabled: isAdmin });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] });

  if (!isAdmin) {
    return (
      <Unauthorized title="Admins only" description="You need the admin role to see this page." />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground">
            Who can sign in, and who can manage everyone else.
          </p>
        </div>
        <AddUserDialog onAdded={refresh} />
      </div>

      {users.error && <p className="text-sm text-destructive">{users.error.message}</p>}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Certificate DN</TableHead>
            <TableHead>Role</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.data?.map((user) => {
            const admin = user.role === "admin";
            return (
              <TableRow key={user.id}>
                <TableCell>
                  <span className="font-medium">{user.name}</span>
                </TableCell>
                <TableCell>
                  <code className="text-xs">{user.dn ?? "None"}</code>
                </TableCell>
                <TableCell>
                  <Badge variant={admin ? "default" : "secondary"}>
                    {admin ? "Admin" : "User"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {/* Admins can't demote themselves, so there is always one admin left. */}
                  <EditUserDialog
                    user={user}
                    isSelf={user.id === session.user.id}
                    onSaved={refresh}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
