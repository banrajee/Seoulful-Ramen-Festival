# Festival separation checklist

Audit source: latest festival working tree in `Seoulful-Ramen-Menu`, preserved at commit `ae73bd7` and tag `festival-separation-safety-2026-09-25` in the local safety clone.

## Festival files found and destinations

| Source in shop project | Destination in this project | Treatment |
| --- | --- | --- |
| `src/app/festival/page.tsx` | `src/app/festival/page.tsx` and `src/app/page.tsx` | Preserved as a compatibility route; the same finished menu is also the new root route. |
| `src/components/festival-menu.tsx` | `src/components/festival-menu.tsx` | Copied from the latest working version; only the shared-helper import was redirected to the independent helper. |
| `src/components/festival.css` | `src/components/festival.css` | Copied exactly, including all current mobile, tablet, and desktop rules. |
| `src/components/festival-editor.tsx` | `src/components/festival-editor.tsx` | Copied; its public-menu link now targets the independent root route. |
| `src/lib/festival-service.ts` | `src/lib/festival-service.ts` | Copied. Reads `menu_items`, `festival_items`, and `festival_combos`; writes only festival tables. |
| `src/app/owner/page.tsx` + owner authentication flow | `src/app/admin/page.tsx` + `src/components/festival-admin.tsx` | Adapted into a dedicated festival admin while retaining the existing Supabase Auth account/session model. |
| `src/lib/supabase.ts` | `src/lib/supabase.ts` | Copied because the festival app needs its own browser client configuration. |
| Festival subset of `src/lib/types.ts` | `src/lib/types.ts` | Reduced to the fields and types the festival app actually uses. |
| `supabase/add-festival-menu.sql` | `supabase/add-festival-menu.sql` | Copied as applied migration history. |
| `supabase/add-festival-new-badge.sql` | `supabase/add-festival-new-badge.sql` | Copied as applied migration history. |
| `scripts/festival-service.test.cjs` | `scripts/festival-service.test.cjs` | Copied to preserve write-boundary, badge, ordering, and validation coverage. |
| `FESTIVAL-MENU.md` | This checklist and `README.md` | Replaced by complete independent-project documentation. |
| `public/festival/festival-background.webp` | Same path | Copied. |
| `public/menu-right-logo-transparent.png` | Same path | Copied. |
| `public/spice-chilli.png` | Same path | Copied. |
| `public/addon-*.png` | Same paths | Copied. |
| `public/menu-products/*` | Same paths | Copied so all products selectable by the festival admin have local image fallbacks. |

## Festival changes found inside shared shop files

| Shared shop file/change | Independent replacement |
| --- | --- |
| `src/components/live-menu.tsx`: exported `spiceLevel`, `SpiceRow`, `addonImage`, and `useProductImage` for festival imports | The required spice, add-on image, alias, and fallback-image logic lives in `src/lib/festival-product-helpers.ts`. `SpiceRow` was not copied because the festival renders its own four-chilli row. |
| `src/components/owner-dashboard.tsx`: imported and rendered `FestivalEditor` | Festival controls now live behind the independent `/admin` authentication wrapper. The permanent shop dashboard is not copied. |
| Global box sizing, body reset, and form font defaults | Minimal equivalents live in `src/app/globals.css`; no shop presentation rules were copied. |
| Shared application layout metadata and root structure | A festival-only `src/app/layout.tsx` provides the required Next.js shell. |

## Intentionally excluded shop code

- Normal customer menu, cart/order UI, `/scan`, shop QR behavior, shop owner dashboard, drinks/snacks shop views, and normal shop services were excluded because the festival is view-only and independently managed.
- Shop write services were excluded. Festival saves cannot call any normal price, stock, availability, or menu-record mutation.
- Shop-only CSS and components were excluded. The independent helper copies only logic that the finished festival view imports.
- Build artifacts, `.env.local`, Vercel metadata, credentials, passwords, and private keys were excluded.
- A Supabase service-role key is neither required nor accepted by this browser application.

## Database and deployment isolation checks

- Public reads: `festival_items` joined to `menu_items`, plus `festival_combos`.
- Admin product picker read: `menu_items`.
- Admin inserts/updates: `festival_items` or `festival_combos` only.
- Festival-specific fields preserved: `price`, `status`, `sort_order`, and `is_new`; combo `name`, `description`, and `image_url` are also preserved.
- Core `menu_items` supplies shared name, image, description, food type, and spice data. The festival does not mutate it.
- This repository contains all bundled images used as fallbacks and has no filesystem or source dependency on the shop repository.
- The shop implementation remains present and unchanged pending explicit cleanup approval.

## Verification record

Verified against the production deployment on 25 September 2026:

- [x] Unit test and type check pass.
- [x] Local and Vercel production builds pass.
- [x] The shared Supabase connection loads successfully; the anonymous role can read 103 core products. All festival rows are currently hidden, so the public festival queries correctly return no products or combos.
- [x] The editor and service read and write `is_new` for products and combos; automated coverage verifies both `true` and `false`, and the public card conditionally renders the badge from the same field.
- [x] Search and category navigation work; the clicked navigation tab becomes active and links to the expected section.
- [x] Direct reload succeeds on `/`, `/festival`, and `/admin`.
- [x] No horizontal overflow at 360, 375, 390, 412, or 430 px.
- [x] Additional 768 and 1280 px checks confirm the current responsive tablet and desktop layouts.
- [x] The background, logo, section dividers, empty states, notice, and footer load and retain the current festival styling at 390 px.
- [x] Every one of the 95 independently deployed public assets returns HTTP 200.
- [x] Code-level and automated write-boundary checks prove festival saves target only `festival_items` or `festival_combos`; there is no `menu_items` update/insert/delete path.
- [ ] A reversible authenticated festival test write is pending an owner sign-in. No credentials were available in the existing browser session, so no live data was changed or claimed as tested.
- [x] The separate Vercel project deploys independently at `https://seoulful-ramen-festival.vercel.app` and is connected to this repository's `main` production branch.
- [x] The complete 122-file project tree is published independently at `https://github.com/banrajee/Seoulful-Ramen-Festival`; an API tree comparison found no missing or extra files.
