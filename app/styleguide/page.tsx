import styles from "./styleguide.module.scss";

// Mirrors the token names/values in styles/_tokens.scss. The swatch *colors*
// are generated from the tokens in SCSS; these strings just label them.
const COLOR_GROUPS: { title: string; colors: { name: string; hex: string }[] }[] = [
  {
    title: "Brand & field",
    colors: [
      { name: "grass", hex: "#2f7d46" },
      { name: "grass-dark", hex: "#1f5a31" },
      { name: "dirt", hex: "#b5743f" },
      { name: "chalk", hex: "#f7f7f2" },
    ],
  },
  {
    title: "Ink & surfaces",
    colors: [
      { name: "ink", hex: "#16181d" },
      { name: "ink-soft", hex: "#3a3f4b" },
      { name: "muted", hex: "#6b7280" },
      { name: "line", hex: "#d9dce3" },
      { name: "surface", hex: "#ffffff" },
      { name: "surface-alt", hex: "#f3f4f6" },
      { name: "bg", hex: "#fbfbf9" },
    ],
  },
  {
    title: "Semantic",
    colors: [
      { name: "accent", hex: "#c8472b" },
      { name: "accent-dark", hex: "#9c3420" },
      { name: "positive", hex: "#2f7d46" },
      { name: "warning", hex: "#c98a1b" },
      { name: "danger", hex: "#b3261e" },
    ],
  },
];

const TYPE_SCALE = ["3xl", "2xl", "xl", "lg", "base", "sm", "xs"] as const;

const SPACE_SCALE: { name: string; value: string }[] = [
  { name: "space-1", value: "0.25rem" },
  { name: "space-2", value: "0.5rem" },
  { name: "space-3", value: "0.75rem" },
  { name: "space-4", value: "1rem" },
  { name: "space-5", value: "1.5rem" },
  { name: "space-6", value: "2rem" },
  { name: "space-8", value: "3rem" },
  { name: "space-10", value: "4rem" },
];

const RADII = ["sm", "md", "lg", "pill"] as const;

export default function StyleGuidePage() {
  return (
    <main className="container page">
      <header className={styles.section}>
        <h1>Style guide</h1>
        <p className="muted">
          Living reference for the design system in <span className="mono">styles/</span>.
          Everything here is generated from the same tokens the app uses.
        </p>
      </header>

      {/* Colors ------------------------------------------------------------ */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Color</h2>
        {COLOR_GROUPS.map((group) => (
          <div key={group.title} className={styles.section} style={{ paddingBlock: 0, borderTop: 0 }}>
            <h3 className="muted">{group.title}</h3>
            <div className={styles.swatchGrid}>
              {group.colors.map((c) => (
                <div key={c.name} className={styles.swatch}>
                  <div className={`${styles.swatchChip} ${styles[`chip-${c.name}`]}`} />
                  <div className={styles.swatchMeta}>
                    <span className={styles.swatchName}>{c.name}</span>
                    <span className={styles.swatchHex}>{c.hex}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Typography -------------------------------------------------------- */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Typography</h2>
        <p className={styles.sectionNote}>Type scale (text-*)</p>
        <div>
          {TYPE_SCALE.map((size) => (
            <div key={size} className={styles.typeRow}>
              <span className={styles.typeLabel}>text-{size}</span>
              <span className={`${styles.typeSample} ${styles[`type-${size}`]}`}>
                The quick brown fox grounds out 6-3
              </span>
            </div>
          ))}
        </div>
        <p className={styles.sectionNote}>Weights</p>
        <div className={`${styles.weights} ${styles["type-lg"]}`}>
          <span className={styles.weightRegular}>Regular 400</span>
          <span className={styles.weightMedium}>Medium 500</span>
          <span className={styles.weightBold}>Bold 700</span>
        </div>
        <p className={styles.sectionNote}>Monospace (.mono)</p>
        <p className="mono">K ꓘ BB · 6-4-3 double play · 0.300 AVG</p>
      </section>

      {/* Spacing ----------------------------------------------------------- */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Spacing</h2>
        <p className={styles.sectionNote}>4px base scale</p>
        <div className={styles.section} style={{ paddingBlock: 0, borderTop: 0, gap: "0.75rem" }}>
          {SPACE_SCALE.map((s) => (
            <div key={s.name} className={styles.spaceRow}>
              <span className={styles.spaceLabel}>{s.name}</span>
              <span className={`${styles.spaceBar} ${styles[`bar-${s.name.replace("space-", "")}`]}`} />
              <span className="muted mono">{s.value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Radii ------------------------------------------------------------- */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Radii</h2>
        <div className={styles.tileGrid}>
          {RADII.map((r) => (
            <div key={r} className={`${styles.tile} ${styles[`radius-${r}`]}`}>
              radius-{r}
            </div>
          ))}
        </div>
      </section>

      {/* Shadows ----------------------------------------------------------- */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Elevation</h2>
        <div className={styles.tileGrid}>
          <div className={`${styles.tile} ${styles.shadowSm}`} style={{ border: 0 }}>
            shadow-sm
          </div>
          <div className={`${styles.tile} ${styles.shadowMd}`} style={{ border: 0 }}>
            shadow-md
          </div>
        </div>
      </section>

      {/* Buttons ----------------------------------------------------------- */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Buttons</h2>
        <div className={styles.row}>
          <button className="btn">Default</button>
          <button className="btn btn--primary">Primary</button>
          <a className="btn" href="#top">Link as button</a>
        </div>
        <p className={styles.sectionNote}>Tab to a button to see the focus ring.</p>
      </section>

      {/* Cards ------------------------------------------------------------- */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Cards</h2>
        <div className={styles.cardDemoGrid}>
          <div className="card">
            <h3>Card</h3>
            <p className="muted">.card — surface, line border, sm shadow, lg radius.</p>
          </div>
          <div className="card">
            <h3>With actions</h3>
            <p className="muted">Compose freely with other utilities.</p>
            <div className={styles.row} style={{ marginTop: "1rem" }}>
              <button className="btn btn--primary">Save</button>
              <button className="btn">Cancel</button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
