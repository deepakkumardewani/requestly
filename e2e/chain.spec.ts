import { expect, type Locator, type Page, test } from "@playwright/test";

// ---------------------------------------------------------------------------
// DB helpers — all called via addInitScript so they run before page load
// ---------------------------------------------------------------------------

async function clearChainsDB(page: Page) {
  await page.addInitScript(async () => {
    const req = indexedDB.open("requestly");
    req.onsuccess = () => {
      const db = req.result;
      if (db.objectStoreNames.contains("chains")) {
        const tx = db.transaction("chains", "readwrite");
        tx.objectStore("chains").clear();
      }
      if (db.objectStoreNames.contains("chainConfigs")) {
        const tx = db.transaction("chainConfigs", "readwrite");
        tx.objectStore("chainConfigs").clear();
      }
    };
  });
}

async function clearCollectionsDB(page: Page) {
  await page.addInitScript(async () => {
    const req = indexedDB.open("requestly");
    req.onsuccess = () => {
      const db = req.result;
      if (db.objectStoreNames.contains("collections")) {
        const tx = db.transaction("collections", "readwrite");
        tx.objectStore("collections").clear();
      }
      if (db.objectStoreNames.contains("requests")) {
        const tx = db.transaction("requests", "readwrite");
        tx.objectStore("requests").clear();
      }
    };
  });
}

async function clearHistoryDB(page: Page) {
  await page.addInitScript(async () => {
    const req = indexedDB.open("requestly");
    req.onsuccess = () => {
      const db = req.result;
      if (db.objectStoreNames.contains("history")) {
        const tx = db.transaction("history", "readwrite");
        tx.objectStore("history").clear();
      }
    };
  });
}

async function clearTabsDB(page: Page) {
  await page.addInitScript(async () => {
    const req = indexedDB.open("requestly");
    req.onsuccess = () => {
      const db = req.result;
      if (db.objectStoreNames.contains("tabs")) {
        const tx = db.transaction("tabs", "readwrite");
        tx.objectStore("tabs").clear();
      }
    };
  });
}

// ---------------------------------------------------------------------------
// Layout helpers
// ---------------------------------------------------------------------------

function getLayout(page: Page): Locator {
  const viewportWidth = page.viewportSize()?.width ?? 1280;
  return viewportWidth < 768
    ? page.locator('[data-testid="mobile-layout"]')
    : page.locator('[data-testid="desktop-layout"]');
}

async function openTab(page: Page) {
  const layout = getLayout(page);
  const btn = layout.getByTestId("new-tab-btn");
  const isVisible = await btn
    .first()
    .isVisible({ timeout: 1000 })
    .catch(() => false);
  if (isVisible) {
    await btn.first().click();
  } else {
    await page.keyboard.press("Control+t");
  }
}

// ---------------------------------------------------------------------------
// Chain helpers
// ---------------------------------------------------------------------------

/**
 * Creates a standalone chain via the Create New dropdown.
 * After pressing Enter, the router navigates to /chain/{id}.
 * Awaits the URL change before returning.
 */
async function createChain(page: Page, name: string) {
  await page.getByTestId("create-new-dropdown-trigger").click();
  await page.getByTestId("create-chain-item").click();
  const input = page.getByTestId("new-chain-name-input");
  await expect(input).toBeVisible({ timeout: 5000 });
  await input.fill(name);
  await page.keyboard.press("Enter");
  await page.waitForURL("**/chain/**", { timeout: 5000 });
}

/** Returns the first chain-list-item locator and its extracted chain ID. */
async function getFirstChainItem(
  page: Page,
): Promise<{ item: Locator; chainId: string }> {
  const item = page.locator('[data-testid^="chain-list-item-"]').first();
  await expect(item).toBeVisible({ timeout: 5000 });
  const testId = (await item.getAttribute("data-testid")) ?? "";
  const chainId = testId.replace("chain-list-item-", "");
  return { item, chainId };
}

/** Opens the chain more-menu for the given chain item. */
async function openChainMoreMenu(
  page: Page,
  item: Locator,
  chainId: string,
): Promise<void> {
  await item.hover();
  await item.getByTestId(`chain-list-more-btn-${chainId}`).click();
}

// ---------------------------------------------------------------------------
// Block-node helpers
// ---------------------------------------------------------------------------

/**
 * Adds a non-API block node (condition / delay / display) to the canvas.
 * Requires the chain canvas to already be visible (at least one API node must exist).
 */
async function addBlockNode(
  page: Page,
  blockType: "condition" | "delay" | "display",
) {
  await page.getByTestId("block-menu-trigger").click();
  await page.getByTestId(`block-menu-item-${blockType}`).click();
  // Move over the pane so cursorPos is set, then click to place the node
  const pane = page.locator(".react-flow__pane").first();
  await pane.hover({ position: { x: 400, y: 200 } });
  await pane.click({ position: { x: 400, y: 200 } });
}

// ---------------------------------------------------------------------------
// Collections helpers (needed for the "add API from collection" test)
// ---------------------------------------------------------------------------

async function createCollection(page: Page, name: string) {
  await page.getByTestId("create-new-dropdown-trigger").click();
  await page.getByTestId("create-collection-item").click();
  const input = page.getByTestId("new-collection-name-input");
  await expect(input).toBeVisible({ timeout: 5000 });
  await input.fill(name);
  await page.keyboard.press("Enter");
}

async function saveRequestToCollection(
  page: Page,
  requestName: string,
  url: string,
) {
  const layout = getLayout(page);
  await layout.getByTestId("url-input").fill(url);
  await page.keyboard.press("Escape");
  await layout.getByTestId("save-request-btn").click();
  await expect(page.getByTestId("save-request-modal")).toBeVisible({
    timeout: 5000,
  });
  await page.getByTestId("save-request-name-input").fill(requestName);
  await page
    .locator('[data-testid^="collection-picker-item-"]')
    .first()
    .click();
  await page.getByTestId("save-modal-save-btn").click();
  await expect(page.getByTestId("save-request-modal")).not.toBeVisible();
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

test.describe("Chain", () => {
  test.beforeEach(async ({ page }) => {
    await clearChainsDB(page);
    await clearCollectionsDB(page);
    await clearHistoryDB(page);
    await clearTabsDB(page);
    // Reset sidebar accordion state so the Chains section is always expanded
    await page.addInitScript(() => {
      localStorage.removeItem("rq_sidebar_open_sections");
    });
    await page.goto("/");
    await expect(getLayout(page)).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // Scenario: Create a standalone chain
  // -------------------------------------------------------------------------
  test("Create a standalone chain via the Create New dropdown", async ({
    page,
  }) => {
    await createChain(page, "Auth Flow");

    // Navigated to chain page — current breadcrumb item shows the chain name
    await expect(
      page.locator('[data-slot="breadcrumb-page"]'),
    ).toContainText("Auth Flow", { timeout: 5000 });
  });

  // -------------------------------------------------------------------------
  // Scenario: Chain empty state on chain page
  // -------------------------------------------------------------------------
  test("Chain page shows empty state when no APIs have been added", async ({
    page,
  }) => {
    await createChain(page, "Empty Chain");

    await expect(page.getByTestId("chain-empty-state")).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByText("No APIs in this chain")).toBeVisible();
    await expect(page.getByTestId("chain-add-api-btn")).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // Scenario: Run Chain button disabled with no requests
  // -------------------------------------------------------------------------
  test("Run Chain button is disabled when the chain has no requests", async ({
    page,
  }) => {
    await createChain(page, "Disabled Test");

    const runBtn = page.getByTestId("run-chain-btn");
    await expect(runBtn).toBeVisible({ timeout: 5000 });
    await expect(runBtn).toBeDisabled();
  });

  // -------------------------------------------------------------------------
  // Scenario: Clear edges button is always visible
  // -------------------------------------------------------------------------
  test("Clear edges button is visible in the chain page header", async ({
    page,
  }) => {
    await createChain(page, "Edge Test");

    await expect(page.getByTestId("clear-edges-btn")).toBeVisible({
      timeout: 5000,
    });
  });

  // -------------------------------------------------------------------------
  // Scenario: Rename a chain from the sidebar
  // -------------------------------------------------------------------------
  test("Rename a standalone chain from the sidebar", async ({ page }) => {
    await createChain(page, "Original Name");

    // Use client-side navigation (breadcrumb Home link) to preserve Zustand store state
    await page.getByRole("link", { name: "Home" }).click();
    await page.waitForURL("/");

    const { item, chainId } = await getFirstChainItem(page);
    await openChainMoreMenu(page, item, chainId);
    await page.getByTestId("chain-rename-btn").click();

    const renameInput = page.getByTestId("chain-rename-input");
    await expect(renameInput).toBeVisible({ timeout: 3000 });
    await renameInput.fill("Renamed Chain");
    await page.keyboard.press("Enter");

    await expect(item).toContainText("Renamed Chain", { timeout: 5000 });
    await expect(item).not.toContainText("Original Name");
  });

  // -------------------------------------------------------------------------
  // Scenario: Delete a chain from the sidebar
  // -------------------------------------------------------------------------
  test("Delete a standalone chain from the sidebar", async ({ page }) => {
    await createChain(page, "Chain To Delete");

    // Use client-side navigation (breadcrumb Home link) to preserve Zustand store state
    await page.getByRole("link", { name: "Home" }).click();
    await page.waitForURL("/");

    const { item, chainId } = await getFirstChainItem(page);
    await openChainMoreMenu(page, item, chainId);
    await page.getByTestId("chain-delete-btn").click();

    // Chain is deleted immediately (no confirmation dialog)
    await expect(
      page.locator('[data-testid^="chain-list-item-"]'),
    ).not.toBeVisible({ timeout: 5000 });
  });

  // -------------------------------------------------------------------------
  // Scenario: Open API picker from empty state
  // -------------------------------------------------------------------------
  test("Open the API picker dialog from the empty state Add API button", async ({
    page,
  }) => {
    await createChain(page, "Picker Test");

    await page.getByTestId("chain-add-api-btn").click();

    await expect(page.getByTestId("api-picker-dialog")).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByText("Add API Request")).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // Scenario: API picker has Collections and History tabs
  // -------------------------------------------------------------------------
  test("API picker dialog has Collections and History tabs", async ({
    page,
  }) => {
    await createChain(page, "Tabs Test");

    await page.getByTestId("chain-add-api-btn").click();
    await expect(page.getByTestId("api-picker-dialog")).toBeVisible({
      timeout: 5000,
    });

    await expect(
      page.getByRole("tab", { name: "Collections" }),
    ).toBeVisible();
    await expect(page.getByRole("tab", { name: "History" })).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // Scenario: Collections tab empty state
  // -------------------------------------------------------------------------
  test("API picker Collections tab shows empty state when no collections exist", async ({
    page,
  }) => {
    await createChain(page, "No Collections Test");

    await page.getByTestId("chain-add-api-btn").click();
    await expect(page.getByTestId("api-picker-dialog")).toBeVisible({
      timeout: 5000,
    });

    // Collections tab is selected by default
    await expect(page.getByText("No collections yet")).toBeVisible({
      timeout: 3000,
    });
  });

  // -------------------------------------------------------------------------
  // Scenario: History tab empty state
  // -------------------------------------------------------------------------
  test("API picker History tab shows empty state when no history exists", async ({
    page,
  }) => {
    await createChain(page, "No History Test");

    await page.getByTestId("chain-add-api-btn").click();
    await expect(page.getByTestId("api-picker-dialog")).toBeVisible({
      timeout: 5000,
    });

    await page.getByRole("tab", { name: "History" }).click();
    await expect(page.getByText("No history yet")).toBeVisible({
      timeout: 3000,
    });
  });

  // -------------------------------------------------------------------------
  // Scenario: Dismiss API picker with Escape
  // -------------------------------------------------------------------------
  test("Dismiss the API picker dialog with Escape", async ({ page }) => {
    await createChain(page, "Dismiss Test");

    await page.getByTestId("chain-add-api-btn").click();
    await expect(page.getByTestId("api-picker-dialog")).toBeVisible({
      timeout: 5000,
    });

    await page.keyboard.press("Escape");
    await expect(page.getByTestId("api-picker-dialog")).not.toBeVisible({
      timeout: 3000,
    });

    // Empty state is still showing — no node was added
    await expect(page.getByTestId("chain-empty-state")).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // NEW SCENARIOS — multi-node chains, blocks, run results
  // -------------------------------------------------------------------------

  // Scenario: Add multiple API nodes and verify request count updates
  test("Add multiple API nodes and verify request count updates", async ({
    page,
  }) => {
    await openTab(page);
    await createCollection(page, "Multi Node Collection");
    await saveRequestToCollection(
      page,
      "Request One",
      "https://dummyjson.com/products/1",
    );

    // Open a fresh tab for the second request
    await openTab(page);
    await saveRequestToCollection(
      page,
      "Request Two",
      "https://dummyjson.com/products/2",
    );

    await createChain(page, "Multi Node Chain");

    // First request via empty-state button
    await page.getByTestId("chain-add-api-btn").click();
    await expect(page.getByTestId("api-picker-dialog")).toBeVisible({
      timeout: 5000,
    });
    await page.getByText("Request One").click();
    await expect(page.getByTestId("api-picker-dialog")).not.toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByTestId("chain-request-count")).toContainText(
      "1 request",
      { timeout: 5000 },
    );

    // Second request via block menu
    await page.getByTestId("block-menu-trigger").click();
    await page.getByTestId("block-menu-item-api").click();
    await expect(page.getByTestId("api-picker-dialog")).toBeVisible({
      timeout: 5000,
    });
    await page.getByText("Request Two").click();
    await expect(page.getByTestId("api-picker-dialog")).not.toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByTestId("chain-request-count")).toContainText(
      "2 requests",
      { timeout: 5000 },
    );
  });

  // Scenario: Block menu shows all four block types
  test("Block menu shows all four block types", async ({ page }) => {
    await openTab(page);
    await createCollection(page, "Block Menu Collection");
    await saveRequestToCollection(
      page,
      "Starter",
      "https://dummyjson.com/products/1",
    );

    await createChain(page, "Block Menu Chain");
    await page.getByTestId("chain-add-api-btn").click();
    await expect(page.getByTestId("api-picker-dialog")).toBeVisible({
      timeout: 5000,
    });
    await page.getByText("Starter").click();
    await expect(page.getByTestId("api-picker-dialog")).not.toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByTestId("chain-request-count")).toContainText(
      "1 request",
      { timeout: 5000 },
    );

    await page.getByTestId("block-menu-trigger").click();

    await expect(page.getByTestId("block-menu-item-api")).toBeVisible();
    await expect(page.getByTestId("block-menu-item-condition")).toBeVisible();
    await expect(page.getByTestId("block-menu-item-delay")).toBeVisible();
    await expect(page.getByTestId("block-menu-item-display")).toBeVisible();

    await page.keyboard.press("Escape");
  });

  // Scenario: Add a Delay block and verify it appears with the default delay
  test("Add a Delay block and verify it appears on the canvas with default delay", async ({
    page,
  }) => {
    await openTab(page);
    await createCollection(page, "Delay Test Collection");
    await saveRequestToCollection(
      page,
      "Start Request",
      "https://dummyjson.com/products/1",
    );

    await createChain(page, "Delay Chain");
    await page.getByTestId("chain-add-api-btn").click();
    await expect(page.getByTestId("api-picker-dialog")).toBeVisible({
      timeout: 5000,
    });
    await page.getByText("Start Request").click();
    await expect(page.getByTestId("api-picker-dialog")).not.toBeVisible({
      timeout: 5000,
    });

    await addBlockNode(page, "delay");

    // Default delayMs is 1000 — shown on the value button
    await expect(page.getByTestId("delay-value-btn")).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByTestId("delay-value-btn")).toContainText("1000");
  });

  // Scenario: Add a Display block and verify it appears on the canvas
  test("Add a Display block and verify it appears on the canvas", async ({
    page,
  }) => {
    await openTab(page);
    await createCollection(page, "Display Test Collection");
    await saveRequestToCollection(
      page,
      "Source Request",
      "https://dummyjson.com/products/1",
    );

    await createChain(page, "Display Chain");
    await page.getByTestId("chain-add-api-btn").click();
    await expect(page.getByTestId("api-picker-dialog")).toBeVisible({
      timeout: 5000,
    });
    await page.getByText("Source Request").click();
    await expect(page.getByTestId("api-picker-dialog")).not.toBeVisible({
      timeout: 5000,
    });

    await addBlockNode(page, "display");

    await expect(
      page.locator('[data-testid^="display-node-"]'),
    ).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("No response yet")).toBeVisible({
      timeout: 3000,
    });
  });

  // Scenario: Add a Condition block and verify the config panel opens automatically
  test("Add a Condition block and verify the config panel opens automatically", async ({
    page,
  }) => {
    await openTab(page);
    await createCollection(page, "Condition Test Collection");
    await saveRequestToCollection(
      page,
      "API Request",
      "https://dummyjson.com/products/1",
    );

    await createChain(page, "Condition Chain");
    await page.getByTestId("chain-add-api-btn").click();
    await expect(page.getByTestId("api-picker-dialog")).toBeVisible({
      timeout: 5000,
    });
    await page.getByText("API Request", { exact: true }).click();
    await expect(page.getByTestId("api-picker-dialog")).not.toBeVisible({
      timeout: 5000,
    });

    await addBlockNode(page, "condition");

    // Placing a condition node auto-opens the ConditionConfigPanel
    await expect(page.getByText("Configure Condition")).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByPlaceholder("e.g. {{role}}")).toBeVisible();
  });

  // Scenario: Condition config panel can be saved and the node stays on the canvas
  test("Condition block config panel can be saved and node remains on the canvas", async ({
    page,
  }) => {
    await openTab(page);
    await createCollection(page, "Condition Save Collection");
    await saveRequestToCollection(
      page,
      "First Request",
      "https://dummyjson.com/products/1",
    );

    await createChain(page, "Condition Save Chain");
    await page.getByTestId("chain-add-api-btn").click();
    await expect(page.getByTestId("api-picker-dialog")).toBeVisible({
      timeout: 5000,
    });
    await page.getByText("First Request").click();
    await expect(page.getByTestId("api-picker-dialog")).not.toBeVisible({
      timeout: 5000,
    });

    await addBlockNode(page, "condition");

    // Auto-opened config panel
    await expect(page.getByText("Configure Condition")).toBeVisible({
      timeout: 5000,
    });

    // Save the condition node as-is
    await page.getByRole("button", { name: "Save" }).click();

    // Panel closes and condition node is visible on the canvas
    await expect(page.getByText("Configure Condition")).not.toBeVisible({
      timeout: 3000,
    });
    await expect(
      page.locator('[data-testid^="condition-node-"]'),
    ).toBeVisible({ timeout: 5000 });
  });

  // Scenario: Run a single-API chain and see passed count in header
  test("Run a chain with a single API node shows passed count in header", async ({
    page,
  }) => {
    await openTab(page);
    await createCollection(page, "Run Single Collection");
    await saveRequestToCollection(
      page,
      "Get Product",
      "https://dummyjson.com/products/1",
    );

    await createChain(page, "Run Single Chain");
    await page.getByTestId("chain-add-api-btn").click();
    await expect(page.getByTestId("api-picker-dialog")).toBeVisible({
      timeout: 5000,
    });
    await page.getByText("Get Product").click();
    await expect(page.getByTestId("api-picker-dialog")).not.toBeVisible({
      timeout: 5000,
    });

    await page.getByTestId("run-chain-btn").click();

    await expect(page.getByTestId("chain-passed-count")).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByTestId("chain-passed-count")).toContainText("1");
  });

  // Scenario: Run a chain with multiple API nodes shows correct pass count
  test("Run a chain with multiple API nodes shows correct pass count", async ({
    page,
  }) => {
    await openTab(page);
    await createCollection(page, "Multi Run Collection");
    await saveRequestToCollection(
      page,
      "Node One",
      "https://dummyjson.com/products/1",
    );
    await openTab(page);
    await saveRequestToCollection(
      page,
      "Node Two",
      "https://dummyjson.com/products/2",
    );

    await createChain(page, "Multi Run Chain");

    await page.getByTestId("chain-add-api-btn").click();
    await expect(page.getByTestId("api-picker-dialog")).toBeVisible({
      timeout: 5000,
    });
    await page.getByText("Node One").click();
    await expect(page.getByTestId("api-picker-dialog")).not.toBeVisible({
      timeout: 5000,
    });

    await page.getByTestId("block-menu-trigger").click();
    await page.getByTestId("block-menu-item-api").click();
    await expect(page.getByTestId("api-picker-dialog")).toBeVisible({
      timeout: 5000,
    });
    await page.getByText("Node Two").click();
    await expect(page.getByTestId("api-picker-dialog")).not.toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByTestId("chain-request-count")).toContainText(
      "2 requests",
      { timeout: 5000 },
    );

    await page.getByTestId("run-chain-btn").click();

    await expect(page.getByTestId("chain-passed-count")).toBeVisible({
      timeout: 20000,
    });
    await expect(page.getByTestId("chain-passed-count")).toContainText("2");
  });

  // Scenario: API node shows failed count in header when request returns an error
  test("API node shows failed count in header when request returns an error status", async ({
    page,
  }) => {
    await openTab(page);
    await createCollection(page, "Fail Test Collection");
    // dummyjson returns 404 for unknown paths — chain runner marks non-2xx as failed
    await saveRequestToCollection(
      page,
      "Bad Request",
      "https://dummyjson.com/nonexistent-404-path",
    );

    await createChain(page, "Fail Chain");
    await page.getByTestId("chain-add-api-btn").click();
    await expect(page.getByTestId("api-picker-dialog")).toBeVisible({
      timeout: 5000,
    });
    await page.getByText("Bad Request").click();
    await expect(page.getByTestId("api-picker-dialog")).not.toBeVisible({
      timeout: 5000,
    });

    await page.getByTestId("run-chain-btn").click();

    await expect(page.getByTestId("chain-failed-count")).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByTestId("chain-failed-count")).toContainText("1");
  });

  // Scenario: Clear edges removes connections but keeps nodes on the canvas
  test("Clear edges removes connections but keeps nodes on the canvas", async ({
    page,
  }) => {
    await openTab(page);
    await createCollection(page, "Clear Edges Collection");
    await saveRequestToCollection(
      page,
      "Node A",
      "https://dummyjson.com/products/1",
    );
    await openTab(page);
    await saveRequestToCollection(
      page,
      "Node B",
      "https://dummyjson.com/products/2",
    );

    await createChain(page, "Clear Edges Chain");

    await page.getByTestId("chain-add-api-btn").click();
    await expect(page.getByTestId("api-picker-dialog")).toBeVisible({
      timeout: 5000,
    });
    await page.getByText("Node A").click();
    await expect(page.getByTestId("api-picker-dialog")).not.toBeVisible({
      timeout: 5000,
    });

    await page.getByTestId("block-menu-trigger").click();
    await page.getByTestId("block-menu-item-api").click();
    await expect(page.getByTestId("api-picker-dialog")).toBeVisible({
      timeout: 5000,
    });
    await page.getByText("Node B").click();
    await expect(page.getByTestId("api-picker-dialog")).not.toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByTestId("chain-request-count")).toContainText(
      "2 requests",
      { timeout: 5000 },
    );

    await page.getByTestId("clear-edges-btn").click();

    // Nodes are still present — request count unchanged
    await expect(page.getByTestId("chain-request-count")).toContainText(
      "2 requests",
    );
    // Run Chain stays enabled because nodes still exist
    await expect(page.getByTestId("run-chain-btn")).toBeEnabled();
  });

  // -------------------------------------------------------------------------
  // ORIGINAL SCENARIO: Add an API from a collection to the chain
  // -------------------------------------------------------------------------
  test("Add an API from a collection to the chain via the picker", async ({
    page,
  }) => {
    // Set up: open a tab, create a collection, save a request
    await openTab(page);
    await expect(getLayout(page).getByTestId("url-input")).toBeVisible();

    await createCollection(page, "Products API");
    await expect(page.getByText("Products API")).toBeVisible({ timeout: 5000 });

    await saveRequestToCollection(
      page,
      "Get Product",
      "https://dummyjson.com/products/1",
    );

    // Create a chain — navigates to chain page
    await createChain(page, "Product Chain");

    // Open the picker
    await page.getByTestId("chain-add-api-btn").click();
    await expect(page.getByTestId("api-picker-dialog")).toBeVisible({
      timeout: 5000,
    });

    // The collection should be visible with "Get Product"
    await expect(page.getByText("Products API")).toBeVisible({ timeout: 3000 });
    await expect(page.getByText("Get Product")).toBeVisible({ timeout: 3000 });

    // Click the request row to add it
    await page.getByText("Get Product").click();

    // Dialog closes after adding
    await expect(page.getByTestId("api-picker-dialog")).not.toBeVisible({
      timeout: 5000,
    });

    // Chain now has 1 request — empty state is gone
    await expect(page.getByTestId("chain-empty-state")).not.toBeVisible({
      timeout: 5000,
    });

    // Header request count shows 1 request
    await expect(page.getByTestId("chain-request-count")).toContainText(
      "1 request",
      { timeout: 5000 },
    );

    // Run Chain button becomes enabled
    await expect(page.getByTestId("run-chain-btn")).toBeEnabled({
      timeout: 3000,
    });
  });
});
