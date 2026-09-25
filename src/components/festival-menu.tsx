"use client";

import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { addonImage, spiceLevel, useProductImage } from "@/lib/festival-product-helpers";
import {
  FESTIVAL_ACCESS_MINUTES,
  fetchFestival,
  orderedFestival,
  type FestivalEntry,
  type FestivalSection
} from "@/lib/festival-service";
import type { MenuItem } from "@/lib/types";
import "./festival.css";

const publicSections: Array<{ id: FestivalSection; label: string }> = [
  { id: "ramen", label: "Festival Ramen" },
  { id: "addons", label: "Add-Ons" },
  { id: "snacks", label: "K-Snacks & Sides" },
  { id: "drinks", label: "Drinks" }
];

const navigationSections: Array<{ id: FestivalSection; label: string }> = [
  { id: "ramen", label: "Ramen" },
  { id: "drinks", label: "Drinks" },
  { id: "snacks", label: "K-Snacks & Sides" }
];

function money(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value);
}

function FoodMarker({ item }: { item: MenuItem }) {
  if (!item.food_type) return null;
  return <span className={`festival-food-marker ${item.food_type}`} aria-label={item.food_type === "veg" ? "Vegetarian" : "Non-vegetarian"} />;
}

function FestivalSpice({ item }: { item: MenuItem }) {
  const level = spiceLevel(item);
  return (
    <span className="festival-spice" aria-label={`${level} out of 5 spice level`}>
      {Array.from({ length: 4 }).map((_, index) => (
        <img alt="" aria-hidden="true" className={index < Math.min(level, 4) ? "active" : "inactive"} key={index} src="/spice-chilli.png" />
      ))}
    </span>
  );
}

function FestivalItemCard({ entry }: { entry: FestivalEntry }) {
  const product = entry.product;
  const item = (product ?? {
    id: entry.id,
    name: entry.name ?? "",
    description: entry.description ?? "",
    image_url: entry.image_url,
    category_id: "combos"
  }) as MenuItem;
  const imageItem = entry.section === "addons" ? { ...item, image_url: item.image_url || addonImage(item) } : item;
  const { imageSrc, tryNextImage } = useProductImage(imageItem);
  const image = product ? imageSrc : entry.image_url;
  const compact = entry.section !== "ramen";

  return (
    <article className={`festival-card festival-${entry.section}-card ${entry.status}`}>
      <div className="festival-card-image">
        {image ? <img src={image} alt={item.name} loading="lazy" decoding="async" onError={product ? tryNextImage : (event) => { event.currentTarget.hidden = true; }} /> : null}
      </div>
      <div className="festival-card-copy">
        <div className="festival-name-row">
          <h3>{item.name}</h3>
          {entry.is_new ? <span className="festival-new-badge">New</span> : null}
        </div>
        {!compact && item.description ? <p>{item.description}</p> : null}
        {!compact ? <div className="festival-product-meta"><FestivalSpice item={item} /><FoodMarker item={item} /></div> : null}
        <strong>{money(entry.price)}</strong>
        {entry.status === "out_of_stock" ? <span className="festival-sold-out">Sold Out</span> : null}
      </div>
    </article>
  );
}

function SectionHeading({ children }: { children: string }) {
  return <div className="festival-section-heading"><span aria-hidden="true" /><h2>{children}</h2><span aria-hidden="true" /></div>;
}

export function FestivalMenu() {
  const [entries, setEntries] = useState<FestivalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");
  const [activeSection, setActiveSection] = useState<FestivalSection>("ramen");
  const normalizedQuery = query.trim().toLowerCase();

  useEffect(() => {
    let active = true;
    async function refresh() {
      try {
        const data = await fetchFestival();
        if (active) { setEntries(data); setError(false); }
      } catch {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    }
    void refresh();
    const focus = () => void refresh();
    window.addEventListener("focus", focus);
    return () => { active = false; window.removeEventListener("focus", focus); };
  }, []);

  const visibleBySection = useMemo(() => {
    const grouped = {} as Record<FestivalSection, FestivalEntry[]>;
    for (const section of [...publicSections, { id: "combos" as FestivalSection, label: "Festival Combos" }]) {
      const sectionEntries = orderedFestival(entries, section.id);
      grouped[section.id] = section.id === "ramen" && normalizedQuery
        ? sectionEntries.filter((entry) => `${entry.product?.name ?? entry.name ?? ""} ${entry.product?.description ?? entry.description ?? ""}`.toLowerCase().includes(normalizedQuery))
        : sectionEntries;
    }
    return grouped;
  }, [entries, normalizedQuery]);

  return (
    <main className="festival-page">
      <div className="festival-shell">
        <header className="festival-header">
          <img className="festival-logo" src="/menu-right-logo-transparent.png" alt="Seoulful Ramen" />
          <p className="festival-slogan">Hot Ramen<br />Happier People</p>
        </header>
        <nav className="festival-nav" aria-label="Festival menu sections">
          {navigationSections.map((section) => <a className={activeSection === section.id ? "active" : ""} href={`#festival-${section.id}`} key={section.id} onClick={() => setActiveSection(section.id)}>{section.label}</a>)}
        </nav>
        <label className="festival-search">
          <Search size={17} aria-hidden="true" /><span className="sr-only">Search ramen</span>
          <input type="search" placeholder="Search ramen..." value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        {loading ? <p className="festival-state" role="status">Loading festival menu…</p> : null}
        {error ? <p className="festival-state" role="alert">The festival menu is temporarily unavailable. Please check at the stall.</p> : null}
        {!loading && !error ? publicSections.map((section) => {
          const rows = visibleBySection[section.id] ?? [];
          return (
            <section className={`festival-section festival-${section.id}-section`} id={`festival-${section.id}`} key={section.id}>
              <SectionHeading>{section.label}</SectionHeading>
              {section.id === "ramen" ? <p className="festival-subtitle">Same bowls. A bigger sky.</p> : null}
              {rows.length ? <div className={`festival-grid festival-${section.id}-grid`}>{rows.map((entry) => <FestivalItemCard key={entry.id} entry={entry} />)}</div>
                : <p className="festival-empty">{normalizedQuery && section.id === "ramen" ? "No ramen found." : "Selection coming soon."}</p>}
            </section>
          );
        }) : null}
        {!loading && !error && visibleBySection.combos?.length ? (
          <section className="festival-section festival-combos-section" id="festival-combos">
            <SectionHeading>Festival Combos</SectionHeading>
            <div className="festival-grid festival-combos-grid">{visibleBySection.combos.map((entry) => <FestivalItemCard key={entry.id} entry={entry} />)}</div>
          </section>
        ) : null}
        <footer className="festival-footer">
          <div className="festival-access-note"><span className="festival-clock" aria-hidden="true" /><p><strong>This menu is accessible for {FESTIVAL_ACCESS_MINUTES} minutes.</strong><br />Please rescan the QR code if it expires.</p></div>
          <p className="festival-enjoy">Enjoy the<br />Festival! <span aria-hidden="true">♥</span></p>
        </footer>
      </div>
    </main>
  );
}
