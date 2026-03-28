import { buildDashboardInsights } from "@/lib/services/dashboard-service";
import type { ClientRecord, ClientStats } from "@/types/mock";

function makeClient(overrides: Partial<ClientRecord> = {}): ClientRecord {
  return {
    id: crypto.randomUUID(),
    name: "Cliente",
    phone: "34999991234",
    totalServices: 3,
    description: "",
    status: "Aguardando contato",
    responsibleUserId: "user-1",
    assignee: "Equipe",
    osOpen: false,
    osNumber: "",
    resolved: false,
    notes: "",
    updatedAt: new Date().toISOString(),
    lastContactAt: "",
    nextActionAt: "",
    ...overrides,
  };
}

describe("buildDashboardInsights", () => {
  it("computes overdue, due soon and throughput metrics", () => {
    const clients = [
      makeClient({ resolved: true, status: "Resolvido" }),
      makeClient({ nextActionAt: new Date(Date.now() - 3600000).toISOString() }),
      makeClient({ nextActionAt: new Date(Date.now() + 24 * 3600000).toISOString() }),
      makeClient({ responsibleUserId: null, assignee: "Equipe" }),
    ];

    const stats: ClientStats = {
      total: clients.length,
      waiting: 3,
      os: 0,
      solved: 1,
      noReturn: 0,
      critical: 1,
      stale: 0,
    };

    const insights = buildDashboardInsights(clients, stats, 7);

    expect(insights.overdue).toBe(1);
    expect(insights.dueSoon).toBe(1);
    expect(insights.unassigned).toBe(1);
    expect(insights.solved.current).toBeGreaterThanOrEqual(1);
  });
});
