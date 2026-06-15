import React from "react";
import { render, screen } from "@testing-library/react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import CreateReportModal from "../../src/components/dashboard/CreateReportModal";
import { ThemeProvider } from "@mui/material/styles";
import { getTheme } from "../../src/theme";

const theme = getTheme("light");

test("renders create report modal and allows stepping through form", async () => {
  const categories = [{ id: 1, name: "Sarana dan Prasarana", allowAnonymous: true }];
  const handleClose = vi.fn();
  const handleSubmit = vi.fn();

  render(
    <ThemeProvider theme={theme}>
      <CreateReportModal
        open={true}
        onClose={handleClose}
        categories={categories}
        onSubmit={handleSubmit}
      />
    </ThemeProvider>
  );

  // Assert modal header
  expect(screen.getByText("Buat Laporan Baru")).toBeInTheDocument();

  // Step 1: Fill Judul Laporan and select Category
  const titleInput = screen.getByLabelText("Judul Laporan");
  expect(titleInput).toBeInTheDocument();

  await userEvent.fill(titleInput, "Kerusakan AC Kelas B3");
  expect(titleInput.value).toBe("Kerusakan AC Kelas B3");

  // Select the category
  const categorySelect = screen.getByRole("combobox");
  expect(categorySelect).toBeInTheDocument();

  await userEvent.click(categorySelect);
  
  // Wait for and click option
  const option = await screen.findByRole("option", { name: "Sarana dan Prasarana" });
  await userEvent.click(option);

  // Click anonymous reporting toggle
  const anonymousToggle = screen.getByLabelText("Laporkan secara anonim");
  expect(anonymousToggle).toBeInTheDocument();
  await userEvent.click(anonymousToggle);
  expect(anonymousToggle.checked).toBe(true);

  // Proceed to next step
  const nextButton = screen.getByRole("button", { name: "Lanjutkan" });
  await userEvent.click(nextButton);

  // Step 2 should now render: Description
  const descriptionEditor = screen.getByRole("textbox");
  expect(descriptionEditor).toBeInTheDocument();
});
