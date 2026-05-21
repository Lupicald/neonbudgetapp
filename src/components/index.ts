// Editorial Carbon primitives (canonical)
export {
  Card, HeroCard, Pill, SumariButton, IconBtn,
  Amount, Money, SectionHeader, EditorialHeading, TopBar, CatAvatar,
  Progress, Ring, MiniBars, AreaChart, Text,
} from './SumariPrimitives';

export { FAB } from './FAB';
export { ErrorBoundary } from './ErrorBoundary';
export { FadeIn } from './FadeIn';
export { CategoryIcon } from './CategoryIcon';
export { SpendPlannerModal } from './SpendPlannerModal';

// Legacy shims — kept temporarily so unmigrated screens still mount.
// Slated for removal once every screen uses the editorial primitives directly.
export { GlassCard } from './GlassCard';
export { NeonButton } from './NeonButton';
export { NeonText } from './NeonText';
export { GlowInput } from './GlowInput';
export { ProgressBar } from './ProgressBar';
