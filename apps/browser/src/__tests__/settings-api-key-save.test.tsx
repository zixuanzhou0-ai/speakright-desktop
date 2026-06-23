import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorBoundary } from "@/components/common/error-boundary";
import { AzureConfigCard } from "@/components/settings/azure-config-card";

const toast = vi.hoisted(() => ({
  error: vi.fn(),
  success: vi.fn(),
}));

vi.mock("sonner", () => ({ toast }));

describe("settings API key save", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  it("saves Azure config without tripping the settings error boundary", async () => {
    const errorBoundaryTitle = "\u51fa\u4e86\u70b9\u95ee\u9898";
    const savedMessage =
      "Azure \u914d\u7f6e\u5df2\u4fdd\u5b58\uff0c\u5efa\u8bae\u518d\u6d4b\u8bd5\u8fde\u63a5\u3002";

    render(
      <ErrorBoundary>
        <AzureConfigCard />
      </ErrorBoundary>,
    );

    fireEvent.change(screen.getByLabelText("Subscription Key"), {
      target: { value: "azure-key" },
    });
    fireEvent.change(screen.getByLabelText("Region"), {
      target: { value: "eastus" },
    });
    fireEvent.click(screen.getByRole("button", { name: "\u4fdd\u5b58" }));

    await waitFor(() => {
      expect(screen.queryByText(errorBoundaryTitle)).not.toBeInTheDocument();
      expect(screen.getByText(savedMessage)).toBeInTheDocument();
    });
    expect(screen.getByLabelText("Subscription Key")).toHaveValue("azure-key");
    expect(sessionStorage.getItem("speakright_azure_config")).toContain(
      "azure-key",
    );
    expect(localStorage.getItem("speakright_azure_config")).toBeNull();
  });
});
