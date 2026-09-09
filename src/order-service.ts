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
    const confirmedOrder: Order = {
        ...order,
        status: "confirmed",
    };

    await repository.save(confirmedOrder);

    return confirmedOrder;
}