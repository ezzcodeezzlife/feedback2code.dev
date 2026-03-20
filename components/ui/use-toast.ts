"use client";

import * as React from "react";
type ToastVariant = "default" | "destructive";

type ToastInput = {
  id?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: ToastVariant;
};

type State = { toasts: Array<ToastInput & { id: string; open: boolean }> };

type Listener = (state: State) => void;

const listeners: Listener[] = [];

let memoryState: State = { toasts: [] };

function emit() {
  for (const listener of listeners) listener(memoryState);
}

function setState(partial: State) {
  memoryState = partial;
  emit();
}

function createId() {
  return Math.random().toString(16).slice(2);
}

function dismissToast(id: string) {
  setState({
    ...memoryState,
    toasts: memoryState.toasts.map((t) =>
      t.id === id ? { ...t, open: false } : t,
    ),
  });
}

export function toast(input: ToastInput) {
  const id = input.id ?? createId();
  const toastData = { ...input, id, open: true };

  setState({
    ...memoryState,
    toasts: [toastData, ...memoryState.toasts].slice(0, 5),
  });

  // Auto-dismiss after a short delay (similar to shadcn defaults).
  if (typeof window !== "undefined") {
    window.setTimeout(() => dismissToast(id), 3000);
  }
  return id;
}

export function useToast() {
  const [state, setLocalState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    const listener: Listener = (next) => setLocalState(next);
    listeners.push(listener);
    return () => {
      const idx = listeners.indexOf(listener);
      if (idx >= 0) listeners.splice(idx, 1);
    };
  }, []);

  return {
    ...state,
    toast,
    dismiss: (id?: string) => {
      if (!id) {
        setState({
          ...memoryState,
          toasts: memoryState.toasts.map((t) => ({ ...t, open: false })),
        });
        return;
      }

      setState({
        ...memoryState,
        toasts: memoryState.toasts.map((t) =>
          t.id === id ? { ...t, open: false } : t,
        ),
      });
    },
  };
}

