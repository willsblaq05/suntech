/**
 * Data hooks for the admin pages.
 *
 * Demo sessions resolve the isolated sample-data layer directly during
 * render (no API calls, no effects); real sessions call the backend
 * through src/api/leads.ts. Both expose the same shape so pages stay
 * unaware of where the data came from.
 *
 * Loading is derived from the request key (attempt / id), so effects
 * only ever write results from async callbacks.
 */

import { useCallback, useEffect, useState } from "react";

import { fetchAllLeads, fetchLead, updateLeadStatus } from "./leads";
import { getDemoLead, getDemoLeads, withDemoStatus } from "../data/demoAdmin";
import { useAdminAuth } from "../auth/useAdminAuth";
import type { Lead, LeadStatus } from "../types/admin";

export interface LeadListResult {
  leads: Lead[];
  truncated: boolean;
  loading: boolean;
  error: Error | null;
  reload(): void;
}

interface ListFetchState {
  /** Which request the currently held results belong to. */
  resolvedAttempt: number;
  leads: Lead[];
  truncated: boolean;
  error: Error | null;
}

export function useAllLeads(): LeadListResult {
  const isDemo = useAdminAuth().isDemo;
  const [attempt, setAttempt] = useState(0);
  const [fetchState, setFetchState] = useState<ListFetchState>({
    resolvedAttempt: -1,
    leads: [],
    truncated: false,
    error: null,
  });

  useEffect(() => {
    if (isDemo) return;

    let cancelled = false;
    fetchAllLeads()
      .then((collection) => {
        if (cancelled) return;
        setFetchState({
          resolvedAttempt: attempt,
          leads: collection.leads,
          truncated: collection.truncated,
          error: null,
        });
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setFetchState({
          resolvedAttempt: attempt,
          leads: [],
          truncated: false,
          error: cause instanceof Error ? cause : new Error("Unknown error"),
        });
      });
    return () => {
      cancelled = true;
    };
  }, [isDemo, attempt]);

  const reload = useCallback(() => setAttempt((value) => value + 1), []);

  return {
    leads: isDemo ? getDemoLeads() : fetchState.leads,
    truncated: isDemo ? false : fetchState.truncated,
    loading: isDemo ? false : fetchState.resolvedAttempt < attempt,
    error: isDemo ? null : fetchState.error,
    reload,
  };
}

export interface LeadDetailResult {
  lead: Lead | null;
  loading: boolean;
  error: Error | null;
  /** Applies a status change (real PATCH call, or local for demo data). */
  changeStatus(status: LeadStatus): Promise<void>;
  savingStatus: boolean;
  statusError: string | null;
}

interface DetailFetchState {
  /** Which inquiry the currently held record belongs to. */
  resolvedId: string;
  lead: Lead | null;
  error: Error | null;
}

export function useLeadDetail(id: string): LeadDetailResult {
  const isDemo = useAdminAuth().isDemo;
  const [fetchState, setFetchState] = useState<DetailFetchState>({
    resolvedId: "",
    lead: null,
    error: null,
  });
  const [savingStatus, setSavingStatus] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  useEffect(() => {
    if (isDemo) return;

    let cancelled = false;
    fetchLead(id)
      .then((result) => {
        if (cancelled) return;
        setFetchState({ resolvedId: id, lead: result, error: null });
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setFetchState({
          resolvedId: id,
          lead: null,
          error: cause instanceof Error ? cause : new Error("Unknown error"),
        });
      });
    return () => {
      cancelled = true;
    };
  }, [isDemo, id]);

  const changeStatus = useCallback(
    async (status: LeadStatus) => {
      setStatusError(null);
      setSavingStatus(true);
      try {
        if (isDemo) {
          // Demo sessions update the in-memory sample row only.
          const current = getDemoLead(id);
          if (current) {
            const updated = withDemoStatus(current, status);
            setFetchState({ resolvedId: id, lead: updated, error: null });
          }
          return;
        }
        const updated = await updateLeadStatus(fetchState.lead?.id ?? id, status);
        setFetchState({ resolvedId: id, lead: updated, error: null });
      } catch (cause: unknown) {
        setStatusError(cause instanceof Error ? cause.message : "Status update failed.");
      } finally {
        setSavingStatus(false);
      }
    },
    [isDemo, id, fetchState.lead],
  );

  return {
    // Demo: prefer an updated sample row after a local status change, else
    // fall back to the pristine sample data for this id.
    lead: isDemo
      ? (() => {
          if (fetchState.resolvedId === id && fetchState.lead) return fetchState.lead;
          return getDemoLead(id) ?? null;
        })()
      : fetchState.lead,
    loading: isDemo ? false : fetchState.resolvedId !== id,
    error: isDemo ? null : fetchState.error,
    changeStatus,
    savingStatus,
    statusError,
  };
}
