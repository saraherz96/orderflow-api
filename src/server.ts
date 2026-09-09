import express from "express";
import { randomUUID } from "node:crypto";
import {
    confirmOrder,
    type Order,
    type OrderRepository,
} from "./order-service.js";

const app = express();
const port = 3001;

app.use(express.json());

const orders = new Map<string, Order>();

const repository: OrderRepository = {
    async save(order) {
        orders.set(order.id, { ...order });
    },
};

app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "orderflow-api" });
});

app.post("/orders", async (req, res) => {
    const total = req.body?.total;

    if (
        typeof total !== "number" ||
        !Number.isFinite(total) ||
        total <= 0
    ) {
        res.status(400).json({
            error: "Total must be a positive number.",
        });
        return;
    }

    const order: Order = {
        id: randomUUID(),
        total,
        deposit: 0,
        status: "pending",
    };

    await repository.save(order);

    res.status(201).json(order);
});

app.get("/orders/:id", (req, res) => {
    const order = orders.get(req.params.id);

    if (!order) {
        res.status(404).json({ error: "Order not found." });
        return;
    }

    res.json(order);
});

app.post("/orders/:id/deposit", async (req, res) => {
    const order = orders.get(req.params.id);

    if (!order) {
        res.status(404).json({ error: "Order not found." });
        return;
    }

    if (order.status === "confirmed") {
        res.status(409).json({
            error: "Cannot change the deposit of a confirmed order.",
        });
        return;
    }

    const amount = req.body?.amount;

    if (
        typeof amount !== "number" ||
        !Number.isFinite(amount) ||
        amount <= 0 ||
        amount > order.total
    ) {
        res.status(400).json({
            error: "Deposit must be positive and cannot exceed the order total.",
        });
        return;
    }

    const updatedOrder: Order = {
        ...order,
        deposit: amount,
    };

    await repository.save(updatedOrder);

    res.json(updatedOrder);
});

app.post("/orders/:id/confirm", async (req, res) => {
    const order = orders.get(req.params.id);

    if (!order) {
        res.status(404).json({ error: "Order not found." });
        return;
    }

    if (order.status === "confirmed") {
        res.status(409).json({ error: "Order is already confirmed." });
        return;
    }

    try {
        const confirmedOrder = await confirmOrder(order, repository);
        res.json(confirmedOrder);
    } catch (error) {
        res.status(400).json({
            error: error instanceof Error ? error.message : "Confirmation failed.",
        });
    }
});

app.listen(port, () => {
    console.log(`OrderFlow API running at http://localhost:${port}`);
});