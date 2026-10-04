// Klient testów innowacji: tester zgłasza się do innowacji (/api/tester/*), admin ROPS przypisuje
// albo odrzuca (/api/admin/test-requests/*). Gdy backend nie odpowiada albo sesja jest tylko w przeglądarce,
// dane żyją w pamięci karty — zmiany są widoczne do odświeżenia strony (tak jak w lib/admin-api.ts).

import { apiFetch } from "@/lib/api";

export type TestStatus = "requested" | "assigned" | "rejected" | "submitted";

export type TestReport = {
  id: number;
  innovation_id: number;
  innovation_title: string | null;
  tester_id: number | string;
  tester_name: string | null;
  tester_email?: string | null;
  tester_organization?: string | null;
  status: TestStatus;
  motivation: string | null;
  rating: number | null;
  what_worked: string | null;
  improvements: string | null;
  cost_note: string | null;
  created_at: string | null;
  decided_at: string | null;
  submitted_at: string | null;
};

export type Feedback = { rating: number; what_worked: string; improvements: string; cost_note: string };

export type Result<T> = { data: T; offline: boolean };

const local: TestReport[] = [];

async function call<T>(path: string, fallback: () => T, offline: boolean, init: RequestInit = {}): Promise<Result<T>> {
  if (offline) return { data: fallback(), offline: true };
  try {
    return { data: await apiFetch<T>(path, init), offline: false };
  } catch (error) {
    // TypeError = brak połączenia z serwerem. Błędy HTTP (409, 404…) idą dalej do widoku.
    if (error instanceof TypeError) return { data: fallback(), offline: true };
    throw error;
  }
}

const now = () => new Date().toISOString().slice(0, 19);

function updateLocal(id: number, changes: Partial<TestReport>) {
  const report = local.find((row) => row.id === id)!;
  Object.assign(report, changes);
  return { ...report };
}

// ---------- Tester ----------

export function getMyTests(testerId: number | string, offline: boolean) {
  return call<TestReport[]>(
    "/api/tester/tests",
    () => local.filter((report) => report.tester_id === testerId).map((report) => ({ ...report })),
    offline,
  );
}

export function requestTest(
  innovation: { id: number; title: string },
  tester: { id: number | string; name: string },
  motivation: string,
  offline: boolean,
) {
  return call<TestReport>(
    "/api/tester/tests",
    () => {
      const report: TestReport = {
        id: Date.now(),
        innovation_id: innovation.id,
        innovation_title: innovation.title,
        tester_id: tester.id,
        tester_name: tester.name,
        status: "requested",
        motivation: motivation || null,
        rating: null,
        what_worked: null,
        improvements: null,
        cost_note: null,
        created_at: now(),
        decided_at: null,
        submitted_at: null,
      };
      local.unshift(report);
      return { ...report };
    },
    offline,
    { method: "POST", body: JSON.stringify({ innovation_id: innovation.id, motivation }) },
  );
}

export function sendFeedback(id: number, feedback: Feedback, offline: boolean) {
  return call<TestReport>(
    `/api/tester/tests/${id}/feedback`,
    () =>
      updateLocal(id, {
        ...feedback,
        improvements: feedback.improvements || null,
        cost_note: feedback.cost_note || null,
        status: "submitted",
        submitted_at: now(),
      }),
    offline,
    { method: "POST", body: JSON.stringify(feedback) },
  );
}

// ---------- Admin ROPS ----------

export function getTestRequests(status: TestStatus | "" = "") {
  return call<TestReport[]>(
    `/api/admin/test-requests${status ? `?status=${status}` : ""}`,
    () => local.filter((report) => !status || report.status === status).map((report) => ({ ...report })),
    false,
  );
}

export function decideTestRequest(id: number, decision: "assign" | "reject" | "unassign") {
  return call<TestReport>(
    `/api/admin/test-requests/${id}/${decision}`,
    () => updateLocal(id, { status: decision === "assign" ? "assigned" : "rejected", decided_at: now() }),
    false,
    { method: "POST" },
  );
}
