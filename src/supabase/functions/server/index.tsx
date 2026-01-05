import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-85c8d415/health", (c) => {
  return c.json({ status: "ok" });
});

// ============ EXPENSES ROUTES ============

// Get all expenses for a user
app.get("/make-server-85c8d415/expenses", async (c) => {
  try {
    const expenses = await kv.get("expenses") || [];
    return c.json({ expenses });
  } catch (error) {
    console.error("Error loading expenses:", error);
    return c.json({ error: "Failed to load expenses", expenses: [] }, 500);
  }
});

// Add new expense
app.post("/make-server-85c8d415/expenses", async (c) => {
  try {
    const expense = await c.req.json();
    const expenses = await kv.get("expenses") || [];
    expenses.push(expense);
    await kv.set("expenses", expenses);
    return c.json({ success: true });
  } catch (error) {
    console.error("Error adding expense:", error);
    return c.json({ error: "Failed to add expense" }, 500);
  }
});

// Delete expense
app.delete("/make-server-85c8d415/expenses/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const expenses = await kv.get("expenses") || [];
    const filtered = expenses.filter((e: any) => e.id !== id);
    await kv.set("expenses", filtered);
    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting expense:", error);
    return c.json({ error: "Failed to delete expense" }, 500);
  }
});

// Get budgets
app.get("/make-server-85c8d415/budgets", async (c) => {
  try {
    const budgets = await kv.get("budgets") || {};
    return c.json({ budgets });
  } catch (error) {
    console.error("Error loading budgets:", error);
    return c.json({ error: "Failed to load budgets", budgets: {} }, 500);
  }
});

// Save budgets
app.post("/make-server-85c8d415/budgets", async (c) => {
  try {
    const budgets = await c.req.json();
    await kv.set("budgets", budgets);
    return c.json({ success: true });
  } catch (error) {
    console.error("Error saving budgets:", error);
    return c.json({ error: "Failed to save budgets" }, 500);
  }
});

// Get income
app.get("/make-server-85c8d415/income", async (c) => {
  try {
    const income = await kv.get("income") || 0;
    return c.json({ income });
  } catch (error) {
    console.error("Error loading income:", error);
    return c.json({ error: "Failed to load income", income: 0 }, 500);
  }
});

// Save income
app.post("/make-server-85c8d415/income", async (c) => {
  try {
    const { income } = await c.req.json();
    await kv.set("income", income);
    return c.json({ success: true });
  } catch (error) {
    console.error("Error saving income:", error);
    return c.json({ error: "Failed to save income" }, 500);
  }
});

// ============ DIARY ROUTES ============

// Get all diary entries for current user
app.get("/make-server-85c8d415/diary-entries", async (c) => {
  try {
    const entries = await kv.get("diary_entries") || [];
    return c.json({ entries });
  } catch (error) {
    console.error("Error loading diary entries:", error);
    return c.json({ error: "Failed to load diary entries", entries: [] }, 500);
  }
});

// Add new diary entry
app.post("/make-server-85c8d415/diary-entries", async (c) => {
  try {
    const entry = await c.req.json();
    const entries = await kv.get("diary_entries") || [];
    entries.push(entry);
    await kv.set("diary_entries", entries);
    return c.json({ success: true });
  } catch (error) {
    console.error("Error adding diary entry:", error);
    return c.json({ error: "Failed to add diary entry" }, 500);
  }
});

// Update diary entry
app.put("/make-server-85c8d415/diary-entries/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const updatedEntry = await c.req.json();
    const entries = await kv.get("diary_entries") || [];
    const index = entries.findIndex((e: any) => e.id === id);
    if (index !== -1) {
      entries[index] = { ...entries[index], ...updatedEntry };
      await kv.set("diary_entries", entries);
    }
    return c.json({ success: true });
  } catch (error) {
    console.error("Error updating diary entry:", error);
    return c.json({ error: "Failed to update diary entry" }, 500);
  }
});

// Delete diary entry
app.delete("/make-server-85c8d415/diary-entries/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const entries = await kv.get("diary_entries") || [];
    const filtered = entries.filter((e: any) => e.id !== id);
    await kv.set("diary_entries", filtered);
    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting diary entry:", error);
    return c.json({ error: "Failed to delete diary entry" }, 500);
  }
});

Deno.serve(app.fetch);
