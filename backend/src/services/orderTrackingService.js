import { env } from "../config/env.js";
import { sendOrderDeliveredEmail } from "./emailService.js";

/**
 * THE FIX FOR THE TRACKING BUG
 * ----------------------------
 * The previous implementation drove delivery status entirely from a
 * `setTimeout`/`setInterval` chain inside tracking.html. That only ran
 * while the browser tab was open, which is why:
 *   - the ETA showed a fixed "33 sec" that only ever counted down if you
 *     kept the tracking page open, and
 *   - closing the tab (even after the real-world delivery window had
 *     passed) meant the order stayed stuck at whatever status it was in
 *     when the page unloaded — it never became "Delivered" server-side.
 *
 * The fix moves the clock to the server: every order stores its
 * `createdAt` timestamp, and this function derives the "true" status
 * purely from elapsed wall-clock time, independent of whether anyone is
 * looking at the tracking page. It's called whenever an order is read
 * (GET /orders/:id, GET /orders/mine, etc.), so the very next request —
 * even one made minutes later from a different device — reports the
 * correct status and persists it.
 *
 * An admin manually changing a status (adminController) flips
 * `autoProgress` to false, so a human decision is never silently
 * overwritten by the clock.
 */
const timeline = () => [
  { status: "Order Placed", afterSeconds: 0 },
  { status: "Preparing", afterSeconds: env.orderTimeline.preparingAfterSeconds },
  { status: "Out for Delivery", afterSeconds: env.orderTimeline.outForDeliveryAfterSeconds },
  { status: "Delivered", afterSeconds: env.orderTimeline.deliveredAfterSeconds },
];

export function deriveStatusFromElapsedTime(createdAt, referenceDate = new Date()) {
  const elapsedSeconds = (referenceDate.getTime() - new Date(createdAt).getTime()) / 1000;

  let current = timeline()[0].status;
  for (const stage of timeline()) {
    if (elapsedSeconds >= stage.afterSeconds) current = stage.status;
  }
  return current;
}

export function secondsUntilDelivered(createdAt, referenceDate = new Date()) {
  const elapsedSeconds = (referenceDate.getTime() - new Date(createdAt).getTime()) / 1000;
  const remaining = env.orderTimeline.deliveredAfterSeconds - elapsedSeconds;
  return Math.max(Math.ceil(remaining), 0);
}

/**
 * Re-syncs a single order document against the clock, persists any
 * change, and fires the "delivered" email exactly once. Safe to call on
 * every read — it's a no-op once the order is Delivered/Cancelled or has
 * been manually overridden by an admin.
 */
export async function syncOrderStatus(order) {
  if (!order.autoProgress) return order;
  if (order.status === "Cancelled") return order;

  const nextStatus = deriveStatusFromElapsedTime(order.createdAt);

  if (nextStatus === order.status) return order;

  order.status = nextStatus;

  if (nextStatus === "Delivered") {
    order.deliveredAt = new Date();
  }

  try {
    await order.save();

    if (nextStatus === "Delivered" && !order.notifications?.deliveredEmailSent) {
      if (!order.notifications) order.notifications = {};
      order.notifications.deliveredEmailSent = true;
      await order.save();
      await sendOrderDeliveredEmail(order);
    }
  } catch (err) {
    console.error(`Skipping auto-sync for order ${order.orderId || "unknown"} due to validation error: ${err.message}`);
  }

  return order;
}

export async function syncOrderStatuses(orders) {
  return Promise.all(orders.map((order) => syncOrderStatus(order)));
}
