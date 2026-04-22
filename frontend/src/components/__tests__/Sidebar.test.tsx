import React from "react";
import { render, screen } from "@testing-library/react";
import Sidebar from "../Sidebar";
import { usePathname } from "next/navigation";

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}));

describe("Sidebar", () => {
  it("renders correctly with dashboard active", () => {
    (usePathname as jest.Mock).mockReturnValue("/dashboard");
    render(<Sidebar />);
    expect(screen.getByText("ContextWeaver")).toBeInTheDocument();
    
    const dashboardLink = screen.getByRole("link", { name: "Dashboard" });
    expect(dashboardLink).toHaveAttribute("href", "/dashboard");
    expect(dashboardLink).toHaveClass("text-cyan-400");
    
    const historyLink = screen.getByRole("link", { name: "History" });
    expect(historyLink).not.toHaveClass("text-cyan-400");
    expect(historyLink).toHaveClass("text-slate-400");
  });

  it("renders correctly with history active", () => {
    (usePathname as jest.Mock).mockReturnValue("/history");
    render(<Sidebar />);
    
    const dashboardLink = screen.getByRole("link", { name: "Dashboard" });
    expect(dashboardLink).not.toHaveClass("text-cyan-400");
    
    const historyLink = screen.getByRole("link", { name: "History" });
    expect(historyLink).toHaveClass("text-cyan-400");
  });
});
