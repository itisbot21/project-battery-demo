"use client";

import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";

export function ModalSurface({ title, caption, kind = "dialog", children }: {
  title: string; caption?: string; kind?: "dialog" | "drawer" | "gallery"; children: ReactNode;
}) {
  return <Dialog.Portal>
    <Dialog.Backdrop className="modal-backdrop" />
    <Dialog.Popup className={"modal-surface modal-" + kind}>
      <div className="modal-heading">
        <div><Dialog.Title>{title}</Dialog.Title>{caption && <Dialog.Description>{caption}</Dialog.Description>}</div>
        <Dialog.Close className="icon-button" aria-label="Close"><X size={20} aria-hidden="true" /></Dialog.Close>
      </div>
      {children}
    </Dialog.Popup>
  </Dialog.Portal>;
}

export function ConfirmSubmit({ children, title, description, confirmLabel, when }: {
  children: ReactNode; title: string; description: string; confirmLabel: string; when?: { name: string; value: string };
}) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const { pending } = useFormStatus();

  return <Dialog.Root open={open} onOpenChange={setOpen}>
    <Dialog.Trigger ref={trigger} type="button" disabled={pending} className={when ? "shop-button primary" : "shop-button danger"} onClick={(event) => {
      const form = event.currentTarget.form;
      if (!form?.reportValidity()) {
        event.preventBaseUIHandler();
        return;
      }
      if (when && new FormData(form).get(when.name) !== when.value) {
        event.preventBaseUIHandler();
        form.requestSubmit();
      }
    }}>{pending ? "Saving…" : children}</Dialog.Trigger>
    <ModalSurface title={title} caption={description}>
      <div className="modal-actions">
        <Dialog.Close className="shop-button">Go back</Dialog.Close>
        <button type="button" className="shop-button danger" onClick={() => {
          setOpen(false);
          trigger.current?.form?.requestSubmit();
        }}>{confirmLabel}</button>
      </div>
    </ModalSurface>
  </Dialog.Root>;
}
