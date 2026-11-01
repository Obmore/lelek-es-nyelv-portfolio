import type { Metadata } from 'next';
import PrivacyPage from '../components/PrivacyPage';

export const metadata: Metadata = {
  title: 'Adatkezelési tájékoztató – Juhász Nagy Anna',
  description: 'Adatkezelési tájékoztató és impresszum: hogyan kezelem a kapcsolatfelvételi űrlapon megadott adataidat.',
  openGraph: {
    title: 'Adatkezelési tájékoztató – Juhász Nagy Anna',
    description: 'Adatkezelési tájékoztató és impresszum: hogyan kezelem a kapcsolatfelvételi űrlapon megadott adataidat.',
    locale: 'hu_HU',
    type: 'website',
  },
};

export default PrivacyPage;
