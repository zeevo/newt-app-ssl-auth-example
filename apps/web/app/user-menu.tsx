"use client";

import { authClient } from "@/lib/auth-client";
import { Avatar, AvatarFallback } from "@newt-app-ssl-auth-example/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@newt-app-ssl-auth-example/ui/dropdown-menu";

/** "Devin E. Loper" -> "DL": first letters of the first and last names. */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  const first = words[0]?.[0] ?? "";
  const last = words.length > 1 ? (words[words.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}

export function UserMenu() {
  const { data: session } = authClient.useSession();
  if (!session) return null;
  const { name, dn } = session.user;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger aria-label={`Account: ${name}`}>
        <Avatar>
          <AvatarFallback>{initials(name)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <p className="text-sm font-medium text-foreground">{name}</p>
            {dn && <p className="mt-1 font-mono text-xs break-all">{dn}</p>}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
