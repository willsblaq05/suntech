import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

import { QuoteForm } from "./QuoteForm";
import { Reveal } from "../ui/Reveal";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("QuoteForm", () => {
  it("uses browser validation for email and positive system size", () => {
    render(<QuoteForm />);

    const email = screen.getByLabelText("Email (optional)") as HTMLInputElement;
    const systemSize = screen.getByLabelText(
      "Intended system size (kW) (optional)",
    ) as HTMLInputElement;

    fireEvent.change(email, { target: { value: "not-an-email" } });
    fireEvent.change(systemSize, { target: { value: "0" } });

    expect(email.checkValidity()).toBe(false);
    expect(systemSize.checkValidity()).toBe(false);
  });

  it("submits to the same-origin API and shows success", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ status: 201 });
    vi.stubGlobal("fetch", fetchMock);
    render(<QuoteForm />);

    fireEvent.change(screen.getByLabelText(/Full name/), {
      target: { value: "Ada Okafor" },
    });
    fireEvent.change(screen.getByLabelText(/Phone/), {
      target: { value: "+2348012345678" },
    });
    fireEvent.change(screen.getByLabelText("Email (optional)"), {
      target: { value: "ada@example.com" },
    });
    fireEvent.submit(screen.getByRole("form", { name: "Request a solar quote" }));

    await screen.findByText("Request received.");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/leads/",
      expect.objectContaining({ method: "POST" }),
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("Reveal", () => {
  it("keeps content visible when IntersectionObserver is unavailable", async () => {
    render(<Reveal>Visible content</Reveal>);

    await waitFor(() => {
      expect(screen.getByText("Visible content").className).toContain("opacity-100");
    });
  });
});
