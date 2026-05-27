import type { Pet } from './utils/pets';

export type Phase = 'frontispiece' | 'picker' | 'processing' | 'result' | 'wall';

export interface PetShot {
  /** Local id (cuid-ish), unique per save. */
  id: string;
  /** Pet catalog id. */
  petId: string;
  /** Pet display name copied for posterity (saved before user could
   *  re-render the result later in another locale). */
  petName: string;
  /** URL of the generated AI image (platform R2). */
  imageUrl: string;
  /** URL of the original selfie upload — kept so the user can see the
   *  before/after on their own gallery. Not shown to other users. */
  selfieUrl: string;
  createdAt: number;
}

export interface PetSave {
  shots: PetShot[];
  /** Album-Cover-Gen style reactions map: shotId → kinds. */
  reactions?: Record<string, ReactionKind[]>;
}

export type ReactionKind = 'heart' | 'fire' | 'mind' | 'eye';

export interface WallEntry {
  userId: string;
  userName?: string;
  userAvatarUrl?: string;
  shot: PetShot;
}

export type { Pet };
