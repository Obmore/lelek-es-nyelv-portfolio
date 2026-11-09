// All content that Anna may want to edit lives here. page.tsx only renders it.
// U+00A0 (non-breaking space) keeps prices from wrapping in the middle of a number.

/** The site owner and the contact e-mail; the form endpoints are built from the e-mail. */
export const OWNER_NAME = 'Juhász Nagy Anna';
export const CONTACT_EMAIL = 'juhasznagyanna@gmail.com';
/** The owner's public phone number: display text (with U+00A0 between the groups) and its tel: link. */
export const CONTACT_PHONE = '+36 20 319 5621';
export const CONTACT_PHONE_HREF = 'tel:+36203195621';
export const FORM_ENDPOINT = `https://formsubmit.co/${CONTACT_EMAIL}`;
export const FORM_AJAX_ENDPOINT = `https://formsubmit.co/ajax/${CONTACT_EMAIL}`;

/** Optional links: the link renders only when the URL is set. */
export const INSTAGRAM_URL: string | null = null;
export const FACEBOOK_URL: string | null = 'https://www.facebook.com/anna.juhasznagy';
export const PRIVACY_URL: string | null = 'adatkezeles/';

/** Single source of truth for prices (used by the cards and by the FAQ). */
export const PRICE_MENTAL = '18 000 Ft / 60 perc';
export const PRICE_ENGLISH = '7000 Ft / 60 perc';

export type Testimonial = {
  id: string;
  author: string;
  category: 'Angol' | 'Mentálhigiéné';
  label: string;
  /** Exact substring of `text`, shown as the large pull-quote. */
  pull: string;
  text: string;
};

export const testimonials: Testimonial[] = [
  {
    id: 'helle-jazmin',
    author: 'Helle Jázmin',
    category: 'Angol',
    label: 'C1 nyelvvizsga-felkészítés · 1 év',
    pull: 'egy év alatt egy erős B2-es szintről elvezettél egy fantasztikus C1-es tudásszintig',
    text: 'Szeretném, szeretnénk megköszönni, amit értem tettél az elmúlt évben! Édesanyám a kommented megtalálva talált rád, hiszen én éppen angoltanárt kerestem C1-es nyelvvizsga-felkészítéshez. Szinte rögtön el is kezdtük a közös munkát, ami veled az egész tanulási folyamatot megkönnyítette. Végig emberközpontú, jó hangulatú és igényes órákat adtál nekem. Amellett, hogy ennyire figyelmes voltál velem, a lényeget nem hagyhatom ki: egy év alatt egy erős B2-es szintről elvezettél egy fantasztikus C1-es tudásszintig, amit egy kiváló felsőfokú nyelvvizsgával igazoltam. Hálásan köszönöm azt a mérhetetlen tudást és tapasztalatot, amit átadtál nekem (nemcsak az angol, hanem az élet területén is), illetve azt a rengeteg értékes beszélgetést, amikkel hozzájárultál a fejlődésemhez minden téren!',
  },
  {
    id: 'petho-marci',
    author: 'Pethő Marci',
    category: 'Angol',
    label: 'C1 nyelvvizsga-felkészítés · online órák',
    pull: 'Nekem elsőre sikerült a vizsgám, amiért nagyon hálás vagyok.',
    text: 'Szeretném megköszönni azt a fejlődési lehetőséget, amit a te segítségeddel tapasztaltam meg. C1-es nyelvvizsgára készültem, és anyukámon keresztül ismertelek meg. Nagyon sokat fejlődtem az óráidon, annak ellenére, hogy ezeken online tudtam csak részt venni, mivel messze lakom. Mindig jó hangulatban teltek az órák, vidám hangulatban haladtunk át a témakörökön, nyelvtani anyagokon, rengeteg tesztet kitöltve. Nekem elsőre sikerült a vizsgám, amiért nagyon hálás vagyok. A többletpontokkal, amiket ez a nyelvvizsga hozott számomra, bekerültem az egyetemre, ahova jelentkeztem. Egy csodás kaland volt!',
  },
  {
    id: 'barbara-e',
    author: 'Barbara E.',
    category: 'Mentálhigiéné',
    label: 'Mentálhigiénés segítő beszélgetések · 2 év',
    pull: 'sokkal közelebb kerültem önmagamhoz',
    text: 'Pannihoz segítő alkalmakra kezdtem járni, az elmúlt két évben rendszeresen találkoztunk. Nagyon szeretek vele beszélgetni, hiszen mindig kifejezetten pontos meglátást kapok tőle, miközben figyelmesen végighallgat. A beszélgetés segít nekem abban, hogy megértsem a saját helyzetemet, és a környezetemben lévő emberek, családtagok viselkedésének mozgatórugóit, de elsősorban abban segít, hogy megértsem magam, s ezáltal sokkal közelebb kerültem önmagamhoz. Az alkalmakról mindig könnyebb szívvel távozom, s valami olyan konklúzióval, ami segít az aktuális nehézségemmel való megküzdésben. Nagyon tudom ajánlani őt, mert egy nagyon kedves, együttérző, közvetlen és nyitott embert ismertem meg a személyében. Mindenkivel gyorsan megtalálja a közös hangot, vele könnyen biztonságban érezhetjük magunkat. Legyen szó bármilyen helyzetről, ő tud valami olyat mondani, ami közelebb visz minket a megoldáshoz!',
  },
  {
    id: 'tunde-l',
    author: 'Tünde L.',
    category: 'Mentálhigiéné',
    label: 'Szülői visszajelzés · gyermek elalvási nehézségei',
    pull: 'figyelmével, megértő lényével átsegítette kislányomat a nehéz időszakon',
    text: 'A kislányommal jártunk Annánál, mivel nehezen tudott esténként elaludni. Azonnal megtalálták a közös hangot, s Anna nyugodt, figyelmes lénye sokat segített Eszternek. Hamar megnyílt, s mindvégig beszédes volt. Otthon is gyakoroltuk a relaxációt, ami segítette abban, hogy nyugodtan készülődjön az esti alváshoz. Az éjszakák is egyre normálisabban teltek. Szívből ajánlom őt, mert figyelmével, megértő lényével átsegítette kislányomat a nehéz időszakon!',
  },
];

export type Service = {
  id: string;
  slug: 'mind' | 'language';
  index: string;
  area: string;
  duration: string;
  symbol: string;
  name: string;
  scope?: string;
  level?: string;
  description: string;
  chips: string[];
  price: string;
  ariaLabel: string;
};

export const services: Service[] = [
  {
    id: 'mind',
    slug: 'mind',
    index: '01',
    area: 'MENTÁLHIGIÉNÉ',
    duration: '60 PERC',
    symbol: '↺',
    name: 'Mentálhigiénés segítő beszélgetés',
    scope: 'Segítő beszélgetés felnőtteknek, fiataloknak és gyermekeknek',
    description: 'Ha túl sok lett. Ha változnál. Ha szeretnéd végre meghallani a saját válaszaidat.',
    chips: ['élethelyzeti elakadások', 'önismeret és határok', 'stressz és egyensúly'],
    price: PRICE_MENTAL,
    ariaLabel: 'Érdeklődöm a mentálhigiénés beszélgetésről',
  },
  {
    id: 'language',
    slug: 'language',
    index: '02',
    area: 'ANGOL',
    duration: '60 PERC',
    symbol: 'Aa',
    name: 'Angol oktatás',
    scope: 'Felkészítés nemzetközi (például IELTS, Cambridge) és akkreditált magyar nyelvvizsgákra (például Origó, Euroexam, BME, telc)',
    level: 'Alap-, közép- és felsőfokon',
    description: 'Beszédközpontú órák diákoknak és felnőtteknek, nyelvvizsgára készülőknek is. Nem a görcsös teljesítés a cél, hanem a valódi kapcsolódás.',
    chips: ['beszédbátorság', 'munkahelyi angol', 'önazonos kommunikáció', 'nyelvvizsga-felkészítés'],
    price: PRICE_ENGLISH,
    ariaLabel: 'Érdeklődöm az angolórákról',
  },
];

export const faqs = [
  {
    question: 'Honnan tudhatom, melyik folyamat való nekem?',
    answer: 'A 20 perces, díjmentes ismerkedő beszélgetésen közösen ránézünk arra, miben vagy most, és mire lenne szükséged. Ha az angol és az önismeret egyszerre fontos, a két területet finoman össze is kapcsolhatjuk.',
  },
  {
    question: 'Mennyibe kerül egy alkalom?',
    answer: `Egy mentálhigiénés segítő beszélgetés ${PRICE_MENTAL}, egy angolóra ${PRICE_ENGLISH}.`,
  },
  {
    question: 'Online vagy személyesen találkozunk?',
    answer: 'A segítő beszélgetéseket személyesen, Budapesten a XI. kerületben, és online is tartom. Az angolórák online is elérhetők, így bárhonnan csatlakozhatsz; a részleteket az ismerkedő beszélgetésen egyeztetjük.',
  },
  {
    question: 'Milyen nyelvvizsgára készítesz fel?',
    answer: 'Minden nemzetközi (például IELTS, Cambridge) és akkreditált magyar nyelvvizsgára (például Origó, Euroexam, BME, telc) vállalok felkészítést, alap-, közép- és felsőfokon.',
  },
  {
    question: 'Mi történik, ha félek angolul megszólalni?',
    answer: 'Pont ebből indulunk. Nem a hibátlan mondat a cél, hanem hogy biztonságban maradj akkor is, amikor keresed a szavakat. A nyelvtanulás tempóját hozzád, nem egy tankönyvhöz igazítom.',
  },
  {
    question: 'Hány alkalommal érdemes számolnom?',
    answer: 'Nincs kötelező csomag vagy előre eldöntött hossz. Az első néhány alkalom után együtt értékeljük, mi szolgál téged a legjobban, és ehhez igazítjuk a folytatást.',
  },
];

/** About section: Anna's own text, verbatim (first paragraph is the serif lead). */
export const aboutParagraphs = [
  '1969-ben születtem. A szüleim orvosok voltak, kiskorom óta láttam, ahogyan feltétel nélkül, felelősségteljesen segítenek bárkinek, aki támogatásukat kéri. A szakmai segítségen messze túlmutató támogatást nyújtottak mindenkinek, aki feléjük fordult. Számomra ez alapminta és érték lett jelenlegi életemben.',
  'Később az ELTE angol nyelv és irodalom szakán szereztem meg első diplomámat, s tanárként szintén ezen elvek szerint dolgozom. A tanulási folyamat középpontjában a tanítványaim állnak. Szeretettel, odafigyeléssel segítem a tanulási folyamataikat.',
  'Mivel a munkámban különleges szerep jut a humán pszichológiai és pedagógiai jelenlétnek, elvégeztem a Semmelweis Egyetem Mentálhigiéné Intézetének posztgraduális képzését is, s hogy mindazt a tudást, tapasztalatot, amit ebből merítek, az emberek, a hozzám fordulók szolgálatának szentelhessem. A segítő folyamatban fontos szerepet kap az, hogy egyenrangú társként tekintek a hozzám fordulókra, türelemmel kísérem őket, s velük drukkolok, hogy megtalálják kérdéseikre a legjobb választ.',
];
export const ABOUT_PORTRAIT_ALT = 'Juhász Nagy Anna portréja';
export const ABOUT_STAMP = 'ELTE · SOTE';

/** Consent checkbox text; CONSENT_LINK is rendered as a link to the privacy notice. */
export const CONSENT_BEFORE = 'Elolvastam az';
export const CONSENT_LINK = 'adatkezelési tájékoztatót';
export const CONSENT_AFTER = ', és kifejezetten hozzájárulok, hogy Juhász Nagy Anna a megadott adataimat (az üzenetemben esetleg megosztott, egészségemmel kapcsolatos információkat is) a kapcsolatfelvétel és a válaszadás céljából kezelje.';

export const methodSteps = [
  { number: '01', title: 'Kapcsolódunk', text: 'Egy rövid, díjmentes online ismerkedő beszélgetésen megismerjük egymást és a kérdésedet.', word: 'hello' },
  { number: '02', title: 'Irányt találunk', text: 'Közösen megfogalmazzuk, miben szeretnél változást, és mi segíthet ebben.', word: 'notice' },
  { number: '03', title: 'Haladunk', text: 'A saját tempódban gyakorlunk, reflektálunk, és időről időre ránézünk a megtett útra.', word: 'grow' },
];

export const contactPromises = [
  { number: '01', title: 'Díjmentes ismerkedő beszélgetés', subline: '20 perc, online' },
  { number: '02', title: 'Válasz egy munkanapon belül', subline: 'e-mailben vagy telefonon' },
];

export const values = [
  { number: '01', label: ['Ítéletmentes', 'figyelem'] },
  { number: '02', label: ['Személyre szabott', 'folyamat'] },
  { number: '03', label: ['Gyakorlatias', 'eszközök'] },
  { number: '04', label: ['Humor és', 'könnyedség'] },
];

export const topics = ['Mentálhigiénés beszélgetés', 'Angolóra', 'Mindkettő', 'Egyéb'];

/**
 * Privacy notice and imprint. Inline links use the tiny syntax [label|href]; page.tsx renders them.
 * Tegező, first person (the controller speaks), like the rest of the site.
 */
export const PRIVACY_TITLE = 'Adatkezelési tájékoztató';
export const IMPRINT_TITLE = 'Impresszum';

export type PrivacySection = { title: string; paragraphs?: string[]; items?: string[]; after?: string[] };

export const privacySections: PrivacySection[] = [
  {
    title: 'Az adatkezelő',
    paragraphs: [
      `Az adatkezelő ${OWNER_NAME}. Kapcsolat: [${CONTACT_EMAIL}|mailto:${CONTACT_EMAIL}].`,
      'Ez a tájékoztató arról szól, hogyan kezelem azokat a személyes adatokat, amelyeket a kapcsolatfelvételi űrlap kitöltésekor megadsz.',
    ],
  },
  {
    title: 'Milyen adatokat kezelek?',
    paragraphs: ['Az űrlap elküldésekor a következő adatokat kapom meg:'],
    items: [
      'a neved és az e-mail-címed,',
      'a telefonszámod (ha telefonon kérsz választ; egyébként csak ha megadod),',
      'hogy miről szeretnél beszélni (az érdeklődés témája),',
      'hogy melyik elérhetőségen válaszoljak,',
      'az üzeneted szövege.',
    ],
    after: [
      'Az üzenetedben megoszthatsz az egészségi állapotodra vagy a lelki helyzetedre vonatkozó információt is. Ez különleges kategóriájú személyes adatnak minősülhet. Kérlek, csak annyit írj le, amennyit a kapcsolatfelvételhez fontosnak tartasz.',
    ],
  },
  {
    title: 'Mire használom az adatokat?',
    paragraphs: [
      'Az adatokat arra használom, hogy felvegyem veled a kapcsolatot, válaszoljak az üzenetedre, és egyeztessem az első, ismerkedő beszélgetést. Más célra nem használom őket.',
    ],
  },
  {
    title: 'Mi az adatkezelés jogalapja?',
    paragraphs: [
      'Az adatkezelés jogalapja a hozzájárulásod: az általános adatvédelmi rendelet (GDPR) 6. cikk (1) bekezdés a) pontja. Ha az üzenetedben egészségi állapotra vonatkozó adatot is megosztasz, azt a kifejezett hozzájárulásod alapján kezelem (GDPR 9. cikk (2) bekezdés a) pontja).',
      'A hozzájárulást az űrlapon a jelölőnégyzet bejelölésével adod meg. Megadása önkéntes, de nélküle az űrlap nem küldhető el. A hozzájárulást bármikor visszavonhatod, ha írsz a megadott e-mail-címre. A visszavonás nem érinti a korábbi adatkezelés jogszerűségét.',
    ],
  },
  {
    title: 'Meddig őrzöm meg az adatokat?',
    paragraphs: [
      'Az adatokat legfeljebb az érdeklődés lezárását követő 1 évig őrzöm meg, vagy addig, amíg vissza nem vonod a hozzájárulásodat, attól függően, melyik következik be előbb. Ezután törlöm őket.',
    ],
  },
  {
    title: 'Kik férnek hozzá az adatokhoz?',
    paragraphs: ['Az üzenetedet és az oldalt a következő szolgáltatók segítségével működtetem:'],
    items: [
      'FormSubmit (formsubmit.co): az űrlap tartalmát e-mailben továbbítja a postafiókomba.',
      'Google (Gmail): az a levelezési fiók, amelyben az üzeneted megérkezik és tárolódik.',
      'GitHub (GitHub Pages): az oldal tárhelye. A kiszolgálói naplók technikai adatokat, például IP-címet rögzíthetnek.',
    ],
    after: [
      'Előfordulhat, hogy ezek a szolgáltatók az adatokat az Európai Unión kívül is feldolgozzák. Ennek feltételeit az adott szolgáltató saját adatvédelmi tájékoztatója tartalmazza.',
    ],
  },
  {
    title: 'Sütik és nyomkövetés',
    paragraphs: ['Az oldal nem használ követő, elemző (analitikai) vagy hirdetési sütiket.'],
  },
  {
    title: 'Mik a jogaid?',
    paragraphs: ['Kérheted az adataidhoz való hozzáférést, a helyesbítésüket, a törlésüket vagy a kezelésük korlátozását. Kérheted az adatok hordozhatóságát is, és bármikor visszavonhatod a hozzájárulásodat.'],
    after: [
      `Kérésedet e-mailben küldheted el a [${CONTACT_EMAIL}|mailto:${CONTACT_EMAIL}] címre. Egy hónapon belül válaszolok.`,
    ],
  },
  {
    title: 'Hová fordulhatsz panasszal?',
    paragraphs: [
      'Ha úgy érzed, hogy az adataid kezelése sérti a jogaidat, panaszt tehetsz a Nemzeti Adatvédelmi és Információszabadság Hatóságnál (NAIH): 1055 Budapest, Falk Miksa utca 9–11., e-mail: [ugyfelszolgalat@naih.hu|mailto:ugyfelszolgalat@naih.hu], honlap: [www.naih.hu|https://www.naih.hu]. Bírósághoz is fordulhatsz.',
    ],
  },
];

export const imprint: { label: string; value: string }[] = [
  { label: 'Üzemeltető', value: OWNER_NAME },
  { label: 'E-mail', value: `[${CONTACT_EMAIL}|mailto:${CONTACT_EMAIL}]` },
  { label: 'Telefon', value: `[${CONTACT_PHONE}|${CONTACT_PHONE_HREF}]` },
  { label: 'Tárhelyszolgáltató', value: 'GitHub, Inc., 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, USA' },
];
