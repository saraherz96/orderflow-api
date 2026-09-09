import { FormEvent, useState } from "react";

type OrderStatus = "pending" | "confirmed";

type Order = {
    id: string;
    total: number;
    deposit: number;
    status: OrderStatus;
};

type Activity = {
    id: number;
    label: string;
    detail: string;
    tone: "neutral" | "success" | "error";
    time: string;
};

const currency = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "USD",
});

async function request<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`/api${path}`, {
        headers: { "Content-Type": "application/json" },
        ...options,
    });
    const body = await response.json();
    if (!response.ok) {
        throw new Error(body.error ?? "La API no pudo completar la solicitud.");
    }
    return body as T;
}

export function App() {
    const [total, setTotal] = useState("900");
    const [deposit, setDeposit] = useState("0");
    const [order, setOrder] = useState<Order | null>(null);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [busy, setBusy] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    function addActivity(label: string, detail: string, tone: Activity["tone"]) {
        setActivities((current) => [
            {
                id: Date.now() + Math.random(),
                label,
                detail,
                tone,
                time: new Date().toLocaleTimeString("es-MX", {
                    hour: "2-digit",
                    minute: "2-digit",
                }),
            },
            ...current,
        ]);
    }

    async function handleCreate(event: FormEvent) {
        event.preventDefault();
        const numericTotal = Number(total);
        if (!numericTotal) return;

        setBusy("create");
        setNotice(null);
        try {
            const created = await request<Order>("/orders", {
                method: "POST",
                body: JSON.stringify({ total: numericTotal }),
            });
            setOrder(created);
            setDeposit(String(created.deposit));
            addActivity("Pedido creado", `POST /orders · ${created.id}`, "success");
        } catch (error) {
            const message = error instanceof Error ? error.message : "Error inesperado";
            setNotice(message);
            addActivity("Error al crear", message, "error");
        } finally {
            setBusy(null);
        }
    }

    async function handleDeposit(event: FormEvent) {
        event.preventDefault();
        if (!order) return;

        setBusy("deposit");
        setNotice(null);
        try {
            const updated = await request<Order>(`/orders/${order.id}/deposit`, {
                method: "POST",
                body: JSON.stringify({ amount: Number(deposit) }),
            });
            setOrder(updated);
            addActivity("Anticipo registrado", `POST /orders/${order.id}/deposit · ${currency.format(updated.deposit)}`, "success");
        } catch (error) {
            const message = error instanceof Error ? error.message : "Error inesperado";
            setNotice(message);
            addActivity("Error al registrar", message, "error");
        } finally {
            setBusy(null);
        }
    }

    async function handleConfirm() {
        if (!order) return;

        setBusy("confirm");
        setNotice(null);
        try {
            const confirmed = await request<Order>(`/orders/${order.id}/confirm`, {
                method: "POST",
            });
            setOrder(confirmed);
            addActivity("Pedido confirmado", `POST /orders/${order.id}/confirm · 200 OK`, "success");
        } catch (error) {
            const message = error instanceof Error ? error.message : "Error inesperado";
            setNotice(message);
            addActivity("Confirmación rechazada", `POST /orders/${order.id}/confirm · ${message}`, "error");
            try {
                setOrder(await request<Order>(`/orders/${order.id}`));
            } catch {
                // Keep the error returned by the confirmation request visible.
            }
        } finally {
            setBusy(null);
        }
    }

    const isConfirmed = order?.status === "confirmed";

    return (
        <main className="shell">
            <header className="topbar">
                <a className="brand" href="/">
                    <span className="brand-mark">OF</span>
                    <span>OrderFlow <small>CONSOLE</small></span>
                </a>
                <div className="connection"><span /> API conectada · localhost:3001</div>
            </header>

            <section className="intro">
                <div>
                    <p className="eyebrow">Operaciones / confirmación de pedidos</p>
                    <h1>Prueba el recorrido<br /><em>completo del pedido.</em></h1>
                </div>
                <p className="intro-copy">Crea una orden, registra el anticipo y observa cómo el backend decide si puede confirmarse.</p>
            </section>

            <div className="workspace">
                <section className="panel create-panel">
                    <div className="panel-kicker"><span className="step">01</span><span>Nuevo pedido</span></div>
                    <h2>Comienza con un total</h2>
                    <p className="muted">El pedido nacerá pendiente y con anticipo en cero.</p>
                    <form onSubmit={handleCreate}>
                        <label htmlFor="total">Total del pedido</label>
                        <div className="money-input"><span>$</span><input id="total" type="number" min="1" step="0.01" value={total} onChange={(event) => setTotal(event.target.value)} /></div>
                        <button className="button primary" disabled={busy !== null} type="submit">{busy === "create" ? "Creando..." : "Crear pedido"}<span>↗</span></button>
                    </form>
                    <div className="scenario-note"><span>✦</span><p><strong>Escenario de prueba</strong><br />Usa $900 para reproducir el incidente del anticipo.</p></div>
                </section>

                <section className="panel order-panel">
                    <div className="panel-kicker"><span className="step">02</span><span>Detalle del pedido</span></div>
                    {order ? (
                        <>
                            <div className="order-heading"><div><p className="order-label">ORDEN ACTIVA</p><h2>#{order.id.slice(0, 8).toUpperCase()}</h2></div><span className={`status ${order.status}`}>{isConfirmed ? "Confirmado" : "Pendiente"}</span></div>
                            <div className="metrics"><div><span>Total</span><strong>{currency.format(order.total)}</strong></div><div><span>Anticipo</span><strong>{currency.format(order.deposit)}</strong></div><div><span>Saldo</span><strong>{currency.format(order.total - order.deposit)}</strong></div></div>
                            <div className="progress"><div className="progress-head"><span>Progreso del anticipo</span><strong>{Math.min(100, Math.round((order.deposit / order.total) * 100))}%</strong></div><div className="progress-track"><span style={{ width: `${Math.min(100, (order.deposit / order.total) * 100)}%` }} /></div></div>
                            <form className="deposit-form" onSubmit={handleDeposit}><label htmlFor="deposit">Registrar anticipo</label><div className="deposit-row"><div className="money-input"><span>$</span><input id="deposit" type="number" min="0.01" step="0.01" value={deposit} onChange={(event) => setDeposit(event.target.value)} disabled={isConfirmed} /></div><button className="button secondary" disabled={busy !== null || isConfirmed} type="submit">{busy === "deposit" ? "Guardando..." : "Guardar"}</button></div></form>
                            <button className="button confirm" disabled={busy !== null || isConfirmed} onClick={handleConfirm}>{busy === "confirm" ? "Consultando API..." : isConfirmed ? "Pedido confirmado" : "Confirmar pedido"}<span>→</span></button>
                            {notice && <div className="api-error"><span>!</span><div><strong>Respuesta del backend</strong><p>{notice}</p></div></div>}
                        </>
                    ) : <div className="empty-state"><div className="empty-icon">＋</div><h3>Aún no hay un pedido</h3><p>Crea uno a la izquierda para activar sus acciones.</p></div>}
                </section>

                <aside className="panel activity-panel">
                    <div className="panel-kicker"><span className="step">03</span><span>Actividad en vivo</span></div>
                    <div className="activity-title"><h2>Historial</h2><span className="live"><i /> LIVE</span></div>
                    {activities.length ? <div className="activity-list">{activities.map((activity) => <article className="activity" key={activity.id}><span className={`activity-dot ${activity.tone}`} /><div><div className="activity-top"><strong>{activity.label}</strong><time>{activity.time}</time></div><p>{activity.detail}</p></div></article>)}</div> : <div className="activity-empty"><span>⌁</span><p>Las solicitudes y respuestas<br />aparecerán aquí.</p></div>}
                    <div className="legend"><span><i className="dot success" />Éxito</span><span><i className="dot error" />Error de negocio</span></div>
                </aside>
            </div>
            <footer><span>ORDERFLOW / DEMO ENVIRONMENT</span><span>Regla de confirmación aplicada por el servidor</span></footer>
        </main>
    );
}
