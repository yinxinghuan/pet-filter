import { naturalistCartridge } from './naturalist';
import { moonGardenCartridge } from './moonGarden';
import { generatedCartridge } from './generated';

export type { PetFilterCartridge } from './types';

function selectCartridge() {
  if (typeof window === 'undefined') return generatedCartridge ?? naturalistCartridge;
  const params = new URLSearchParams(window.location.search);
  const key = params.get('cartridge') ?? params.get('theme');
  if (key === 'moon-garden' || key === 'moonlit-garden') return moonGardenCartridge;
  if (generatedCartridge && (key === 'generated' || key === generatedCartridge.id)) return generatedCartridge;
  if (!key && generatedCartridge) return generatedCartridge;
  return naturalistCartridge;
}

export const PET_FILTER_CARTRIDGE = selectCartridge();
