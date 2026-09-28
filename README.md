# Sharabara — to'liq ishlaydigan demo

**Jonli demo:** https://muminjanovhasan96-dot.github.io/sharabara/ · sahna: https://muminjanovhasan96-dot.github.io/sharabara/stage
**Kod:** https://github.com/muminjanovhasan96-dot/sharabara (har `main` push GitHub Pages'ga avtomatik chiqadi)

Investor va hamkorlarga ko'rsatiladigan, **har bir tugmasi ishlaydigan** veb-prototip.
Bitta ilova ichida 5 interfeys: mijoz ilovasi (xaridor + sotuvchi), admin panel (16 bo'lim, 8 rol),
kompaniya kabineti (Mall), BTS hamkor paneli va demo sahnasi (`/stage`).

> Bu production emas. Backend yo'q, ma'lumot brauzerda (`localStorage`) saqlanadi va ochiq tablar orasida
> `BroadcastChannel` orqali jonli sinxronlanadi. Biznes mantiqi `src/domain` da — keyin React Native'da qayta ishlatiladi.

## Ishga tushirish

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # tsc + vite build
npm run preview      # dist ni ko'rish (e2e shu serverga ulanadi)
npm test             # vitest (domain + design)
npm run test:cov     # qamrov (src/domain ≥ 90%)
npm run e2e          # Playwright — Oltin yo'l boshidan oxirigacha
npm run typecheck    # tsc --noEmit
npm run lint         # oxlint
```

## Marshrutlar

| Yo'l | Nima |
|---|---|
| `/` | Interfeys tanlash |
| `/stage` | **Demo sahnasi**: chapda mijoz telefoni, o'ngda xodim kompyuteri (brauzer oynasi), pastda izoh paneli. Yuqorida: rollar, vaqt menyusi, sozlamalar, Oltin yo'l |
| `/m` | Mijoz ilovasi (desktopda iPhone ramkasida, telefonda to'liq ekran / PWA) |
| `/admin` | Admin panel |
| `/partner` | Kompaniya kabineti |
| `/bts` | BTS paneli |

## Demo ssenariysi — «Oltin yo'l» (≈3 daqiqa)

`/stage` → **Oltin yo'l**. Har qadam avtomatik bajariladi; qadam nomi, izohi, pauza va «Keyingi» pastki izoh panelida
(ekranlarni yopmaydi). Kompyuter oynasi ichida ilova kamida 1160 px kenglikda chiziladi va oynaga sig'ishi uchun
kichraytiriladi (`src/apps/stage/DesktopWindow.tsx`) — admin paneli tor ekranda ham to'liq menyu bilan ko'rinadi.
Har ilova o'z toast kanalida yozadi (`createToast('admin' | 'partner' | 'bts')`), shuning uchun admin xabari telefonda chiqmaydi;
soat o'zgarishini faqat sahna ko'rsatadi.

1. Xaridor bosh sahifada «Siz uchun» blokida iPhone'larni ko'radi (kecha ko'rgan).
2. Sotuvchi «Sotish»: iPhone 13 Pro, 4 rasm, IMEI, narx **6 600 000**. AI tahlili → «Tekshiruvga yuborildi».
3. Admin → Narx tahlili: taqqoslash jadvali, AI tavsiyasi **6 200 000** (ishonch 88%): o'xshashlar o'rtachasi 6 900 000 → holat tuzatmasi (B) −345 000 → Sharabara qoidasi aynan −5% = −327 750 → yaxlitlash −27 250. «Sotuvchiga taklif yuborish».
4. Sotuvchi telefonida push. Xizmat haqi **186 000**, qo'lga **6 014 000**. «Roziman, joylash» → e'lon «Narx tekshirilgan».
5. Xaridor telefonida push (tavsiya triggeri). E'lonni ochadi, «Nega adolatli» sheet'i.
6. Savat → rasmiylashtirish: xaritadan BTS Namangan Markaz, Payme, jami **6 235 000**. Muhr animatsiyasi.
7. Admin → Logistika: «Qadoqlandi», yuk xati (A6). Demo paneli: «17:00», «BTS mashinasi keldi».
8. BTS paneli: «Partiyani qabul qildim» → xaridorda «BTS olib ketdi».
9. «+1 kun» → «Filialda». BTS «Topshirildi» → xaridorda baholash so'rovi.
10. Moliya: «Juma to'lovi» → sotuvchi hamyonida **6 014 000** «To'landi».
11. Yakun: audit logda shu savdoning butun izi.

## Har rol uchun «nimani bosib ko'rish kerak»

- **Xaridor**: bosh sahifadagi tavsiya izohlari («Siz iPhone 13 ko'rgansiz»), «Narx tekshirilgan» belgisi, filtr sheet'i, savatda sotuvchi bo'yicha guruhlash, xaritadan filial, buyurtma timeline'i, «Muammo bor».
- **Sotuvchi**: Sotish wizard'i (rasm yuklash haqiqiy), AI tahlili animatsiyasi, narx taklifi karta, E'lonlarim statistikasi, «E'lonni ko'tarish», Hamyon.
- **Narx tahlilchisi**: 3 ustunli ekran, histogramma, moderator narxi ±50 000, jonli haq qayta hisobi.
- **Moderator**: J/K/A/E/R klaviatura.
- **Logistika**: 17:00 taymeri, «Qadoqlandi», yuk xati chop etish, manifest.
- **Moliya**: haq tasdiqlash navbati, qoidalar «Sinab ko'rish», juma to'lovi, 50 mln dan yuqori qo'sh imzo.
- **Operator**: qaytarish qarori (to'liq / qisman / rad) va escrow'ga ta'siri.
- **Super admin**: Rollar matritsasi (o'zgartirsangiz menyu darhol o'zgaradi), Audit log, ⌘K.
- **Kompaniya**: Excel yuklash (haqiqiy .xlsx), ustun moslash, narx qoidasi tekshiruvi, API kalitlari.
- **BTS**: «Hammasini qabul qilish», «Filialga yetdi», «Topshirildi», muammoli yuk.

## Arxitektura

```
src/domain   sof TS: types, money (tiyin), pricing, fees, recs, machines, checks, audit, clock
src/seed     deterministik seed (seed=2026), oltin yo'l raqamlari qulflangan
src/api      soxta backend: 150–600 ms kechikish, event bus, audit, PriceAdvisor interfeysi
src/store    zustand + immer + persist + BroadcastChannel sync
src/design   Sharabara Modern primitivlari: Seal, Stamp, LedgerRow, BottomSheet, DataTable…
src/apps     mobile · admin · partner · bts · stage
src/e2e      Playwright
```

**Qat'iy qoidalar:** pul faqat butun son tiyinda; status faqat mashina orqali (noto'g'ri o'tish xato beradi, har o'tish audit logda); barcha matn `src/i18n/uz.ts`; haqiqiy logotip yo'q; karta raqami kiritiladigan forma yo'q; admin/partner/bts ichida `toast` faqat o'z `toast.ts` modulidan import qilinadi (kanal), `@/design` dagi `toast` — mobil ilova uchun.

## Production'ga o'tishda nima almashadi

| Demo | Production |
|---|---|
| `src/api/*` soxta backend | Haqiqiy API (Supabase/Postgres yoki NestJS); `domain/` o'zgarmaydi |
| `MockPriceAdvisor` | Backend orqali Claude API: tanish + tushuntirish; hisob-kitob `domain/pricing` da qoladi |
| Payme/Click soxta oyna | Payme/Click merchant API, webhook → `order.paid` |
| BTS paneli + manifest | BTS API (yuk xati, tracking); panel BTS uchun qoladi |
| `localStorage` + BroadcastChannel | Realtime (Supabase Realtime / WebSocket) |
| Veb mobil ilova | React Native (Expo) — `domain/` va `api/` kontrakt qayta ishlatiladi |
| Seed ma'lumot | Haqiqiy narx bazasi: 30 kunlik taqqoslash tarixi hisoblab boriladi |

## v2 (2026-09-28): tushunarlilik + dizayn + audit tuzatishlari

Batafsil: [docs/audit-v2/REPORT.md](docs/audit-v2/REPORT.md) va [docs/audit-v2/README.md](docs/audit-v2/README.md) (oldin/keyin skrinshotlar, 15 band, tushunarlilik jadvali).
Qisqacha: har ekranda bir gaplik izoh va «?» paneli, jargon yo’q, bitta oltin tugma, admin «Bugun qilish kerak», sahnada tezlik/orqaga/spotlight, mobil tanishtiruv, iliq oq + oltin tokenlar, Bitter sarlavhalar, seed’da har kategoriya uchun 30 kunlik taqqoslash.

## Sifat holati (2026-09-28)

| Tekshiruv | Natija |
|---|---|
| `tsc --noEmit` | toza |
| `oxlint src` | toza |
| Vitest | 121 test o'tdi (narx hisob-kitobi: qatorlar yig'indisi = tavsiya, A holatda tuzatma 0, qoida aynan 5%) |
| Playwright e2e | 7/7: Oltin yo'l boshidan oxirigacha + 6 ta smoke (konsol xatosiz) |
| Tushunarlilik skripti | 50 ekran: sarlavha, izoh/«?», oltin tugma, jargon — `docs/audit-v2/_ux-check.json` |
| Lighthouse, admin (desktop) | Performance 99 · Accessibility 100 · Best practices 100 · CLS 0.017 |
| Lighthouse, mobil `/m` (mobil emulyatsiya, sekin 4G) | Performance 85 · Accessibility 100 · Best practices 100 · CLS 0.001 · LCP 3.3 s |

Mobil Performance 90 ga yetmadi: asosiy sabab — birinchi ekran uchun ~300 KB (gzip) JavaScript
(React, framer-motion, dizayn tizimi, seed generatori) sekin 4G emulyatsiyasida 3,3 s yuklanadi.
Yaxshilash yo'llari production'da: `LazyMotion` bilan framer-motion'ni qisqartirish, seed'ni brauzerda emas
backend'dan olish, ilovani code-split qilish.

## Skrinshotlar

`screenshots/` papkasida: `final-mobile-home.png`, `final-mobile-mylistings.png`, `final-admin-pricing.png`,
`final-stage.png` (yangi sahna, 1440×900), `stage-golden.png`, `stage-golden-step2.png`, `stage-done.png`, `partner-*.png` (23 ta), `bts-*.png` (11 ta),
`qa/` — barcha mobil (390 va 360 px) va admin (1440 va 1280 px) marshrutlari.

## Ma'lum cheklovlar

- AI qatlami soxta (`MockPriceAdvisor`): tanish lug'at asosida, narx hisob-kitobi esa haqiqiy (`domain/pricing`).
- Narx tahlili navbatidagi ko'p seed e'lonlar uchun 30 kunlik taqqoslash tarixi yo'q («Kam ma'lumot»);
  to'liq tarix faqat Oltin yo'l e'loni (iPhone 13 Pro 256 GB) uchun terilgan.
- To'lov, BTS, Excel — haqiqiy integratsiyasiz; Excel import haqiqiy fayl o'qiydi, lekin server yo'q.
- Xarita OpenStreetMap plitkalariga bog'liq; tarmoq bo'lmasa stilize qilingan SVG xarita ko'rinadi.
- Rus tili: tuzilma tayyor (`src/i18n`), tarjima yo'q.
- Ma'lumot bitta brauzerda saqlanadi; boshqa qurilma bilan sinxronlanmaydi. Seed o'zgarganda (barmoq izi `seedFingerprint`) eski persist avtomatik tashlanadi va «Demo ma'lumoti yangilandi» xabari chiqadi.
