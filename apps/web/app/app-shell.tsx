"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon, SettingsIcon, UsersIcon } from "lucide-react";
import { OrganizationSwitcher } from "@/app/organization-switcher";
import { UserMenu } from "@/app/user-menu";
import { Logo } from "@newt-app-ssl-auth-example/ui/logo";
import { ModeToggle } from "@newt-app-ssl-auth-example/ui/mode-toggle";
import {
  Sidebar,
  SidebarContent,
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

const nav: NavItem[] = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/members", label: "Members", icon: UsersIcon },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
];

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
  // The static export uses trailing slashes (/members/); nav hrefs don't.
  const pathname = usePathname().replace(/(.)\/$/, "$1");

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
          <OrganizationSwitcher />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <NavMenu items={nav} pathname={pathname} />
          </SidebarGroup>
        </SidebarContent>
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
