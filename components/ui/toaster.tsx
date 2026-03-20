"use client";

import { ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport, Toast } from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <ToastProvider>
      {toasts.map(({ id, open, title, description, variant }) => (
        <Toast
          key={id}
          open={open}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) dismiss(id);
          }}
          variant={variant}
        >
          <div className="grid gap-1">
            {title ? <ToastTitle>{title}</ToastTitle> : null}
            {description ? (
              <ToastDescription>{description}</ToastDescription>
            ) : null}
          </div>
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  );
}

