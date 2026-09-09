import { describe, expect, it, vi } from "vitest";
import {
    confirmOrder,
    type Order,
    type OrderRepository,
} from "../src/order-service.js";

function createRepository() {
    return {
        save: vi.fn<OrderRepository["save"]>().mockResolvedValue(undefined),
    };
}

describe("Deposit validation", () => {
    it.each([
        { label: "zero", deposit: 0 },
        { label: "negative", deposit: -100 },
        { label: "missing", deposit: undefined },
    ])(
        "rejects a $label deposit without modifying or saving the order",
        async ({ deposit }) => {
            const order: Order = {
                id: "order-001",
                total: 900,
                status: "pending",
            };

            if (deposit !== undefined) {
                order.deposit = deposit;
            }

            const originalOrder = { ...order };
            const repository = createRepository();

            await expect(confirmOrder(order, repository)).rejects.toThrow(
                "A positive deposit is required",
            );

            expect(order).toEqual(originalOrder);
            expect(repository.save).not.toHaveBeenCalled();
        },
    );

    it("confirms and saves an order with a positive deposit", async () => {
        const order: Order = {
            id: "order-002",
            total: 900,
            deposit: 300,
            status: "pending",
        };

        const repository = createRepository();

        const result = await confirmOrder(order, repository);

        expect(result).toEqual({
            ...order,
            status: "confirmed",
        });

        expect(repository.save).toHaveBeenCalledExactlyOnceWith(result);
    });
});