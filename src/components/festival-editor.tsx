"use client";
import { useEffect, useState, type FormEvent } from "react";
import { fetchFestival, fetchFestivalProducts, saveFestival, festivalSections, type FestivalEntry, type FestivalSection } from "@/lib/festival-service";
import type { MenuItem, ItemStatus } from "@/lib/types";
import "./festival.css";
const blank = (combo=false): FestivalEntry => ({id:"",menu_item_id:null,section:combo?"combos":"ramen",price:0,status:"hidden",sort_order:10,is_new:false,name:"",description:"",image_url:""});
export function FestivalEditor(){
 const [open,setOpen]=useState(false);
 return <details className="festival-admin" onToggle={e=>setOpen(e.currentTarget.open)}><summary>Festival Menu management</summary>{open && <FestivalControls/>}</details>;
}
function FestivalControls(){
 const [entries,setEntries]=useState<FestivalEntry[]>([]),[products,setProducts]=useState<MenuItem[]>([]);
 const [draft,setDraft]=useState<FestivalEntry>(blank()),[busy,setBusy]=useState(false),[ready,setReady]=useState(false),[message,setMessage]=useState("");
 async function load(){const [rows,items]=await Promise.all([fetchFestival(),fetchFestivalProducts()]);setEntries(rows);setProducts(items);setReady(true);}
 useEffect(()=>{load().catch(e=>setMessage(e.message));},[]);
 async function submit(event:FormEvent){event.preventDefault();setBusy(true);setMessage("");try{await saveFestival(draft);await load();setDraft(blank(draft.section==="combos"));setMessage("Festival settings saved.");}catch(e){setMessage(e instanceof Error?e.message:"Could not save.");}finally{setBusy(false);}}
 const combo=draft.section==="combos";
 return <div><p>Choose existing products and set independent festival prices and availability. Hidden items are excluded. Lower display-order numbers appear first.</p><p><a href="/" target="_blank" rel="noreferrer">Open festival menu</a></p>
 {message && <p className="festival-admin-message" role="status">{message}</p>}{!ready && <button onClick={()=>load().catch(e=>setMessage(e.message))}>Retry loading</button>}
 <fieldset disabled={busy || !ready}><div className="festival-admin-list"><button type="button" onClick={()=>setDraft(blank())}>Add existing product</button><button type="button" onClick={()=>setDraft(blank(true))}>Add combo</button></div>
 <form onSubmit={submit} className="festival-editor"><h3>{draft.id?"Edit":"Add"} festival {combo?"combo":"product"}</h3>
 {combo ? <><label>Name<input required maxLength={120} value={draft.name??""} onChange={e=>setDraft({...draft,name:e.target.value})}/></label><label>Short description<textarea maxLength={240} value={draft.description??""} onChange={e=>setDraft({...draft,description:e.target.value})}/></label><label>Image path or URL (optional)<input value={draft.image_url??""} onChange={e=>setDraft({...draft,image_url:e.target.value})}/></label></> : <><label>Existing product<select required value={draft.menu_item_id??""} onChange={e=>setDraft({...draft,menu_item_id:e.target.value})}><option value="">Choose a product</option>{products.map(p=><option key={p.id} value={p.id}>{p.name} ({p.category_id})</option>)}</select></label><label>Festival section<select value={draft.section} onChange={e=>setDraft({...draft,section:e.target.value as FestivalSection})}>{Object.entries(festivalSections).filter(([key])=>key!=="combos").map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label></>}
 <label>Festival Price (₹)<input required type="number" min="0" step="0.01" value={draft.price} onChange={e=>setDraft({...draft,price:e.target.valueAsNumber})}/></label>
 <label>Festival status<select value={draft.status} onChange={e=>setDraft({...draft,status:e.target.value as ItemStatus})}><option value="available">Available</option><option value="out_of_stock">Sold Out</option><option value="hidden">Hidden / excluded</option></select></label>
 <label className="festival-checkbox"><input type="checkbox" checked={Boolean(draft.is_new)} onChange={e=>setDraft({...draft,is_new:e.target.checked})}/>New Item</label>
 <label>Display order<input required type="number" step="1" value={draft.sort_order} onChange={e=>setDraft({...draft,sort_order:e.target.valueAsNumber})}/></label><button type="submit">{busy?"Saving…":"Save festival settings"}</button></form>
 <h3>Festival selections</h3><div className="festival-admin-list">{entries.slice().sort((a,b)=>a.sort_order-b.sort_order).map(e=><button type="button" key={e.id} onClick={()=>{setDraft(e);setMessage("");}}>{e.product?.name??e.name} · ₹{e.price} · {e.status==="out_of_stock"?"Sold Out":e.status} · Order {e.sort_order}</button>)}</div></fieldset></div>;
}
