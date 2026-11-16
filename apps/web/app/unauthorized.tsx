import { ShieldXIcon } from "lucide-react";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@newt-app-ssl-auth-example/ui/empty";

export function Unauthorized({
  title = "Unauthorized",
  description = "Your client certificate is not linked to an account. Contact an administrator to request access.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <main className="flex min-h-svh">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ShieldXIcon />
          </EmptyMedia>
          <EmptyTitle>{title}</EmptyTitle>
          <EmptyDescription>{description}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    </main>
  );
}
