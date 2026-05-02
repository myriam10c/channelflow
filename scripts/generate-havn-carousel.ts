import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

type Slide = { title: string; body: string; icon?: string };
type Post = {
  date: string;
  topic: string;
  hook: string;
  caption: string;
  hashtags: string[];
  slides: Slide[];
};

const themes = [
  'Optimiser les photos Airbnb luxe',
  'Créer une annonce qui convertit',
  'Tarification premium à Marrakech',
  'Expérience voyageur 5 étoiles',
  'Check-in sans friction',
  'Décoration et identité marocaine chic',
  'Gestion des avis clients',
  'Upsell services premium',
  'Saisonnalité et événements à Marrakech',
  'Automatiser la communication client',
];

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function makeSlides(topic: string): Slide[] {
  return [
    {
      title: `Le saviez-vous ?`,
      body: `${topic} : ce détail peut faire la différence entre un clic et une réservation.`,
    },
    {
      title: 'Pourquoi c’est important',
      body: 'Les voyageurs premium décident vite: image, confiance et promesse claire.',
      icon: 'shield',
    },
    {
      title: '3 actions concrètes',
      body: '1) Clarifier la promesse 2) Renforcer la preuve sociale 3) Soigner la cohérence visuelle.',
      icon: 'check',
    },
    {
      title: 'Version Havn Stays',
      body: 'Appliquer une DA beige/olive, typo élégante, ton expert et rassurant.',
      icon: 'sparkles',
    },
    {
      title: 'Call-to-action',
      body: 'Envie d’auditer votre annonce Airbnb luxe à Marrakech ? Écrivez “AUDIT”.',
    },
  ];
}

function generate(start: Date, days: number): Post[] {
  return Array.from({ length: days }).map((_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const topic = themes[i % themes.length];

    return {
      date: formatDate(d),
      topic,
      hook: `Airbnb luxe Marrakech: ${topic.toLowerCase()}`,
      caption:
        `Conseil du jour pour hôtes premium: ${topic}. ` +
        'Objectif: augmenter la valeur perçue et le taux de réservation.',
      hashtags: [
        '#AirbnbMarrakech',
        '#LocationLuxe',
        '#HavnStays',
        '#Hospitality',
        '#ShortTermRental',
      ],
      slides: makeSlides(topic),
    };
  });
}

const startDate = process.argv[2] ? new Date(process.argv[2]) : new Date();
const days = process.argv[3] ? Number(process.argv[3]) : 30;

if (Number.isNaN(startDate.getTime())) {
  throw new Error('Date invalide. Utilisez le format YYYY-MM-DD');
}
if (!Number.isInteger(days) || days <= 0) {
  throw new Error('Le nombre de jours doit être un entier positif.');
}

const posts = generate(startDate, days);
const outputDir = join(process.cwd(), 'content');
mkdirSync(outputDir, { recursive: true });
const outputFile = join(outputDir, `havn-carousel-${formatDate(startDate)}-${days}d.json`);
writeFileSync(outputFile, JSON.stringify(posts, null, 2), 'utf-8');

console.log(`✅ Généré: ${outputFile}`);
