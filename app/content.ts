// All content that Anna may want to edit lives here. page.tsx only renders it.
// U+00A0 (non-breaking space) keeps prices from wrapping in the middle of a number.

/** Contact e-mail and form endpoint (owner decision pending - value unchanged). */
export const CONTACT_EMAIL = 'benzdsiott1998@gmail.com';
export const FORM_ENDPOINT = `https://formsubmit.co/${CONTACT_EMAIL}`;
export const FORM_AJAX_ENDPOINT = `https://formsubmit.co/ajax/${CONTACT_EMAIL}`;

/** Optional links: the link renders only when the URL is set. */
export const INSTAGRAM_URL: string | null = null;
export const PRIVACY_URL: string | null = null;

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
  audience?: string;
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
    scope: 'Felnőtt-, gyermek- és ifjúságpszichológiai konzultáció',
    audience: 'Felnőtteknek, gyermekeknek és fiataloknak',
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
    description: 'Beszédközpontú órák diákoknak és felnőtteknek, nyelvvizsgára készülőknek is — a görcsös teljesítés helyett valódi kapcsolódással.',
    chips: ['beszédbátorság', 'munkahelyi angol', 'önazonos kommunikáció', 'nyelvvizsga-felkészítés'],
    price: PRICE_ENGLISH,
    ariaLabel: 'Érdeklődöm az angolórákról',
  },
];

export const faqs = [
  {
    question: 'Honnan tudhatom, melyik folyamat való nekem?',
    answer: 'Az első 20 perces beszélgetésen közösen ránézünk arra, miben vagy most, és mire lenne szükséged. Ha az angol és az önismeret egyszerre fontos, a két területet finoman össze is kapcsolhatjuk.',
  },
  {
    question: 'Mennyibe kerül egy alkalom?',
    answer: `Egy mentálhigiénés segítő beszélgetés ${PRICE_MENTAL}, egy angolóra ${PRICE_ENGLISH}.`,
  },
  {
    question: 'Online vagy személyesen találkozunk?',
    answer: 'Az alkalmak online zajlanak, így bárhonnan csatlakozhatsz egy nyugodt, zavartalan helyről. A személyes találkozás lehetőségéről az első beszélgetésen egyeztetünk.',
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

export const methodSteps = [
  { number: '01', title: 'Kapcsolódunk', text: 'Egy rövid online beszélgetésen megismerjük egymást és a kérdésedet.', word: 'hello' },
  { number: '02', title: 'Irányt találunk', text: 'Közösen megfogalmazzuk, miben szeretnél változást, és mi segíthet ebben.', word: 'notice' },
  { number: '03', title: 'Haladunk', text: 'A saját tempódban gyakorlunk, reflektálunk, és időről időre ránézünk a megtett útra.', word: 'grow' },
];

export const contactPromises = [
  { number: '01', title: 'Első beszélgetés', subline: '20 perc, online' },
  { number: '02', title: 'Válasz egy munkanapon belül', subline: 'e-mailben vagy telefonon' },
];

export const values = [
  { number: '01', label: ['Ítéletmentes', 'figyelem'] },
  { number: '02', label: ['Személyre szabott', 'folyamat'] },
  { number: '03', label: ['Gyakorlatias', 'eszközök'] },
  { number: '04', label: ['Humor és', 'könnyedség'] },
];

export const topics = ['Mentálhigiénés beszélgetés', 'Angolóra', 'Mindkettő', 'Egyéb'];
