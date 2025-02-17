export type HazardType = 'fire' | 'electric' | 'toxic' | 'spike';

export interface HazardEffect {
  damage: number;
  duration: number;
  radius: number;
  particleEffect: string;
}

export interface HazardCombination {
  types: HazardType[];
  effect: HazardEffect;
} 