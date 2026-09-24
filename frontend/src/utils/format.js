export function formatDate(dateString) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

export function statusBadgeClass(status) {
  switch (status) {
    case "Order Placed":
      return "status-placed";
    case "Preparing":
      return "status-preparing";
    case "Out for Delivery":
      return "status-delivery";
    case "Delivered":
      return "status-delivered";
    case "Cancelled":
      return "status-cancelled";
    default:
      return "";
  }
}
