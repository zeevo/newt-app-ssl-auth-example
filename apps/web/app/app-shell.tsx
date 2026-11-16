"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon, ShieldIcon } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { UserMenu } from "@/app/user-menu";
import { Logo } from "@newt-app-ssl-auth-example/ui/logo";
import { ModeToggle } from "@newt-app-ssl-auth-example/ui/mode-toggle";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@newt-app-ssl-auth-example/ui/sidebar";

interface NavItem {
  href: string;
  label: string;
  icon: typeof HomeIcon;
}

const nav: NavItem[] = [{ href: "/", label: "Home", icon: HomeIcon }];

// Shown to admins only, at the bottom of the sidebar.
const adminNav: NavItem[] = [{ href: "/admin", label: "Admin", icon: ShieldIcon }];

function NavMenu({ items, pathname }: { items: NavItem[]; pathname: string }) {
  return (
    <SidebarMenu>
      {items.map(({ href, label, icon: Icon }) => (
        <SidebarMenuItem key={href}>
          <SidebarMenuButton
            isActive={pathname === href}
            tooltip={label}
            render={<NextLink href={href} />}
          >
            <Icon />
            <span>{label}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = authClient.useSession();
  const isAdmin = session?.user.role === "admin";

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 py-1">
            <Logo className="w-6 h-auto" />
            <span className="truncate font-semibold group-data-[collapsible=icon]:hidden">
              newt-app
            </span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <NavMenu items={nav} pathname={pathname} />
          </SidebarGroup>
        </SidebarContent>
        {isAdmin && (
          <SidebarFooter>
            <NavMenu items={adminNav} pathname={pathname} />
          </SidebarFooter>
        )}
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger />
          <div className="ml-auto flex items-center gap-2">
            <ModeToggle />
            <UserMenu />
          </div>
        </header>
        <div className="flex-1 p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
