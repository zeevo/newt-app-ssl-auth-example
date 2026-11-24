import { ShieldXIcon } from "lucide-react";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@newt-app-ssl-auth-example/ui/empty";

export function Unauthorized() {
  return (
    <main className="flex min-h-svh">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ShieldXIcon />
          </EmptyMedia>
          <EmptyTitle>Unauthorized</EmptyTitle>
        </EmptyHeader>
      </Empty>
    </main>
  );
}
