const STATUSES = ["Order Placed", "Preparing", "Out for Delivery", "Delivered"];
const STATUS_WIDTHS = ["0%", "33%", "66%", "100%"];
const STEP_EMOJIS = ["✅", "👨‍🍳", "🛵", "🏠"];

export default function StatusTimeline({ status }) {
  if (status === "Cancelled") {
    return (
      <div className="status-timeline">
        <div style={{ position: 'absolute', left: '12.5%', right: '12.5%', top: '20px', height: '3px', zIndex: 1 }}>
          <div className="status-timeline-bar" style={{ width: "0%", position: 'absolute', left: 0, top: 0, height: '100%' }} />
        </div>
        {STATUSES.map((label, i) => (
          <div className="status-step" key={label}>
            <div className="step-icon">{STEP_EMOJIS[i]}</div>
            <div className="step-label">{label}</div>
          </div>
        ))}
      </div>
    );
  }

  const idx = Math.max(STATUSES.indexOf(status), 0);

  return (
    <div className="status-timeline">
      <div style={{ position: 'absolute', left: '12.5%', right: '12.5%', top: '20px', height: '3px', zIndex: 1 }}>
        <div className="status-timeline-bar" style={{ width: STATUS_WIDTHS[idx], position: 'absolute', left: 0, top: 0, height: '100%' }} />
      </div>
      {STATUSES.map((label, i) => {
        const state = i < idx ? "done" : i === idx ? "active" : "";
        return (
          <div className="status-step" key={label}>
            <div className={`step-icon ${state}`}>{i < idx ? "✓" : STEP_EMOJIS[i]}</div>
            <div className={`step-label ${state}`}>{label}</div>
          </div>
        );
      })}
    </div>
  );
}

export { STATUSES, STEP_EMOJIS };
