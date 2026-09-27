/** Static Uzbek reference data used by the seed generators. */
import type { Category, Region, RegionId, RoleMatrix } from '../domain/types'

export const REGIONS: Region[] = [
  { id: 'toshkent_sh', name: 'Toshkent shahri', lat: 41.3111, lng: 69.2797 },
  { id: 'toshkent_v', name: 'Toshkent viloyati', lat: 41.0401, lng: 69.3591 },
  { id: 'andijon', name: 'Andijon', lat: 40.7821, lng: 72.3442 },
  { id: 'fargona', name: "Farg'ona", lat: 40.3842, lng: 71.7843 },
  { id: 'namangan', name: 'Namangan', lat: 40.9983, lng: 71.6726 },
  { id: 'samarqand', name: 'Samarqand', lat: 39.6542, lng: 66.9597 },
  { id: 'buxoro', name: 'Buxoro', lat: 39.7747, lng: 64.4286 },
  { id: 'xorazm', name: 'Xorazm', lat: 41.55, lng: 60.6333 },
  { id: 'qashqadaryo', name: 'Qashqadaryo', lat: 38.8606, lng: 65.7891 },
  { id: 'surxondaryo', name: 'Surxondaryo', lat: 37.2242, lng: 67.2783 },
  { id: 'jizzax', name: 'Jizzax', lat: 40.1158, lng: 67.8422 },
  { id: 'sirdaryo', name: 'Sirdaryo', lat: 40.4897, lng: 68.7842 },
  { id: 'navoiy', name: 'Navoiy', lat: 40.0844, lng: 65.3792 },
  { id: 'qoraqalpogiston', name: "Qoraqalpog'iston", lat: 42.4531, lng: 59.6103 },
]

/** Branch names per region (Toshkent shahri uses district names without region prefix). */
export const BRANCH_NAMES: Record<RegionId, string[]> = {
  toshkent_sh: ['Chilonzor', 'Yunusobod', "Mirzo Ulug'bek", 'Yakkasaroy', 'Shayxontohur', 'Sergeli', 'Olmazor', 'Uchtepa', 'Yashnobod', 'Mirobod', 'Bektemir'],
  toshkent_v: ['Nurafshon', 'Chirchiq', 'Angren', 'Olmaliq'],
  andijon: ['Markaz', 'Asaka', 'Xonobod'],
  fargona: ['Markaz', "Qo'qon", "Marg'ilon"],
  namangan: ['Markaz', 'Davlatobod', 'Uychi'],
  samarqand: ['Registon', "Kattaqo'rg'on", 'Urgut'],
  buxoro: ['Markaz', 'Kogon', "G'ijduvon"],
  xorazm: ['Urganch', 'Xiva'],
  qashqadaryo: ['Qarshi', 'Shahrisabz', 'Koson'],
  surxondaryo: ['Termiz', 'Denov'],
  jizzax: ['Markaz', 'Zomin'],
  sirdaryo: ['Guliston', 'Yangiyer'],
  navoiy: ['Markaz', 'Zarafshon'],
  qoraqalpogiston: ['Nukus', 'Taxiatosh'],
}

export const STREETS = [
  'Amir Temur', 'Alisher Navoiy', 'Mustaqillik', 'Bobur', 'Islom Karimov', "Buyuk Ipak Yo'li", 'Beruniy', 'Furqat',
  "Cho'lpon", 'Yangi Shahar', 'Bunyodkor', 'Istiqlol', "Do'stlik", 'Qatortol', 'Sharof Rashidov', "Mirzo Ulug'bek",
]

export const CATEGORY_SLUG: Record<string, string> = {
  telefonlar: 'phone', noutbuklar: 'laptop', televizorlar: 'tv', maishiy: 'appliance',
  mebel: 'furniture', kiyim: 'clothes', sport: 'sport', bolalar: 'kids',
}

const phoneNotes = {
  A: "Yangidek: tirnalish yo'q, quti va zaryadlovchi bor",
  B: 'Yaxshi: mayda tirnalishlar, hammasi ishlaydi',
  C: "Qoniqarli: ko'rinarli izlar, ekran yoki korpusda nuqson bor",
  D: "Nuqsonli: ta'mir talab, qismlarga sotilishi mumkin",
}

export const CATEGORIES: Category[] = [
  {
    id: 'telefonlar', parentId: null, name: 'Telefonlar', icon: 'smartphone', discountRate: 0.05, maxNewRatio: 0.85,
    attributes: [
      { key: 'model', label: 'Model', type: 'select', required: true, options: ['iPhone 11', 'iPhone 12', 'iPhone 13', 'iPhone 13 Pro', 'iPhone 13 Pro Max', 'iPhone 14', 'iPhone 14 Pro', 'iPhone 15', 'iPhone 15 Pro', 'Samsung Galaxy S22', 'Samsung Galaxy S23', 'Samsung Galaxy S24', 'Samsung Galaxy A54', 'Samsung Galaxy A34', 'Redmi Note 12', 'Redmi Note 13', 'Xiaomi 13', 'Poco X5 Pro'] },
      { key: 'xotira', label: 'Xotira', type: 'select', required: true, options: ['64 GB', '128 GB', '256 GB', '512 GB'] },
      { key: 'rang', label: 'Rang', type: 'text' },
      { key: 'batareya', label: 'Batareya holati', type: 'number', unit: '%' },
    ],
    conditionNotes: phoneNotes,
  },
  {
    id: 'noutbuklar', parentId: null, name: 'Noutbuklar', icon: 'laptop', discountRate: 0.05, maxNewRatio: 0.85,
    attributes: [
      { key: 'model', label: 'Model', type: 'text', required: true },
      { key: 'ram', label: 'Operativ xotira', type: 'select', options: ['8 GB', '16 GB', '32 GB'] },
      { key: 'ssd', label: 'SSD', type: 'select', options: ['256 GB', '512 GB', '1 TB'] },
      { key: 'sikl', label: 'Batareya sikli', type: 'number' },
    ],
    conditionNotes: {
      A: 'Yangidek: klaviatura va ekran benuqson', B: 'Yaxshi: korpusda mayda izlar', C: "Qoniqarli: batareya charchagan, ko'rinarli izlar", D: "Nuqsonli: ta'mir talab",
    },
  },
  {
    id: 'televizorlar', parentId: null, name: 'Televizorlar', icon: 'tv', discountRate: 0.05, maxNewRatio: 0.85,
    attributes: [
      { key: 'diagonal', label: 'Diagonal', type: 'select', options: ['32"', '43"', '50"', '55"', '65"'] },
      { key: 'smart', label: 'Smart TV', type: 'select', options: ['Ha', "Yo'q"] },
    ],
    conditionNotes: { A: "Yangidek: ekranda dog' yo'q", B: 'Yaxshi: pult va oyoqlari bor', C: "Qoniqarli: ekranda mayda dog'", D: "Nuqsonli: ekran yoki plata ta'mir talab" },
  },
  {
    id: 'maishiy', parentId: null, name: 'Maishiy texnika', icon: 'washing-machine', discountRate: 0.05, maxNewRatio: 0.85,
    attributes: [
      { key: 'turi', label: 'Turi', type: 'select', options: ['Kir yuvish', 'Muzlatgich', 'Konditsioner', 'Changyutgich', "Mikroto'lqinli pech"] },
      { key: 'yil', label: 'Ishlab chiqarilgan yil', type: 'number' },
    ],
    conditionNotes: { A: 'Yangidek: kafolat hali tugamagan', B: "Yaxshi: to'liq ishlaydi", C: 'Qoniqarli: tashqi nuqsonlar bor', D: "Nuqsonli: ta'mir talab" },
  },
  {
    id: 'mebel', parentId: null, name: 'Mebel', icon: 'armchair', discountRate: 0.05, maxNewRatio: 0.85,
    attributes: [
      { key: 'turi', label: 'Turi', type: 'select', options: ['Divan', 'Kreslo', 'Stol', 'Shkaf', 'Karavot'] },
      { key: 'material', label: 'Material', type: 'text' },
    ],
    conditionNotes: { A: 'Yangidek', B: 'Yaxshi: mayda izlar', C: 'Qoniqarli: qoplamada yeyilish', D: "Nuqsonli: ta'mir talab" },
  },
  {
    id: 'kiyim', parentId: null, name: 'Kiyim', icon: 'shirt', discountRate: 0.08, maxNewRatio: 0.6,
    attributes: [
      { key: 'olcham', label: "O'lcham", type: 'select', options: ['S', 'M', 'L', 'XL', 'XXL'] },
      { key: 'brend', label: 'Brend', type: 'text' },
    ],
    conditionNotes: { A: 'Yangi, etiketkasi bilan', B: 'Bir-ikki marta kiyilgan', C: 'Kiyilgan, izlar bor', D: 'Nuqsonli' },
  },
  {
    id: 'sport', parentId: null, name: 'Sport', icon: 'dumbbell', discountRate: 0.05, maxNewRatio: 0.85,
    attributes: [
      { key: 'turi', label: 'Turi', type: 'select', options: ['Velosiped', 'Trenajyor', 'Gantel', 'Konki', 'Skeytbord'] },
    ],
    conditionNotes: { A: 'Yangidek', B: 'Yaxshi', C: 'Qoniqarli', D: 'Nuqsonli' },
  },
  {
    id: 'bolalar', parentId: null, name: 'Bolalar', icon: 'baby', discountRate: 0.05, maxNewRatio: 0.85,
    attributes: [
      { key: 'turi', label: 'Turi', type: 'select', options: ['Aravacha', 'Karavotcha', 'Avtokreslo', "O'yinchoq", 'Velosiped'] },
      { key: 'yosh', label: 'Yosh', type: 'text' },
    ],
    conditionNotes: { A: 'Yangidek', B: 'Yaxshi: toza, ishlaydi', C: 'Qoniqarli', D: 'Nuqsonli' },
  },
]

export const MALE_NAMES = ['Aziz', 'Sardor', 'Jasur', 'Bekzod', 'Otabek', 'Rustam', 'Sherzod', "Ulug'bek", 'Doston', 'Farrux', 'Nodir', 'Javohir', 'Alisher', 'Bobur', 'Timur', 'Shohruh', 'Islom', 'Kamol', 'Anvar', 'Murod']
export const FEMALE_NAMES = ['Dilnoza', 'Malika', 'Nilufar', 'Kamola', 'Shahnoza', 'Gulnora', 'Sevara', 'Madina', 'Zilola', 'Nargiza', 'Feruza', 'Umida', 'Lola', 'Zarina', 'Mohira', 'Nodira', 'Yulduz', 'Maftuna', 'Dildora', 'Barno']
export const LAST_NAMES_M = ['Karimov', 'Toshmatov', 'Abdullayev', 'Alimov', 'Rasulov', 'Xolmatov', 'Yusupov', 'Ergashev', 'Nurmatov', 'Tursunov', 'Saidov', 'Rashidov', 'Mirzayev', 'Qodirov', 'Hamidov', 'Umarov', 'Islomov', 'Sobirov', 'Bekmurodov', "Yo'ldoshev"]
export const LAST_NAMES_F = LAST_NAMES_M.map((n) => `${n}a`)

export const DISTRICTS: Partial<Record<RegionId, string[]>> = {
  toshkent_sh: ['Chilonzor', 'Yunusobod', "Mirzo Ulug'bek", 'Yakkasaroy', 'Sergeli', 'Shayxontohur'],
  namangan: ['Markaz', 'Davlatobod', 'Uychi', 'Chortoq'],
  andijon: ['Markaz', 'Asaka'],
  samarqand: ['Registon', 'Urgut'],
  fargona: ['Markaz', "Qo'qon"],
}

export const ROLE_MATRIX: RoleMatrix = {
  super_admin: {
    dashboard: ['view', 'edit', 'approve'], moderation: ['view', 'edit', 'approve'], pricing: ['view', 'edit', 'approve'],
    fees: ['view', 'edit', 'approve'], orders: ['view', 'edit', 'approve'], logistics: ['view', 'edit', 'approve'],
    payments: ['view', 'edit', 'approve'], returns: ['view', 'edit', 'approve'], companies: ['view', 'edit', 'approve'],
    products: ['view', 'edit', 'approve'], users: ['view', 'edit', 'approve'], categories: ['view', 'edit', 'approve'],
    campaigns: ['view', 'edit', 'approve'], reports: ['view', 'edit', 'approve'], roles: ['view', 'edit', 'approve'],
    audit: ['view', 'edit', 'approve'], warehouse: ['view', 'edit', 'approve'], director: ['view'],
  },
  director: {
    director: ['view'], dashboard: ['view'], reports: ['view'], orders: ['view'], warehouse: ['view'], payments: ['view'],
    companies: ['view'], products: ['view'], logistics: ['view'], audit: ['view'], users: ['view'], returns: ['view'],
  },
  moderator: { moderation: ['view', 'edit', 'approve'], dashboard: ['view'] },
  price_analyst: { pricing: ['view', 'edit', 'approve'], categories: ['view'], dashboard: ['view'] },
  logistics: { orders: ['view', 'edit'], logistics: ['view', 'edit', 'approve'], dashboard: ['view'], warehouse: ['view', 'edit', 'approve'] },
  finance: { payments: ['view', 'edit', 'approve'], fees: ['view', 'edit', 'approve'], dashboard: ['view'], reports: ['view'] },
  operator: { returns: ['view', 'edit', 'approve'], users: ['view'], orders: ['view'] },
}

export const CONDITION_PHRASE: Record<'A' | 'B' | 'C' | 'D', string[]> = {
  A: ['ideal holat', 'yangidek', 'quti bilan, ishlatilmagan'],
  B: ['holati yaxshi', 'yaxshi holatda, quti bilan', 'oz ishlatilgan'],
  C: ["o'rtacha holat", 'ishlatilgan, izlar bor', 'holati qoniqarli'],
  D: ["ta'mir talab", 'nuqsoni bor', 'qismlarga'],
}

export const PHONE_COLORS = ['Sierra Blue', 'Graphite', 'Midnight', 'Starlight', 'Qora', 'Oq', "Ko'k", 'Yashil', 'Binafsha']

/** Non-dictionary items: [title, minSum, maxSum, attributes] */
export type ItemTemplate = { title: string; min: number; max: number; attributes: Record<string, string | number>; desc: string }

export const TEMPLATES: Record<'mebel' | 'kiyim' | 'sport' | 'bolalar', ItemTemplate[]> = {
  mebel: [
    { title: 'Divan 3 kishilik, kulrang', min: 1_800_000, max: 3_500_000, attributes: { turi: 'Divan', material: 'Mato' }, desc: "Yotoq bo'lib ochiladi, ichida quti bor." },
    { title: 'Yumshoq kreslo, jigarrang', min: 700_000, max: 1_400_000, attributes: { turi: 'Kreslo', material: 'Eko-charm' }, desc: 'Xonadonda ishlatilgan, chekilmagan uy.' },
    { title: "Yozuv stoli, yog'och", min: 500_000, max: 1_200_000, attributes: { turi: 'Stol', material: 'MDF' }, desc: "Ikki tortmali, o'lchami 120×60 sm." },
    { title: 'Shkaf 3 eshikli, oq', min: 1_500_000, max: 2_800_000, attributes: { turi: 'Shkaf', material: 'LDSP' }, desc: 'Oyna bilan, qismlarga ajratib beriladi.' },
    { title: 'Karavot 160×200, matras bilan', min: 1_600_000, max: 3_200_000, attributes: { turi: 'Karavot', material: "Yog'och" }, desc: 'Ortopedik matras kiradi.' },
    { title: 'Oshxona stoli va 4 stul', min: 900_000, max: 1_900_000, attributes: { turi: 'Stol', material: "Yog'och" }, desc: "To'plam holida, bir yil ishlatilgan." },
  ],
  kiyim: [
    { title: 'Erkaklar qishki kurtkasi, Zara', min: 350_000, max: 900_000, attributes: { olcham: 'L', brend: 'Zara' }, desc: 'Ikki mavsum kiyilgan, issiq.' },
    { title: 'Ayollar palto, kashemir', min: 600_000, max: 1_500_000, attributes: { olcham: 'M', brend: 'Massimo Dutti' }, desc: "Bir marta kiyilgan, o'lcham to'g'ri kelmadi." },
    { title: 'Nike Air Max krossovka, 42', min: 400_000, max: 1_100_000, attributes: { olcham: 'L', brend: 'Nike' }, desc: 'Original, qutisi bor.' },
    { title: "Jins shim, Levi's 501", min: 200_000, max: 500_000, attributes: { olcham: 'M', brend: "Levi's" }, desc: 'Klassik model, yaxshi holatda.' },
    { title: "Kostyum, to'q ko'k, 50 o'lcham", min: 700_000, max: 1_800_000, attributes: { olcham: 'XL', brend: 'Uzbek Textile' }, desc: "To'yga bir marta kiyilgan." },
  ],
  sport: [
    { title: 'Velosiped Trinx M136, 26"', min: 1_500_000, max: 3_200_000, attributes: { turi: 'Velosiped' }, desc: '21 tezlik, disk tormoz.' },
    { title: 'Yugurish trenajyori, elektr', min: 3_500_000, max: 7_500_000, attributes: { turi: 'Trenajyor' }, desc: 'Buklanadi, 120 kg gacha.' },
    { title: "Gantel to'plami 2×20 kg", min: 400_000, max: 900_000, attributes: { turi: 'Gantel' }, desc: 'Rezina qoplamali disklar.' },
    { title: 'Rolikli konki, 38–41', min: 300_000, max: 700_000, attributes: { turi: 'Konki' }, desc: "O'lchami sozlanadi, himoya to'plami bilan." },
    { title: 'Skeytbord, Penny board', min: 250_000, max: 600_000, attributes: { turi: 'Skeytbord' }, desc: "Yengil, bolalar va o'smirlar uchun." },
  ],
  bolalar: [
    { title: 'Bolalar aravachasi 2 in 1, Chicco', min: 1_200_000, max: 3_000_000, attributes: { turi: 'Aravacha', yosh: '0–3 yosh' }, desc: "Qishki va yozgi blok, yomg'irdan himoya bor." },
    { title: 'Bolalar karavotchasi, tebranadigan', min: 600_000, max: 1_500_000, attributes: { turi: 'Karavotcha', yosh: '0–4 yosh' }, desc: "Matras va yon to'shak bilan." },
    { title: 'Avtokreslo 9–36 kg, Britax', min: 800_000, max: 2_000_000, attributes: { turi: 'Avtokreslo', yosh: '1–12 yosh' }, desc: 'Isofix, yon himoya.' },
    { title: "LEGO City to'plami, 600 detal", min: 300_000, max: 700_000, attributes: { turi: "O'yinchoq", yosh: '6+' }, desc: 'Barcha detallar joyida, qutisi bilan.' },
    { title: "Bolalar velosipedi 16\", qo'shimcha g'ildirak bilan", min: 500_000, max: 1_200_000, attributes: { turi: 'Velosiped', yosh: '4–7 yosh' }, desc: 'Bir mavsum minilgan.' },
  ],
}

export const RETURN_REASONS = ['Tavsifga mos kelmaydi', 'Yetkazishda shikastlangan', 'Ishlamaydi', 'Boshqa rang keldi']
export const CHAT_LINES = [
  'Assalomu alaykum, hali sotilmadimi?',
  'Va alaykum assalom, ha, bor.',
  "Narxni ozgina tushirsangiz bo'ladimi?",
  "Narx Sharabara tekshiruvidan o'tgan, tushira olmayman. Yetkazish bepul emas, lekin BTS orqali tez.",
  'Tushunarli. Batareya holati qanday?',
  'Batareya 89%, quti va kabel bilan beraman.',
  'Yaxshi, bugun buyurtma beraman.',
  'Rahmat, kutaman!',
]
