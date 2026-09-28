# Sharabara demo v2 — tushunarlilik va dizayn auditi (2026-09-28)

Skrinshotlar: `before/` — o’zgarishdan oldin, `after/` — keyin. Desktop 1440×900, mobil 390×844 (qo’shimcha 360 va 430 px, qorong’i rejim).
Tekshiruv brauzer vkladkasi faol holatda, Playwright (Chromium) bilan olingan.

## 1. Tushunarlilik testi (har ekran)

Mezon: sarlavha bormi · bir gaplik izoh va «?» paneli bormi · asosiy oltin tugma bittami · jargon/xom raqam qoldimi.
Mobil ekranlarda «?» paneli yo’q — o’rniga birinchi ochilishda 3 slaydli tanishtiruv va har ekranda «Orqaga» + sarlavha.
Oltin tugmalar soni skriptda ko’rinadigan tugmalar bo’yicha sanalgan (`_ux-check.json`).

| Ekran | Sarlavha | Izoh + «?» | Oltin tugma | Jargon |
|---|---|---|---|---|
| Bosh sahifa (landing) | ✓ | ✓ | ✓ (0) | ✓ yo’q |
| Demo sahnasi | ✓ | ✓ | ✓ 1 + telefon ichida 1 | ✓ yo’q |
| Admin · dashboard | ✓ | ✓ | ✓ (0) | ✓ yo’q |
| Admin · director | ✓ | ✓ | ✓ (0) | ✓ yo’q |
| Admin · moderation | ✓ | ✓ | ✓ (1) | ✓ yo’q |
| Admin · pricing | ✓ | ✓ | ✓ (1) | ✓ yo’q |
| Admin · categories | ✓ | ✓ | ✓ (1) | ✓ yo’q |
| Admin · orders | ✓ | ✓ | ✓ (0) | ✓ yo’q |
| Admin · logistics | ✓ | ✓ | ✓ (1) | ✓ yo’q |
| Admin · warehouse | ✓ | ✓ | ✓ (1) | ✓ yo’q |
| Admin · payments | ✓ | ✓ | ✓ (1) | ✓ yo’q |
| Admin · fees | ✓ | ✓ | ✓ (1) | ✓ yo’q |
| Admin · returns | ✓ | ✓ | ✓ (0) | ✓ yo’q |
| Admin · companies | ✓ | ✓ | ✓ (1) | ✓ yo’q |
| Admin · products | ✓ | ✓ | ✓ (0) | ✓ yo’q |
| Admin · users | ✓ | ✓ | ✓ (0) | ✓ yo’q |
| Admin · campaigns | ✓ | ✓ | ✓ (1) | ✓ yo’q |
| Admin · reports | ✓ | ✓ | ✓ (0) | ✓ yo’q |
| Admin · roles | ✓ | ✓ | ✓ (0) | ✓ yo’q |
| Admin · audit | ✓ | ✓ | ✓ (0) | ✓ yo’q |
| Direktor · umumiy | ✓ | ✓ | ✓ (0) | ✓ yo’q |
| Direktor · savdo | ✓ | ✓ | ✓ (0) | ✓ yo’q |
| Direktor · pul | ✓ | ✓ | ✓ (0) | ✓ yo’q |
| Direktor · ombor | ✓ | ✓ | ✓ (0) | ✓ yo’q |
| Direktor · muammolar | ✓ | ✓ | ✓ (0) | ✓ yo’q |
| Kompaniya · overview | ✓ | ✓ | ✓ (0) | ✓ yo’q |
| Kompaniya · products | ✓ | ✓ | ✓ (0) | ✓ yo’q |
| Kompaniya · import | ✓ | ✓ | ✓ (1) | ✓ yo’q |
| Kompaniya · orders | ✓ | ✓ | ✓ (0) | ✓ yo’q |
| Kompaniya · promos | ✓ | ✓ | ✓ (1) | ✓ yo’q |
| Kompaniya · billing | ✓ | ✓ | ✓ (1) | ✓ yo’q |
| Kompaniya · reports | ✓ | ✓ | ✓ (0) | ✓ yo’q |
| Kompaniya · api | ✓ | ✓ | ✓ (1) | ✓ yo’q |
| Kompaniya · contract | ✓ | ✓ | ✓ (0) | ✓ yo’q |
| BTS · today | ✓ | ✓ | ✓ (1) | ✓ yo’q |
| BTS · shipments | ✓ | ✓ | ✓ (0) | ✓ yo’q |
| BTS · branches | ✓ | ✓ | ✓ (0) | ✓ yo’q |
| BTS · history | ✓ | ✓ | ✓ (0) | ✓ yo’q |
| Mobil · home | ✓ | ✓ | ✓ (1) | ✓ yo’q |
| Mobil · catalog | ✓ | ✓ | ✓ (0) | ✓ yo’q |
| Mobil · listing | ✓ | ✓ | ✓ (1) | ✓ yo’q |
| Mobil · cart | ✓ | ✓ | ✓ (0) | ✓ yo’q |
| Mobil · checkout | ✓ | ✓ | ✓ (0) | ✓ yo’q |
| Mobil · orders | ✓ | ✓ | ✓ (0) | ✓ yo’q |
| Mobil · sell | ✓ | ✓ | ✓ (1) | ✓ yo’q |
| Mobil · wallet | ✓ | ✓ | ✓ (1) | ✓ yo’q |
| Mobil · profile | ✓ | ✓ | ✓ (0) | ✓ yo’q |
| Mobil · notifications | ✓ | ✓ | ✓ (0) | ✓ yo’q |
| Mobil · mall | ✓ | ✓ | ✓ (0) | ✓ yo’q |
| Mobil · search | ✓ | ✓ | ✓ (0) | ✓ yo’q |

Qidiruv skripti (`Tiyin|undefined|NaN|null|escrow|manifest|SKU|\d{8,}`) barcha ekranlarning ko’rinadigan matnida **0 ta** topilma berdi.
Yagona istisno — Kompaniya · API kalitlari sahifasidagi JSON namunasi (`"sku"` maydoni): bu integratorlar uchun kod namunasi, ataylab qoldirildi.

## 2. Auditda topilgan 15 band

| № | Band | Holat | Qanday tuzatildi |
|---|---|---|---|
| 1 | Narx tahlili: hamma e’lon «Kam ma’lumot», ishonch 20% | ✓ | Har (model, xotira) uchun 30 kunlik 5–8 ta o’xshash e’lon seed’da (`makeCategoryHistory`); qoida: so’ralgan narx tavsiyadan 3% dan ortiq → «Qimmat» (`FAIR_BAND = 0.03`). Oltin iPhone 6 600 000 → 6 200 000 (−6,1%) «Qimmat». Navbat: 14 mos / 10 qimmat / 7 o’xshash kam / 3 IMEI, ishonch 66–82%. Test: `pricing/index.test.ts`, `seed.test.ts` |
| 2 | Navbat soni mos emas (sidebar 14, sahifa 27) | ✓ | Bitta manba `isPricingQueue()` — sidebar va sahifa 34/34 (skrinshot `after/d-admin-pricing.png`) |
| 3 | Direktor paneli «0 so’m, −100%», kanal foizlari 0 da | ✓ | `ensureDailyStat` — «+1 kun» / «Juma» da yangi kun uchun fon statistikasi; summa 0 bo’lsa foizlar «—» |
| 4 | Audit log xom tiyin va maydon nomlari | ✓ | `admin/lib/audit.ts`: `priceTiyin → Narx`, `623500000 → 6 235 000 so’m`, statuslar o’zbekcha (`after/d-admin-audit.png`) |
| 5 | Mall narx tekshiruvi: admin «Kutilmoqda», kompaniya «20 ta qimmat» | ✓ | `mallCheck()` — 3% qoida, seed’da «pending» yo’q; admin va kabinet bitta natija |
| 6 | Grafik tooltip «54874210 so’m» | ✓ | Barcha tooltip’lar `formatMoney(v, { compact: true })` → «54,9 mln so’m» |
| 7 | Mobil bosh sahifa: «Siz uchun» joyi, sabab matni, Mall banneri | ✓ | «Siz uchun tanlandi» qidiruvdan keyin birinchi; sabab 2 qator; Sharabara Mall banneri qo’shildi (`after/m-home.png`) |
| 8 | Telefon status bar soati demo soatiga bog’lanmagan | ✓ | Sahnada va desktop ramkasida soat `clock.now` dan (`after/d-stage-golden-step3.png`) |
| 9 | «bozordan 5% arzon» noto’g’ri hisob | ✓ | Bozor medianiga nisbatan: (6 900 000 − 6 200 000) / 6 900 000 = 10% |
| 10 | Narx tahlili «Sotuvchi tavsifi» qutisi tor | ✓ | To’liq kenglik, matn kesilmaydi (`after/d-admin-pricing.png`) |
| 11 | Kesilgan ustun va matnlar | ✓ | Logistika «Amallar» 230 px + qisqa tugma, «So’nggi partiyalar» yangi tartib, Foydalanuvchilar «Holat» 140, To’lovlar sana 150, Buyurtmalar «Manba» w-48, Ombor «Kategoriya» w-60; jadvallarda 5–6 asosiy ustun (`defaultHidden`) |
| 12 | Sana formati aralash | ✓ | Yagona format «25-sen, 11:00» (`formatDemoTime`), To’lovlarda `scheduledFor` ham shu formatda |
| 13 | Sana tanlagich «dd/mm/yyyy» | ✓ | `DateInput` — «kk.oo.yyyy», nuqtalar o’zi qo’yiladi (Buyurtmalar, Hisobotlar, Ombor harakatlari) |
| 14 | Buyurtmalar: «Holat: To’landi» va yuk «Topshirildi» chalkash | ✓ | Ustunlar «To’lov» va «Yetkazish» (`after/d-admin-orders.png`) |
| 15 | Qaytarishlar: muddati o’tganlar ajralmagan | ✓ | G’isht rangda va tepada (`after/d-admin-returns.png`) |

## 3. Skrinshotlar

Oldin/keyin juftliklari (51 ta): d-admin-audit, d-admin-campaigns, d-admin-categories, d-admin-companies, d-admin-dashboard, d-admin-director, d-admin-fees, d-admin-logistics, d-admin-moderation, d-admin-orders, d-admin-payments, d-admin-pricing, d-admin-products, d-admin-reports, d-admin-returns, d-admin-roles, d-admin-users, d-admin-warehouse, d-bts-branches, d-bts-history, d-bts-shipments, d-bts-today, d-direktor-muammolar, d-direktor-ombor, d-direktor-pul, d-direktor-savdo, d-direktor-umumiy, d-landing, d-partner-api, d-partner-billing, d-partner-contract, d-partner-import, d-partner-orders, d-partner-overview, d-partner-products, d-partner-promos, d-partner-reports, d-stage, m-cart, m-catalog, m-checkout, m-home, m-listing, m-mall, m-mylistings, m-notifications, m-orders, m-profile, m-search, m-sell, m-wallet.

Faqat «keyin» (12 ta): d-stage-golden-step2, d-stage-golden-step3, dark-admin-dashboard, dark-admin-pricing, dark-direktor, m-onboarding, m360-checkout, m360-home, m360-listing, m430-checkout, m430-home, m430-listing.

## 4. Qolgan ma’lum cheklovlar

- Mobil ekranlarda «?» paneli yo’q (mobil uchun tanishtiruv slaydlari va sarlavha/izoh ishlatildi).
- Demo sahnasida ikkita oltin tugma ko’rinadi: sahna boshqaruvidagi «Oltin yo’l» va telefon ichidagi ilova tugmasi — bu ikki alohida ekran.
- Kompaniya · API sahifasidagi JSON namunasida `"sku"` kaliti kod sifatida qoldi.
- Sahna tezlik tanlagichi (0.5x/1x/2x) 1500 px dan tor ekranda yashiringan; «Orqaga» esa har doim bor.
- «Orqaga» qadam holatni qaytarmaydi (savdo o’tgan bo’lsa o’tgan), faqat ekranlarni qayta ko’rsatadi.
- Matn o’lchami: mobil asosiy matn 15 px, yordamchi yozuvlar 12–13 px joylarda qoldi.
