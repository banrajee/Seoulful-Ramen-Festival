"use client";
import { createBrowserSupabaseClient } from "./supabase";
import type { MenuItem, ItemStatus } from "./types";
export const festivalSections = { ramen: "Festival Ramen", addons: "Add-Ons", snacks: "K-Snacks / Sides", drinks: "Drinks", combos: "Festival Combos" } as const;
export const FESTIVAL_ACCESS_MINUTES = 15;
export type FestivalSection = keyof typeof festivalSections;
export type FestivalEntry = {
 id: string; menu_item_id: string | null; section: FestivalSection; price: number;
 status: ItemStatus; sort_order: number; is_new?: boolean; name?: string; description?: string; image_url?: string | null;
 product?: MenuItem;
};
export function festivalClient() {
 const client = createBrowserSupabaseClient();
 if (!client) throw new Error("Festival menu needs a Supabase connection.");
 return client;
}
export function orderedFestival(entries: FestivalEntry[], section: FestivalSection) {
 return entries.filter(e => e.section === section && e.status !== "hidden")
 .sort((a,b) => a.sort_order-b.sort_order || a.id.localeCompare(b.id));
}
export async function fetchFestival(): Promise<FestivalEntry[]> {
 const client = festivalClient();
 const [items, combos] = await Promise.all([
 client.from("festival_items").select("*, product:menu_items(*)").order("sort_order"),
 client.from("festival_combos").select("*").order("sort_order")]);
 if (items.error || combos.error) throw new Error("Festival menu could not load. Check the connection and festival database setup.");
 return [...(items.data ?? []), ...(combos.data ?? []).map(c => ({...c, section: "combos", menu_item_id: null}))] as FestivalEntry[];
}
export async function fetchFestivalProducts(): Promise<MenuItem[]> {
 const {data,error} = await festivalClient().from("menu_items").select("*").order("name");
 if(error) throw new Error(error.message);
 return data as MenuItem[];
}
export async function saveFestival(entry: FestivalEntry) {
 if(!Number.isFinite(entry.price) || entry.price < 0 || !Number.isSafeInteger(entry.sort_order)) throw new Error("Enter a valid price and whole-number display order.");
 const combo = entry.section === "combos";
 if(combo && !entry.name?.trim()) throw new Error("Enter a combo name.");
 if(!combo && !entry.menu_item_id) throw new Error("Choose an existing product.");
 const common = {price: entry.price, status: entry.status, sort_order: entry.sort_order, is_new: Boolean(entry.is_new)};
 const payload: Record<string, string | number | boolean | null> = combo ? {...common, name: entry.name!.trim(), description: entry.description?.trim() ?? "", image_url: entry.image_url?.trim() || null}
 : {...common, menu_item_id: entry.menu_item_id, section: entry.section};
 const table = festivalClient().from(combo ? "festival_combos" : "festival_items");
 const result = entry.id ? await table.update(payload).eq("id",entry.id).select("id").single() : await table.insert(payload).select("id").single();
 if(result.error) throw new Error(result.error.message);
}

export async function deleteFestival(entry: FestivalEntry) {
 if (!entry.id) throw new Error("This festival selection has not been saved yet.");
 const tableName = entry.section === "combos" ? "festival_combos" : "festival_items";
 const result = await festivalClient().from(tableName).delete().eq("id", entry.id);
 if (result.error) throw new Error(result.error.message);
}

