"use client";

import { ExternalLink, Pencil, Plus, RotateCcw, Save, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  deleteFestival,
  fetchFestival,
  fetchFestivalProducts,
  festivalSections,
  saveFestival,
  type FestivalEntry,
  type FestivalSection
} from "@/lib/festival-service";
import type { ItemStatus, MenuItem } from "@/lib/types";

type SelectionFilter = "all" | FestivalSection;

const addSections: Array<{ id: FestivalSection; label: string }> = [
  { id: "ramen", label: "Add ramen" },
  { id: "addons", label: "Add add-on" },
  { id: "drinks", label: "Add drink" },
  { id: "snacks", label: "Add K-snack" },
  { id: "combos", label: "Add combo" }
];

function blank(section: FestivalSection = "ramen"): FestivalEntry {
  return {
    id: "",
    menu_item_id: null,
    section,
    price: 0,
    status: "hidden",
    sort_order: 10,
    is_new: false,
    name: "",
    description: "",
    image_url: ""
  };
}

function entryName(entry: FestivalEntry) {
  return entry.product?.name ?? entry.name ?? "Untitled selection";
}

function statusLabel(status: ItemStatus) {
  if (status === "out_of_stock") return "Sold out";
  if (status === "hidden") return "Hidden";
  return "Available";
}

export function FestivalEditor() {
  const [entries, setEntries] = useState<FestivalEntry[]>([]);
  const [products, setProducts] = useState<MenuItem[]>([]);
  const [draft, setDraft] = useState<FestivalEntry>(blank());
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [sectionFilter, setSectionFilter] = useState<SelectionFilter>("all");

  async function load() {
    const [rows, items] = await Promise.all([fetchFestival(), fetchFestivalProducts()]);
    setEntries(rows);
    setProducts(items);
    setReady(true);
  }

  useEffect(() => {
    void load().catch((error: unknown) => setMessage(error instanceof Error ? error.message : "Could not load festival settings."));
  }, []);

  const filteredEntries = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return entries
      .filter((entry) => sectionFilter === "all" || entry.section === sectionFilter)
      .filter((entry) => !normalized || entryName(entry).toLowerCase().includes(normalized))
      .sort((a, b) => a.sort_order - b.sort_order || entryName(a).localeCompare(entryName(b)));
  }, [entries, query, sectionFilter]);

  function startNew(section: FestivalSection) {
    setDraft(blank(section));
    setMessage("");
  }

  function startEdit(entry: FestivalEntry) {
    setDraft({ ...entry });
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      await saveFestival(draft);
      await load();
      setDraft(blank(draft.section));
      setMessage("Festival selection saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save the festival selection.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(entry: FestivalEntry) {
    const confirmed = window.confirm(`Remove “${entryName(entry)}” from the festival menu? This will not delete the original shop product.`);
    if (!confirmed) return;
    setBusy(true);
    setMessage("");
    try {
      await deleteFestival(entry);
      await load();
      if (draft.id === entry.id) setDraft(blank(entry.section));
      setMessage(`${entryName(entry)} was removed from the festival menu. The original shop product was not changed.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not remove the festival selection.");
    } finally {
      setBusy(false);
    }
  }

  const combo = draft.section === "combos";

  return (
    <div className="festival-dashboard">
      <section className="festival-dashboard-intro">
        <div>
          <p className="festival-dashboard-eyebrow">Festival menu controls</p>
          <h2>Manage what customers see</h2>
          <p>Each selection is a product shown on the festival site with its own festival price, status, order and NEW badge.</p>
          <p>Removing a selection removes it only from the festival menu. It does not delete or change the original shop product.</p>
        </div>
        <a className="festival-dashboard-preview" href="/festival" target="_blank" rel="noreferrer">
          Open customer menu <ExternalLink aria-hidden="true" size={16} />
        </a>
      </section>

      {message ? <p className="festival-admin-message" role="status">{message}</p> : null}
      {!ready ? <button className="festival-secondary-button" onClick={() => void load().catch((error: unknown) => setMessage(error instanceof Error ? error.message : "Could not load."))}>Retry loading</button> : null}

      <fieldset className="festival-dashboard-fieldset" disabled={busy || !ready}>
        <div className="festival-add-toolbar" aria-label="Add festival selection">
          {addSections.map((section) => (
            <button className={draft.section === section.id && !draft.id ? "active" : ""} key={section.id} onClick={() => startNew(section.id)} type="button">
              <Plus aria-hidden="true" size={16} /> {section.label}
            </button>
          ))}
        </div>

        <div className="festival-dashboard-grid">
          <form className="festival-editor-form" onSubmit={submit}>
            <div className="festival-form-title">
              <div>
                <p>{draft.id ? "Editing selection" : "New selection"}</p>
                <h3>{draft.id ? entryName(draft) : festivalSections[draft.section]}</h3>
              </div>
              <button aria-label="Clear form" className="festival-icon-button" onClick={() => startNew(draft.section)} title="Clear form" type="button"><RotateCcw size={18} /></button>
            </div>

            {combo ? (
              <>
                <label>Name<input required maxLength={120} value={draft.name ?? ""} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label>
                <label>Short description<textarea maxLength={240} rows={3} value={draft.description ?? ""} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></label>
                <label>Image path or URL <span>(optional)</span><input value={draft.image_url ?? ""} onChange={(event) => setDraft({ ...draft, image_url: event.target.value })} /></label>
              </>
            ) : (
              <>
                <label>Shop product<select required value={draft.menu_item_id ?? ""} onChange={(event) => setDraft({ ...draft, menu_item_id: event.target.value })}><option value="">Choose a product</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name} ({product.category_id})</option>)}</select></label>
                <label>Festival section<select value={draft.section} onChange={(event) => setDraft({ ...draft, section: event.target.value as FestivalSection })}>{Object.entries(festivalSections).filter(([key]) => key !== "combos").map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
              </>
            )}

            <div className="festival-form-row">
              <label>Festival price (₹)<input required type="number" min="0" step="0.01" value={draft.price} onChange={(event) => setDraft({ ...draft, price: event.target.valueAsNumber })} /></label>
              <label>Display order<input required type="number" step="1" value={draft.sort_order} onChange={(event) => setDraft({ ...draft, sort_order: event.target.valueAsNumber })} /></label>
            </div>
            <label>Status<select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as ItemStatus })}><option value="available">Available</option><option value="out_of_stock">Sold out</option><option value="hidden">Hidden from customers</option></select></label>
            <label className="festival-checkbox"><input type="checkbox" checked={Boolean(draft.is_new)} onChange={(event) => setDraft({ ...draft, is_new: event.target.checked })} /><span><strong>Show NEW badge</strong><small>Turn this off to remove the badge again.</small></span></label>
            <button className="festival-save-button" type="submit"><Save aria-hidden="true" size={17} />{busy ? "Saving…" : draft.id ? "Save changes" : "Add to festival"}</button>
          </form>

          <section className="festival-selections-panel">
            <div className="festival-selections-heading"><div><p>Current menu</p><h3>Festival selections</h3></div><span>{entries.length} total</span></div>
            <p className="festival-selections-help">These are the live festival entries. Use Edit to change one or Remove to take a test item such as Big Sheet off the festival menu.</p>
            <label className="festival-admin-search"><Search aria-hidden="true" size={17} /><span className="sr-only">Search festival selections</span><input placeholder="Search selections…" type="search" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
            <div className="festival-filter-row">
              <button className={sectionFilter === "all" ? "active" : ""} onClick={() => setSectionFilter("all")} type="button">All</button>
              {Object.entries(festivalSections).map(([key, label]) => <button className={sectionFilter === key ? "active" : ""} key={key} onClick={() => setSectionFilter(key as FestivalSection)} type="button">{label}</button>)}
            </div>
            <div className="festival-selection-list">
              {filteredEntries.map((entry) => (
                <article className={draft.id === entry.id ? "selected" : ""} key={entry.id}>
                  <div className="festival-selection-copy">
                    <div className="festival-selection-title"><h4>{entryName(entry)}</h4>{entry.is_new ? <span className="festival-admin-new">NEW</span> : null}</div>
                    <p><span>{festivalSections[entry.section]}</span><span>₹{entry.price}</span><span>{statusLabel(entry.status)}</span><span>Order {entry.sort_order}</span></p>
                  </div>
                  <div className="festival-selection-actions">
                    <button onClick={() => startEdit(entry)} type="button"><Pencil aria-hidden="true" size={15} /> Edit</button>
                    <button className="danger" onClick={() => void remove(entry)} type="button"><Trash2 aria-hidden="true" size={15} /> Remove</button>
                  </div>
                </article>
              ))}
              {!filteredEntries.length ? <p className="festival-admin-empty">No selections match this filter.</p> : null}
            </div>
          </section>
        </div>
      </fieldset>
    </div>
  );
}
