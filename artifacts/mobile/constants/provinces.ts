import { Province } from '@/types';

export const PROVINCES: Province[] = [
  'Estuaire',
  'Haut-Ogooué',
  'Moyen-Ogooué',
  'Ngounié',
  'Nyanga',
  'Ogooué-Ivindo',
  'Ogooué-Lolo',
  'Ogooué-Maritime',
  'Woleu-Ntem',
];

export const PROVINCE_CITIES: Record<Province, string[]> = {
  'Estuaire': ['Libreville', 'Owendo', 'Akanda', 'Ntoum'],
  'Haut-Ogooué': ['Franceville', 'Moanda', 'Mounana'],
  'Moyen-Ogooué': ['Lambaréné', 'Ndjolé'],
  'Ngounié': ['Mouila', 'Ndendé', 'Fougamou'],
  'Nyanga': ['Tchibanga', 'Mayumba', 'Moabi'],
  'Ogooué-Ivindo': ['Makokou', 'Booué', 'Mékambo'],
  'Ogooué-Lolo': ['Koulamoutou', 'Lastoursville'],
  'Ogooué-Maritime': ['Port-Gentil', 'Gamba', 'Omboué'],
  'Woleu-Ntem': ['Oyem', 'Bitam', 'Minvoul', 'Mitzic'],
};
