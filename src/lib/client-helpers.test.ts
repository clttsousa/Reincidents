import { buildStats, formatPhone, validateClientForm } from "@/lib/client-helpers";
import type { ClientFormValues, ClientRecord } from "@/types/mock";

describe("client helpers", () => {
  it("formats brazilian phone numbers with country code", () => {
    expect(formatPhone("5534999991234")).toBe("+55 (34) 99999-1234");
  });

  it("validates phone, responsible user and O.S. requirements", () => {
    const values: ClientFormValues = {
      name: "Jo",
      phone: "123",
      totalServices: 0,
      description: "",
      status: "O.S. aberta",
      responsibleUserId: "",
      osOpen: true,
      osNumber: "",
      resolved: false,
      notes: "abc",
      lastContactAt: "",
      nextActionAt: "",
    };

    const errors = validateClientForm(values);
    expect(errors.name).toBeTruthy();
    expect(errors.phone).toBeTruthy();
    expect(errors.totalServices).toBeTruthy();
    expect(errors.responsibleUserId).toBeTruthy();
    expect(errors.osNumber).toBeTruthy();
    expect(errors.notes).toBeTruthy();
  });

  it("builds aggregate stats from client records", () => {
    const clients: ClientRecord[] = [
      {
        id: "1",
        name: "A",
        phone: "34999991234",
        totalServices: 9,
        description: "",
        status: "Aguardando contato",
        responsibleUserId: null,
        assignee: "Equipe",
        osOpen: false,
        osNumber: "",
        resolved: false,
        notes: "",
        updatedAt: new Date().toISOString(),
        lastContactAt: "",
        nextActionAt: "",
      },
      {
        id: "2",
        name: "B",
        phone: "34999990000",
        totalServices: 2,
        description: "",
        status: "Resolvido",
        responsibleUserId: "user-1",
        assignee: "Equipe",
        osOpen: false,
        osNumber: "OS-1",
        resolved: true,
        notes: "",
        updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
        lastContactAt: "",
        nextActionAt: "",
      },
    ];

    expect(buildStats(clients)).toMatchObject({
      total: 2,
      waiting: 1,
      solved: 1,
      critical: 1,
      stale: 1,
    });
  });
});
