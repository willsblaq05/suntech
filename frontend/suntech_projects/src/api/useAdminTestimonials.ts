/**
 * Data hooks for the admin testimonials page, following the same
 * request-keyed loading pattern as useAdminLeads.
 */

import { useCallback, useEffect, useState } from "react";

import { fetchTestimonials } from "./testimonials";
import { useAdminAuth } from "../auth/useAdminAuth";
import type { Testimonial } from "../types/admin";

export function useTestimonials() {
  const isDemo = useAdminAuth().isDemo;
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<{
    resolvedAttempt: number;
    testimonials: Testimonial[];
    error: Error | null;
  }>({ resolvedAttempt: -1, testimonials: [], error: null });

  useEffect(() => {
    if (isDemo) return; // demo state is derived in the return value below

    let cancelled = false;
    fetchTestimonials()
      .then((testimonials) => {
        if (cancelled) return;
        setState({ resolvedAttempt: attempt, testimonials, error: null });
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setState({
          resolvedAttempt: attempt,
          testimonials: [],
          error: cause instanceof Error ? cause : new Error("Unknown error"),
        });
      });
    return () => {
      cancelled = true;
    };
  }, [isDemo, attempt]);

  const reload = useCallback(() => setAttempt((value) => value + 1), []);

  return {
    testimonials: isDemo ? [] : state.testimonials,
    loading: isDemo ? false : state.resolvedAttempt < attempt,
    error: isDemo ? null : state.error,
    reload,
  };
}
