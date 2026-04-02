export interface LeaderboardEntry {
  id: string;
  rank: number;
  prenom: string;
  province: string;
  photo: string;
  ventesValidees: number;
  note: number;
  disqualified: boolean;
}

export const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { id: 'v2', rank: 1, prenom: 'Marie-Claire', province: 'Ngounié', photo: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&h=200&fit=crop&crop=face', ventesValidees: 847, note: 4.8, disqualified: false },
  { id: 'v4', rank: 2, prenom: 'Agathe', province: 'Ogooué-Maritime', photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face', ventesValidees: 723, note: 4.9, disqualified: false },
  { id: 'v8', rank: 3, prenom: 'Alphonsine', province: 'Woleu-Ntem', photo: 'https://images.unsplash.com/photo-1589156280159-27698a70f29e?w=200&h=200&fit=crop&crop=face', ventesValidees: 698, note: 4.7, disqualified: false },
  { id: 'v6', rank: 4, prenom: 'Félicité', province: 'Estuaire', photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face', ventesValidees: 612, note: 4.6, disqualified: false },
  { id: 'v9', rank: 5, prenom: 'Germaine', province: 'Haut-Ogooué', photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face', ventesValidees: 589, note: 4.5, disqualified: false },
  { id: 'v3', rank: 6, prenom: 'Pierre', province: 'Woleu-Ntem', photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face', ventesValidees: 534, note: 4.2, disqualified: false },
  { id: 'v5', rank: 7, prenom: 'Samuel', province: 'Haut-Ogooué', photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face', ventesValidees: 478, note: 3.9, disqualified: false },
  { id: 'v10', rank: 8, prenom: 'Paulette', province: 'Moyen-Ogooué', photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face', ventesValidees: 421, note: 4.4, disqualified: false },
  { id: 'v11', rank: 9, prenom: 'Robert', province: 'Nyanga', photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=face', ventesValidees: 387, note: 4.1, disqualified: false },
  { id: 'v1', rank: 10, prenom: 'Jean-Baptiste', province: 'Estuaire', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face', ventesValidees: 352, note: 4.5, disqualified: false },
];

export const CURRENT_USER_STATS = {
  userId: 'v1',
  rank: 10,
  ventesValidees: 352,
  objectifTop5: 589,
  ventesRestantes: 237,
  periodeDebut: '2026-01-01',
  periodeFin: '2026-12-31',
  litiges: 0,
  maxLitiges: 2,
};
