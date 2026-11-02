import { CONTACT_EMAIL } from '../content';

export type FormStatus = 'idle' | 'sending' | 'sent' | 'error' | 'uncertain';

/** Status line of the contact form; idle and sending show nothing. */
export function FormStatusText({ status }: { status: FormStatus }) {
  if (status === 'sent') return <>Köszönöm! Az üzeneted úton van Annához.</>;
  if (status === 'error') {
    return (
      <>
        Most nem sikerült elküldeni. Kérlek, próbáld újra később, vagy írj közvetlenül e-mailben:{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </>
    );
  }
  if (status === 'uncertain') {
    return (
      <>
        A visszaigazolás nem érkezett meg időben, de az üzeneted lehet, hogy mégis célba ért. Kérlek, ne küldd el azonnal újra, inkább írj
        közvetlenül e-mailben: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </>
    );
  }
  return null;
}
