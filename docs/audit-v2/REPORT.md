# Sharabara demo v2 — yakuniy hisobot (2026-09-28)

## Nima o’zgardi

**Tushunarlilik (ustuvor)**
- Har admin, kompaniya, BTS va direktor ekranida: sarlavha ostida bir gaplik izoh va «?» paneli (bu ekran nima uchun · 3 qadam · klaviatura). Moderatsiyada pastda `J/K · A · E · R` eslatmasi.
- Jargon almashtirildi: Escrow → Himoyadagi pul, Manifest → Kechki yuk ro’yxati / «24-sen partiyasi», SLA → Javob muddati, Voronka → Ko’rgandan sotib olgangacha, SKU → Tovar kodi, «54 k» → «54 kun», «Kam ma’lumot» → «O’xshash e’lon kam». Statuslar va pul audit logda odam tilida.
- Bosh sahifa: «Birinchi marta? Demo sahnasidan boshlang» banneri, 1–6 tartib raqamlari, har karta «kim uchun · nima · qancha vaqt».
- Demo sahnasi: tezlik 0.5x/1x/2x, «Orqaga», qadam izohida qaysi ekran (chap telefon / o’ng kompyuter) belgisi, harakat bo’lmayotgan ekran xiralashadi (spotlight), rol ustiga hover — bir gaplik izoh, ekranlar tepasida «Sotuvchining telefoni» / «Narx tahlilchisining kompyuteri», yakun kartasi «Qaytadan» / «O’zim sinab ko’raman».
- Admin: menyu guruhlari yig’iladi, super admin uchun «Tez kirish» (5 bo’lim); Boshqaruv panelida birinchi blok «Bugun qilish kerak»; jadvallarda standart 5–6 ustun, birinchi ustun yopishqoq; har ekranda bitta oltin tugma.
- Mobil: birinchi ochilishda 3 slaydli tanishtiruv (o’tkazib yuborish mumkin), asosiy tugmalar 48 px, kategoriya plitkalari neytral doira.

**Xatolar** — 4-bo’limdagi 15 band hammasi tuzatildi (jadval `docs/audit-v2/README.md`).

**Ma’lumot (seed)**
- Har lug’at modeli uchun 30 kunlik o’xshash e’lonlar (363 ta tarixiy yozuv); narx navbati aralash (40/30/20/10%); kutish 5 daqiqa – 6 soat; hamma e’londa AI natijasi; demo soati oldinga surilganda har kun uchun savdo bor.

**Dizayn**
- Tokenlar: iliq oq fon `#F6F3EC`, kartalar `#FFFDF8`, siyoh `#1A2430`, yagona aksent oltin `#E3BE4A` (+ `#B8901E` chiziq/havola), g’isht `#A63A2A`, yashil `#2E6B4A`, ko’k faqat «Yo’lda» va info toast (`--info`). Eski ko’k aksent butunlay oltinga o’tkazildi (grafiklar: E’lonlar = siyoh, Mall = oltin).
- Bitter (700/800) — sahifa sarlavhalari, narx va KPI raqamlari; UI matni Inter. Status rang lug’ati bitta. Muhr/shtamp/daftar qatori saqlangan; bosh sahifa va «Narx bilan yutamiz» bannerida xira qog’oz teksturasi. Qorong’i rejim shu tokenlardan.
- Toast’lar 5 s, ko’pi bilan 3 ta, rol almashganda tozalanadi.

## Tekshiruv
- `tsc`, `oxlint`, `vite build` — toza; Vitest 121/121; Playwright 7/7 (Oltin yo’l boshidan oxirigacha, konsol xatosiz).
- Skrinshotlar: `docs/audit-v2/before` (51) va `docs/audit-v2/after` (64: + tanishtiruv, 360/430 px, qorong’i rejim, sahna qadamlari).
- Tushunarlilik jadvali va taqiqlangan so’zlar qidiruvi (0 topilma): `docs/audit-v2/README.md`, xom natija `_ux-check.json`, `after/_texts.json`.

## Qolgan cheklovlar
`docs/audit-v2/README.md` 4-bo’limda.
