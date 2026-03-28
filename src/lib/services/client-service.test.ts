import { inferHistoryTitle } from "@/lib/services/client-service";

describe("inferHistoryTitle", () => {
  it("maps status and note actions to human-friendly labels", () => {
    expect(
      inferHistoryTitle({
        id: "1",
        actor_id: null,
        action: "status_changed",
        status_from: "Aguardando contato",
        status_to: "Resolvido",
        description: null,
        created_at: new Date().toISOString(),
      }),
    ).toBe("Status alterado para Resolvido");

    expect(
      inferHistoryTitle({
        id: "2",
        actor_id: null,
        action: "note_added",
        status_from: null,
        status_to: null,
        description: null,
        created_at: new Date().toISOString(),
      }),
    ).toBe("Observação adicionada");
  });
});
