import { render, screen } from "@testing-library/react";

import { ClientStatusConfirmDialog } from "@/components/clientes/client-status-confirm-dialog";

describe("ClientStatusConfirmDialog", () => {
  it("renders critical status confirmation details", () => {
    render(
      <ClientStatusConfirmDialog
        pendingChange={{
          clientId: "1",
          clientName: "Valdemar",
          currentStatus: "O.S. aberta",
          nextStatus: "Resolvido",
          reason: "Existe uma O.S. ainda aberta.",
        }}
        onCancel={() => undefined}
        onConfirm={() => undefined}
      />,
    );

    expect(screen.getByText("Confirmar alteração crítica?")).toBeInTheDocument();
    expect(screen.getByText(/Valdemar/)).toBeInTheDocument();
    expect(screen.getByText(/Existe uma O.S. ainda aberta/)).toBeInTheDocument();
  });
});
