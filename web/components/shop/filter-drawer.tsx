"use client";

import { Dialog } from "@base-ui/react/dialog";
import { SlidersHorizontal } from "lucide-react";
import type { ReactNode } from "react";
import { ModalSurface } from "@/components/design/modal";

export function FilterDrawer({ children, count }: { children: ReactNode; count: number }) {
  return <Dialog.Root>
    <Dialog.Trigger className="shop-button filter-drawer-trigger"><SlidersHorizontal size={17} aria-hidden="true" /> Filters{count ? " (" + count + ")" : ""}</Dialog.Trigger>
    <ModalSurface title="Search and filters" kind="drawer">{children}</ModalSurface>
  </Dialog.Root>;
}
