// 支援監察嘅航空公司清單（mock provider 同未來真實 provider 共用）
export const AIRLINES = [
  { code: 'CX', name: 'Cathay Pacific', multiplier: 1.18 },
  { code: 'HX', name: 'Hong Kong Airlines', multiplier: 0.94 },
  { code: 'UO', name: 'HK Express', multiplier: 0.72 },
  { code: 'NH', name: 'ANA', multiplier: 1.28 },
  { code: 'JL', name: 'Japan Airlines', multiplier: 1.22 },
  { code: 'CI', name: 'China Airlines', multiplier: 1.0 },
  { code: 'BR', name: 'EVA Air', multiplier: 1.06 },
  { code: 'KE', name: 'Korean Air', multiplier: 1.12 },
  { code: 'SQ', name: 'Singapore Airlines', multiplier: 1.35 },
  { code: 'TR', name: 'Scoot', multiplier: 0.68 },
];

export function findAirline(code) {
  return AIRLINES.find((a) => a.code === code.toUpperCase());
}
