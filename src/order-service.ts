export interface Order {
    id: string;
    total: number;
    deposit?: number;
    status: "pending" | "confirmed";
}

export interface OrderRepository {
    save(order: Order): Promise<void>;
}

export async function confirmOrder(
    order: Order,
    repository: OrderRepository,
): Promise<Order> {
    if (
        order.deposit === undefined ||
        !Number.isFinite(order.deposit) ||
        order.deposit <= 0
    ) {
        throw new Error("A positive deposit is required to confirm an order.");
    }

    const confirmedOrder: Order = {
        ...order,
        status: "confirmed",
    };

    await repository.save(confirmedOrder);

    return confirmedOrder;
}