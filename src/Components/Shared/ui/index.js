/**
 * Shared UI kit — standardized, animated building blocks used across every role
 * and page. Import from here:
 *
 *   import { PageHeader, PageHero, MotionList, MotionItem, EmptyState } from "../../Shared/ui";
 */
export { default as PageHeader } from "./PageHeader";
export { default as PageHero } from "./PageHero";
export { default as StatPill } from "./StatPill";
export { default as EmptyState } from "./EmptyState";
export { default as ErrorState } from "./ErrorState";
export { default as SectionHeader } from "./SectionHeader";
export { LoadingScreen, ErrorScreen } from "./StateScreens";
export {
  getErrorInfo,
  getErrorMessage,
  getErrorKind,
  throwForStatus,
  ERROR_KIND,
} from "../../../lib/errorMessage";
export {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonFeed,
  SkeletonRow,
  SkeletonList,
  SkeletonGrid,
} from "./Skeleton";
export {
  MotionList,
  MotionItem,
  Reveal,
  fadeIn,
  riseIn,
  scaleIn,
  slideInLeft,
  staggerContainer,
  staggerItem,
  motion,
  useReducedMotion,
} from "./motion";
export { SECTION_THEME, getSectionTheme } from "../../../constants/uiTheme";
