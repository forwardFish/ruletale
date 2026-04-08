"use client";

import { startTransition, useMemo } from "react";
import { useRouter } from "next/navigation";

import type { NavigationAdapter } from "@/lib/platform";

type RouterLike = {
  push: (href: string) => void;
  replace: (href: string) => void;
  back: () => void;
};

export function createWebNavigationAdapter(router: RouterLike): NavigationAdapter {
  return {
    push(href) {
      startTransition(() => {
        router.push(href);
      });
    },
    replace(href) {
      startTransition(() => {
        router.replace(href);
      });
    },
    back() {
      startTransition(() => {
        router.back();
      });
    },
  };
}

export function useWebNavigation() {
  const router = useRouter();

  return useMemo(() => createWebNavigationAdapter(router), [router]);
}
