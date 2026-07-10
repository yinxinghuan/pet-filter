import type { ReactionKind } from '../types';

export type PetFilterLocale = 'en' | 'zh' | 'ja' | 'ko' | 'es';
export type PetCategory = 'everyday' | 'wholesome' | 'uncanny';

export interface PetSpecies {
  id: string;
  /** Display name (English, sentence case). */
  name: string;
  /** Italic binomial — Latin scientific name. */
  latin: string;
  /** Roman numeral plate number, for the plate header decoration. */
  plate: string;
  category: PetCategory;
  /** Img2img target description. */
  prompt: string;
  /** Hex tint that brushes picker tiles and result accents. */
  tint: string;
  /** One-line character read used by the archive and classifier. */
  character: string;
}

export interface PetSpeciesPack {
  categoryLabels: Record<PetCategory, string>;
  species: PetSpecies[];
}

export interface PetFilterCopyPack {
  /** Locale-keyed copy overrides. Missing keys fall back to the base i18n file. */
  overrides: Partial<Record<PetFilterLocale, Record<string, string>>>;
}

export interface PetFrontispieceDemoPortrait {
  asset: string;
  petId: string;
}

export interface PetFilterCartridge {
  id: string;
  gameId: string;
  routeFamily: 'identity-transformation-archive';
  identityLoop: {
    inputMode: 'portrait-reference';
    interpretationMode: 'species-classification';
    artifactMode: 'natural-history-plate';
    archiveMode: 'public-bestiary';
  };
  curator: {
    classifySystemIntro: string;
    outputRules: string;
    judgmentSystem: string;
  };
  imagePrompt: {
    hybridPrefix: string;
    hybridSuffixGuard: string;
    styleSuffix: string;
    variationAxes: {
      pose: string[];
      light: string[];
      composition: string[];
      render: string[];
    };
  };
  copy: PetFilterCopyPack;
  frontispiece: {
    liveRotationMs: number;
    demoRotationMs: number;
    liveAuthorFallback: string;
    selfAuthorName: string;
    demoPortraits: PetFrontispieceDemoPortrait[];
  };
  processing: {
    considerationRotationMs: number;
  };
  speciesPack: PetSpeciesPack;
  social: {
    reactionOrder: ReactionKind[];
    reactionAriaLabels: Record<ReactionKind, string>;
    reactionNotifyTemplates: Record<ReactionKind, string>;
    reactionImagePromptSuffix: string;
  };
  archive: {
    statsAriaLabel: string;
    statsLabels: {
      onFile: string;
      today: string;
      orders: string;
    };
    platePrefix: string;
    selfByline: string;
    authorPrefix: string;
    tileSelfByline: string;
    tileAuthorPrefix: string;
    authorFallback: string;
    relativeTime: {
      justNow: string;
      minuteAgoSuffix: string;
      hourAgoSuffix: string;
      dayAgoSuffix: string;
    };
  };
  locked: string[];
  cartridgeCanChange: string[];
}
