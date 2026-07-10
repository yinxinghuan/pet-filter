import { PET_FILTER_CARTRIDGE } from '../cartridge';
import type { PetCategory, PetSpecies } from '../cartridge/types';

export type Pet = PetSpecies;
export type { PetCategory };

export const PETS: Pet[] = PET_FILTER_CARTRIDGE.speciesPack.species;

export function petById(id: string): Pet | undefined {
  return PETS.find((p) => p.id === id);
}

export const CATEGORY_LABEL: Record<PetCategory, string> =
  PET_FILTER_CARTRIDGE.speciesPack.categoryLabels;
