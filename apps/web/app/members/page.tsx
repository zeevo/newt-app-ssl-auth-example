"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { hasRole } from "@newt-app-ssl-auth-example/auth/client";
import { authClient } from "@/lib/auth-client";
import { primaryRole, roleLabels, useActiveMembership } from "@/lib/organization";
import { AddMemberDialog } from "@/app/members/add-member-dialog";
import { EditMemberDialog } from "@/app/members/edit-member-dialog";
import { Badge } from "@newt-app-ssl-auth-example/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@newt-app-ssl-auth-example/ui/table";

async function listMembers(organizationId: string) {
  const { data, error } = await authClient.organization.listCertificateMembers({
    query: { organizationId },
  });
  if (error) throw new Error(error.message ?? "Could not load members");
  return data;
}

export default function MembersPage() {
  const {
    organizationId,
    organization,
    member: self,
    isOwner,
    canManageMembers,
  } = useActiveMembership();
  const queryClient = useQueryClient();
  const queryKey = ["organization", organizationId, "members"];

  const members = useQuery({
    queryKey,
    queryFn: () => listMembers(organizationId ?? ""),
    enabled: organizationId !== null,
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Members</h1>
          <p className="text-sm text-muted-foreground">
            Who belongs to {organization?.name ?? "this organization"}, and who can manage it.
          </p>
        </div>
        {organizationId && canManageMembers && (
          <AddMemberDialog organizationId={organizationId} allowOwner={isOwner} onAdded={refresh} />
        )}
      </div>

      {members.error && <p className="text-sm text-destructive">{members.error.message}</p>}

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
          {members.data?.map((member) => {
            const role = primaryRole(member.role);
            const isSelf = member.id === self?.id;
            // Your own membership is changed from Settings (leave), and only
            // owners may change owners.
            const editable =
              organizationId &&
              organization &&
              canManageMembers &&
              !isSelf &&
              (isOwner || !hasRole(member.role, "owner"));
            return (
              <TableRow key={member.id}>
                <TableCell>
                  <span className="font-medium">{member.user.name}</span>
                  {isSelf && <span className="text-muted-foreground"> (you)</span>}
                </TableCell>
                <TableCell>
                  <code className="text-xs">{member.user.dn ?? "None"}</code>
                </TableCell>
                <TableCell>
                  <Badge variant={role === "member" ? "secondary" : "default"}>
                    {roleLabels[role]}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {editable && (
                    <EditMemberDialog
                      member={member}
                      organizationId={organizationId}
                      organizationName={organization.name}
                      allowOwner={isOwner}
                      onSaved={refresh}
                    />
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
