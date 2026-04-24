"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

function isEditable(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
}

export default function KeyboardShortcuts() {
  const router = useRouter();

  useEffect(() => {
    let pendingG = false;
    let gTimer: number | null = null;

    function clearPendingG() {
      pendingG = false;
      if (gTimer !== null) {
        window.clearTimeout(gTimer);
        gTimer = null;
      }
    }

    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isEditable(e.target)) return;

      const key = e.key.toLowerCase();

      if (pendingG) {
        if (key === "d") {
          e.preventDefault();
          clearPendingG();
          router.push("/dashboard");
          return;
        }
        if (key === "h") {
          e.preventDefault();
          clearPendingG();
          router.push("/history");
          return;
        }
        if (key === "s") {
          e.preventDefault();
          clearPendingG();
          router.push("/settings");
          return;
        }
        if (key === "l") {
          e.preventDefault();
          clearPendingG();
          router.push("/");
          return;
        }
        clearPendingG();
      }

      if (key === "g") {
        e.preventDefault();
        pendingG = true;
        gTimer = window.setTimeout(clearPendingG, 900);
        return;
      }

      if (key === "r") {
        if (window.location.pathname.startsWith("/dashboard")) {
          e.preventDefault();
          window.dispatchEvent(new CustomEvent("contextweaver:run"));
        }
      }
    }

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearPendingG();
    };
  }, [router]);

  return null;
}
