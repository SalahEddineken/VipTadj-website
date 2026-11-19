/**
 * VIP TADJ - Sartorial Color Naming & Perception Utilities
 * Accurately determines human-readable French color names from HEX / RGB values
 * using perceptual redmean color distance modeling.
 */

export interface NamedColor {
  hex: string;
  name: string;
  r: number;
  g: number;
  b: number;
}

// Curated luxury menswear palette with standard French sartorial naming
export const COLOR_PALETTE_BASE: Array<{ hex: string; name: string }> = [
  // Blacks & Charcoals
  { hex: '#000000', name: 'Noir Profond' },
  { hex: '#111111', name: 'Noir Ébène' },
  { hex: '#1C1C1C', name: 'Noir Satiné' },
  { hex: '#2B2B2B', name: 'Gris Anthracite Foncé' },
  { hex: '#36454F', name: 'Gris Anthracite' },
  { hex: '#4A4A4A', name: 'Gris Fumé' },
  { hex: '#5A5A5A', name: 'Gris Acier' },
  { hex: '#708090', name: 'Gris Ardoise' },
  { hex: '#808080', name: 'Gris Perle' },
  { hex: '#A9A9A9', name: 'Gris Souris' },
  { hex: '#C0C0C0', name: 'Gris Argent' },
  { hex: '#D3D3D3', name: 'Gris Clair' },
  { hex: '#E5E5E5', name: 'Gris Givré' },

  // Whites, Creams & Beiges
  { hex: '#FFFFFF', name: 'Blanc Optique' },
  { hex: '#F8F8F8', name: 'Blanc Cassé' },
  { hex: '#FFFDD0', name: 'Crème' },
  { hex: '#FFFFF0', name: 'Ivoire' },
  { hex: '#F5F5DC', name: 'Beige Écru' },
  { hex: '#E8DCC4', name: 'Lin Naturel' },
  { hex: '#E5D3B3', name: 'Sable' },
  { hex: '#D2B48C', name: 'Beige Tan' },

  // Browns, Camels & Leathers
  { hex: '#3B2F2F', name: 'Chocolat Noir' },
  { hex: '#5C4033', name: 'Chocolat' },
  { hex: '#8B4513', name: 'Marron Cognac' },
  { hex: '#A0522D', name: 'Sienne Havane' },
  { hex: '#6E473B', name: 'Marron Glacé' },
  { hex: '#C19A6B', name: 'Camel' },
  { hex: '#B8860B', name: 'Ocre Doré' },
  { hex: '#CD853F', name: 'Cuir Tabac' },
  { hex: '#D27D2D', name: 'Caramel Doré' },
  { hex: '#8B5A2B', name: 'Cuir Vintage' },

  // Blues
  { hex: '#051026', name: 'Bleu Nuit Profond' },
  { hex: '#0B1D3A', name: 'Bleu Nuit' },
  { hex: '#1B2A4A', name: 'Bleu Nuit Cérémonie' },
  { hex: '#002366', name: 'Bleu Marine Sombre' },
  { hex: '#1E3A8A', name: 'Bleu Marine' },
  { hex: '#000080', name: 'Bleu Sombre' },
  { hex: '#003399', name: 'Bleu Saphir' },
  { hex: '#1D4ED8', name: 'Bleu Royal' },
  { hex: '#2563EB', name: 'Bleu Impérial' },
  { hex: '#4169E1', name: 'Bleu Roi' },
  { hex: '#3B82F6', name: 'Bleu Azur' },
  { hex: '#0284C7', name: 'Bleu Céruléen' },
  { hex: '#0E7490', name: 'Bleu Pétrole' },
  { hex: '#0F766E', name: 'Bleu Canard' },
  { hex: '#008080', name: 'Sarcelle' },
  { hex: '#06B6D4', name: 'Turquoise' },
  { hex: '#38BDF8', name: 'Bleu Ciel' },
  { hex: '#7DD3FC', name: 'Bleu Glacier' },
  { hex: '#93C5FD', name: 'Bleu Pastel' },

  // Greens
  { hex: '#064E3B', name: 'Vert Forêt Profond' },
  { hex: '#0B5345', name: 'Vert Émeraude Sombre' },
  { hex: '#006400', name: 'Vert Bouteille' },
  { hex: '#14532D', name: 'Vert Sapin' },
  { hex: '#15803D', name: 'Vert Émeraude' },
  { hex: '#16A34A', name: 'Vert Anglais' },
  { hex: '#22C55E', name: 'Vert Vif' },
  { hex: '#3F4E24', name: 'Vert Kaki Foncé' },
  { hex: '#556B2F', name: 'Vert Kaki' },
  { hex: '#4D5D29', name: 'Vert Olive' },
  { hex: '#808000', name: 'Vert Bronze' },
  { hex: '#6B8E23', name: 'Vert Mousse' },
  { hex: '#2E8B57', name: 'Vert Marin' },
  { hex: '#8FBC8F', name: 'Vert Sauge' },
  { hex: '#84CC16', name: 'Vert Pistache' },
  { hex: '#98FF98', name: 'Vert Menthe' },

  // Yellows & Golds
  { hex: '#DAA520', name: 'Or Impérial' },
  { hex: '#FFD700', name: 'Doré / Or' },
  { hex: '#EAB308', name: 'Jaune Moutarde' },
  { hex: '#CA8A04', name: 'Ocre Jaune' },
  { hex: '#FACC15', name: 'Jaune Safran' },
  { hex: '#FDE047', name: 'Jaune Soleil' },
  { hex: '#FFFF00', name: 'Jaune Vif' },
  { hex: '#FEF08A', name: 'Jaune Pâle' },

  // Oranges, Rust & Terracotta
  { hex: '#B7410E', name: 'Rouille' },
  { hex: '#C2410C', name: 'Terracotta' },
  { hex: '#EA580C', name: 'Brique Cuite' },
  { hex: '#F97316', name: 'Orange Sanguine' },
  { hex: '#FFA500', name: 'Orange' },
  { hex: '#FF7F50', name: 'Corail' },

  // Reds, Burgundies & Bordeaux
  { hex: '#4A0404', name: 'Bordeaux Profond' },
  { hex: '#58111A', name: 'Lie de Vin' },
  { hex: '#722F37', name: 'Bordeaux Royal' },
  { hex: '#800000', name: 'Bordeaux' },
  { hex: '#8B0000', name: 'Rouge Grenat' },
  { hex: '#991B1B', name: 'Rouge Carmin' },
  { hex: '#B91C1C', name: 'Rouge Rubis' },
  { hex: '#DC2626', name: 'Rouge Vif' },
  { hex: '#FF0000', name: 'Rouge Écarlate' },

  // Purples & Violets
  { hex: '#2E0854', name: 'Aubergine Sombre' },
  { hex: '#3B0764', name: 'Aubergine' },
  { hex: '#4B0082', name: 'Indigo' },
  { hex: '#581C87', name: 'Violet Nuit' },
  { hex: '#6B21A8', name: 'Violet Impérial' },
  { hex: '#7E22CE', name: 'Violet' },
  { hex: '#800080', name: 'Violet Évêque' },
  { hex: '#9333EA', name: 'Violet Vif' },
  { hex: '#A855F7', name: 'Améthyste' },
  { hex: '#8A2BE2', name: 'Bleu Violet' },
  { hex: '#663399', name: 'Pourpre Royal' },
  { hex: '#BA55D3', name: 'Mauve Orchidée' },
  { hex: '#C084FC', name: 'Mauve Clair' },
  { hex: '#D8BFD8', name: 'Chardon' },
  { hex: '#E6E6FA', name: 'Lavande' },
  { hex: '#E9D5FF', name: 'Lilas' },

  // Pinks & Roses
  { hex: '#831843', name: 'Prune Sauvage' },
  { hex: '#9D174D', name: 'Framboise' },
  { hex: '#BE185D', name: 'Fuchsia' },
  { hex: '#DB2777', name: 'Rose Cerise' },
  { hex: '#E11D48', name: 'Rose Velours' },
  { hex: '#F43F5E', name: 'Rose Corail' },
  { hex: '#FB7185', name: 'Rose Saumon' },
  { hex: '#F472B6', name: 'Rose Bonbon' },
  { hex: '#FBCFE8', name: 'Rose Poudré' },
  { hex: '#E0BFB8', name: 'Vieux Rose' },
];

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  if (!hex || typeof hex !== 'string') return null;
  const cleanHex = hex.trim().replace(/^#/, '');
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16);
    const g = parseInt(cleanHex[1] + cleanHex[1], 16);
    const b = parseInt(cleanHex[2] + cleanHex[2], 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
    return { r, g, b };
  }
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
    return { r, g, b };
  }
  return null;
}

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const clamped = Math.max(0, Math.min(255, Math.round(n)));
    return clamped.toString(16).padStart(2, '0');
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Calculates human perceptual color distance using the redmean formula.
 */
function redmeanDistance(
  c1: { r: number; g: number; b: number },
  c2: { r: number; g: number; b: number }
): number {
  const rmean = (c1.r + c2.r) / 2;
  const dr = c1.r - c2.r;
  const dg = c1.g - c2.g;
  const db = c1.b - c2.b;
  const weightR = 2 + rmean / 256;
  const weightG = 4.0;
  const weightB = 2 + (255 - rmean) / 256;
  return Math.sqrt(weightR * dr * dr + weightG * dg * dg + weightB * db * db);
}

// Pre-computed RGB values for speed
const PRECOMPUTED_PALETTE: NamedColor[] = COLOR_PALETTE_BASE.map((item) => {
  const rgb = hexToRgb(item.hex)!;
  return {
    ...item,
    r: rgb.r,
    g: rgb.g,
    b: rgb.b,
  };
});

/**
 * Returns the best matching French sartorial color name for any given HEX code.
 */
export function getColorNameFromHex(hex: string): string {
  if (!hex || typeof hex !== 'string') return 'Noir';
  const rgb = hexToRgb(hex);
  if (!rgb) return 'Noir';

  let minDistance = Infinity;
  let bestName = 'Noir';

  for (const item of PRECOMPUTED_PALETTE) {
    const dist = redmeanDistance(rgb, item);
    if (dist < minDistance) {
      minDistance = dist;
      bestName = item.name;
    }
  }

  return bestName;
}

/**
 * Extracts the dominant non-background color from an image File on the client.
 */
export async function extractDominantColorFromFile(
  file: File
): Promise<{ hex: string; name: string } | null> {
  if (typeof window === 'undefined' || typeof document === 'undefined') return null;
  if (!file.type.startsWith('image/')) return null;

  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      try {
        const result = extractDominantColorFromImageElement(img);
        resolve(result);
      } catch {
        resolve(null);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(null);
    };

    img.src = objectUrl;
  });
}

/**
 * Extracts dominant color from an HTMLImageElement using canvas sampling.
 */
function extractDominantColorFromImageElement(
  img: HTMLImageElement
): { hex: string; name: string } | null {
  const canvas = document.createElement('canvas');
  const size = 50;
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Draw scaled down
  ctx.drawImage(img, 0, 0, size, size);
  const imageData = ctx.getImageData(0, 0, size, size);
  const data = imageData.data;

  let totalR = 0;
  let totalG = 0;
  let totalB = 0;
  let count = 0;

  // Sample pixels, skipping transparent or extreme white/black background pixels if possible
  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    if (alpha < 128) continue; // transparent

    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Exclude near pure white studio backdrops (brightness > 245)
    if (r > 245 && g > 245 && b > 245) continue;

    totalR += r;
    totalG += g;
    totalB += b;
    count++;
  }

  // If all pixels were excluded (e.g. all white or black), fallback to center crop sampling
  if (count === 0) {
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 128) continue;
      totalR += data[i];
      totalG += data[i + 1];
      totalB += data[i + 2];
      count++;
    }
  }

  if (count === 0) return null;

  const avgR = Math.round(totalR / count);
  const avgG = Math.round(totalG / count);
  const avgB = Math.round(totalB / count);
  const hex = rgbToHex(avgR, avgG, avgB);
  const name = getColorNameFromHex(hex);

  return { hex, name };
}
