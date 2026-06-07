import React from "react";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { userEvent } from "vitest/browser";
import { expect, test, afterEach } from "vitest";
import LoginPage from "../../src/pages/LoginPage";
import RegisterPage from "../../src/pages/RegisterPage";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import { getTheme } from "../../src/theme";

const theme = getTheme("light");

afterEach(() => {
  cleanup();
});

test("renders login page and allows typing credentials", async () => {
  render(
    <ThemeProvider theme={theme}>
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    </ThemeProvider>
  );

  // Check login header
  const loginHeader = screen.getByText("Login Akun");
  expect(loginHeader).toBeInTheDocument();

  // Find inputs by placeholder or label
  const emailInput = screen.getByLabelText(/email kampus/i);
  const passwordInput = screen.getByLabelText(/^password$/i);
  const submitButton = screen.getByRole("button", { name: /masuk ke akun/i });

  expect(emailInput).toBeInTheDocument();
  expect(passwordInput).toBeInTheDocument();
  expect(submitButton).toBeInTheDocument();

  // Simulate user filling the fields
  await userEvent.fill(emailInput, "student@mahasiswa.bunghatta.ac.id");
  await userEvent.fill(passwordInput, "password123");

  expect(emailInput.value).toBe("student@mahasiswa.bunghatta.ac.id");
  expect(passwordInput.value).toBe("password123");
});

test("renders registration stepper and allows stepping through form steps", async () => {
  render(
    <ThemeProvider theme={theme}>
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    </ThemeProvider>
  );

  // 1. Verify we are on Step 1: Identitas Mahasiswa
  const headerText = screen.getByText("Bergabung dengan Kami");
  expect(headerText).toBeInTheDocument();

  const nimInput = screen.getByLabelText(/NIM \(Nomor Induk Mahasiswa\)/i);
  const nameInput = screen.getByLabelText(/Nama Lengkap/i);
  const emailInput = screen.getByLabelText(/Email Kampus/i);
  
  expect(nimInput).toBeInTheDocument();
  expect(nameInput).toBeInTheDocument();
  expect(emailInput).toBeInTheDocument();

  // Fill in Step 1
  await userEvent.fill(nimInput, "2021001234");
  await userEvent.fill(nameInput, "Budi Santoso");
  await userEvent.fill(emailInput, "budi@mahasiswa.bunghatta.ac.id");

  // Click Lanjutkan
  const nextButton1 = screen.getAllByRole("button", { name: /Lanjutkan/i })[0];
  expect(nextButton1).toBeInTheDocument();
  await userEvent.click(nextButton1);

  // 2. Verify we are on Step 2: Keamanan Akun
  const passwordInput = screen.getByLabelText(/^Password$/i);
  const confirmPasswordInput = screen.getByLabelText(/Konfirmasi Password/i);
  expect(passwordInput).toBeInTheDocument();
  expect(confirmPasswordInput).toBeInTheDocument();

  // Fill in Step 2
  await userEvent.fill(passwordInput, "P@ssword123");
  await userEvent.fill(confirmPasswordInput, "P@ssword123");

  // Click Lanjutkan
  const nextButton2 = screen.getAllByRole("button", { name: /Lanjutkan/i })[1];
  expect(nextButton2).toBeInTheDocument();
  await userEvent.click(nextButton2);

  // 3. Verify we are on Step 3: Verifikasi (KTM upload screen)
  const uploadTitle = screen.getByText("Upload KTM Anda");
  expect(uploadTitle).toBeInTheDocument();
});

test("shows validation error on invalid KTM file upload in step 3", async () => {
  render(
    <ThemeProvider theme={theme}>
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    </ThemeProvider>
  );

  // Step 1: Identitas Mahasiswa
  await userEvent.fill(screen.getByLabelText(/NIM/i), "2021001234");
  await userEvent.fill(screen.getByLabelText(/Nama Lengkap/i), "Budi Santoso");
  await userEvent.fill(screen.getByLabelText(/Email Kampus/i), "budi@mahasiswa.bunghatta.ac.id");
  await userEvent.click(screen.getAllByRole("button", { name: /Lanjutkan/i })[0]);

  // Step 2: Keamanan Akun
  await userEvent.fill(screen.getByLabelText(/^Password$/i), "P@ssword123");
  await userEvent.fill(screen.getByLabelText(/Konfirmasi Password/i), "P@ssword123");
  await userEvent.click(screen.getAllByRole("button", { name: /Lanjutkan/i })[1]);

  // Step 3: Upload KTM
  const fileInput = document.querySelector('input[type="file"]');
  expect(fileInput).toBeInTheDocument();

  // Test Case 1: Upload a PDF file (which is invalid according to aligned constraints)
  const invalidFile = new File(["dummy content"], "test.pdf", { type: "application/pdf" });
  fireEvent.change(fileInput, { target: { files: [invalidFile] } });

  const typeError = await screen.findByText(/File harus berupa gambar/i);
  expect(typeError).toBeInTheDocument();

  // Test Case 2: Upload a file > 5MB
  // Test Case 2: Upload a file > 15MB (limit is now 15MB initial due to client compression)
  const hugeFile = new File([new ArrayBuffer(16 * 1024 * 1024)], "huge.png", { type: "image/png" });
  fireEvent.change(fileInput, { target: { files: [hugeFile] } });

  const sizeError = await screen.findByText(/Ukuran file asli terlalu besar/i);
  expect(sizeError).toBeInTheDocument();
});

