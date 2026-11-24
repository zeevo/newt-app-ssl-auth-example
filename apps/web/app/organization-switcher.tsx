"use client";

import { useState } from "react";
import { Building2Icon, CheckIcon, ChevronsUpDownIcon, PlusIcon } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { CreateOrganizationDialog } from "@/app/create-organization-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@newt-app-ssl-auth-example/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@newt-app-ssl-auth-example/ui/sidebar";

export function OrganizationSwitcher() {
  const { data: session } = authClient.useSession();
  const { data: organizations } = authClient.useListOrganizations();
  const [creating, setCreating] = useState(false);
  const activeId = session?.session.activeOrganizationId;
  const active = organizations?.find(({ id }) => id === activeId);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<SidebarMenuButton size="lg" tooltip={active?.name ?? "Organization"} />}
          >
            {/* Fixed size: in the folded sidebar the button is exactly this box. */}
            <div className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <Building2Icon className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
              <span className="truncate font-medium">{active?.name ?? "Organization"}</span>
              <span className="truncate text-xs text-muted-foreground">Organization</span>
            </div>
            <ChevronsUpDownIcon className="ml-auto group-data-[collapsible=icon]:hidden" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Organizations</DropdownMenuLabel>
              {organizations?.map((organization) => (
                <DropdownMenuItem
                  key={organization.id}
                  onClick={() => {
                    if (organization.id === activeId) return;
                    void authClient.organization.setActive({ organizationId: organization.id });
                  }}
                >
                  <Building2Icon />
                  <span className="truncate">{organization.name}</span>
                  {organization.id === activeId && <CheckIcon className="ml-auto" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setCreating(true)}>
              <PlusIcon />
              Create organization
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <CreateOrganizationDialog open={creating} onOpenChange={setCreating} />
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
