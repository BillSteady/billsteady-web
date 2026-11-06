import { expect, test } from "@playwright/test";

test("add a bill end to end: type, submit, see it in Bills and in the Planner projection", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "BillSteady" })).toBeVisible();

  await page.getByRole("button", { name: "Bills" }).click();

  // Income, so the Planner screen has enough to build a projection.
  await page.getByRole("spinbutton", { name: "Income per payday (₦)" }).fill("50000");

  await page.getByRole("textbox", { name: "Bill name" }).fill("Rent");
  await page.getByRole("spinbutton", { name: "Amount (₦)" }).fill("20000");
  await page.getByRole("spinbutton", { name: "Due day of month" }).fill("5");
  await page.getByRole("button", { name: "Add bill" }).click();

  // The bill shows up in the Bills list, and the add-bill form resets.
  await expect(page.getByText("₦20,000 · due 5th")).toBeVisible();
  await expect(page.getByRole("spinbutton", { name: "Amount (₦)" })).toHaveValue("");

  // It also appears in the Planner's running-balance projection.
  await page.getByRole("button", { name: "Planner" }).click();
  await expect(page.getByText("Rent", { exact: true }).first()).toBeVisible();
});

test("edit an existing bill in place", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Bills" }).click();

  await page.getByRole("textbox", { name: "Bill name" }).fill("Electricity");
  await page.getByRole("spinbutton", { name: "Amount (₦)" }).fill("5000");
  await page.getByRole("spinbutton", { name: "Due day of month" }).fill("10");
  await page.getByRole("button", { name: "Add bill" }).click();

  // Both the "Add a bill" form and the inline edit form render at once
  // (two fields named "Amount (₦)" on screen), so scope to the edit form -
  // identified here by the "Save" button it alone has.
  const editForm = page.locator("form").filter({ has: page.getByRole("button", { name: "Save" }) });
  await page.getByRole("button", { name: "Edit Electricity" }).click();
  await editForm.getByRole("spinbutton", { name: "Amount (₦)" }).fill("7500");
  await editForm.getByRole("button", { name: "Save" }).click();

  await expect(page.getByText("₦7,500 · due 10th")).toBeVisible();
});
