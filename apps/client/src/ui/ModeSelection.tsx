export function ModeSelection({
  onLocal,
  onOnline,
}: {
  onLocal: () => void;
  onOnline: () => void;
}) {
  return (
    <section className="menu-card mode-selection" aria-labelledby="mode-title">
      <p className="eyebrow">Odd Tower · Floor 1</p>
      <h1 id="mode-title">Choose how to play</h1>
      <p>Train locally with the complete prototype, or enter the shared combat sandbox.</p>
      <div className="mode-grid">
        <button aria-label="Local Prototype" onClick={onLocal}>
          <strong>Local Prototype</strong>
          <span>Combat, Auto Hunt, EXP, and respawning. No server required.</span>
        </button>
        <button aria-label="Online Shared Combat Sandbox" onClick={onOnline}>
          <strong>Online Shared Combat Sandbox</strong>
          <span>Create or join a room with up to ten teams fighting the same monsters.</span>
        </button>
      </div>
    </section>
  );
}
