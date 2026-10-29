// Icons: lucide-react (shadcn/ui's default icon set), with brand logos from Tabler Icons (another of
// shadcn/ui's icon libraries), since lucide ships no brand logos. Both are 24px outline sets, so they match.
// Each is exported under the name the components use, sized to 1em so CSS controls size.
import type { LucideIcon, LucideProps } from "lucide-react";
import {
  ArrowRight as LArrowRight,
  ArrowUpRight as LArrowUpRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock as LClock,
  EyeOff as LEyeOff,
  Feather,
  Heart as LHeart,
  Lock as LLock,
  Mail as LMail,
  Menu as LMenu,
  MessageCircle,
  MessageSquare,
  MessagesSquare,
  Moon as LMoon,
  MoveRight,
  Package,
  Search as LSearch,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Sun as LSun,
  Tag as LTag,
  User as LUser,
  X,
  Zap,
  ZoomIn as LZoomIn,
  ZoomOut as LZoomOut,
} from "lucide-react";
import { IconBrandInstagram, IconBrandWhatsapp, type IconProps } from "@tabler/icons-react";
import type { ComponentType } from "react";

const icon = (I: LucideIcon) => {
  const Icon = (p: LucideProps) => <I size="1em" strokeWidth={1.6} aria-hidden {...p} />;
  Icon.displayName = I.displayName;
  return Icon;
};

export const ArrowRight = icon(LArrowRight);
export const ArrowUpRight = icon(LArrowUpRight);
export const Chevron = icon(ChevronDown);
export const ChevronNext = icon(ChevronRight);
export const ChevronPrev = icon(ChevronLeft);
export const Clock = icon(LClock);
export const EyeOff = icon(LEyeOff);
export const Butterfly = icon(Feather);
export const Heart = icon(LHeart);
export const Lock = icon(LLock);
export const Mail = icon(LMail);
export const Menu = icon(LMenu);
export const ChatBubble = icon(MessageCircle);
export const ChatSquare = icon(MessageSquare);
export const ChatDouble = icon(MessagesSquare);
export const Moon = icon(LMoon);
export const LongArrow = icon(MoveRight);
export const Box = icon(Package);
export const Search = icon(LSearch);
export const Shield = icon(ShieldCheck);
export const Bag = icon(ShoppingBag);
export const Sliders = icon(SlidersHorizontal);
export const Sparkle = icon(Sparkles);
export const Sun = icon(LSun);
export const Tag = icon(LTag);
export const User = icon(LUser);
export const Close = icon(X);
export const Bolt = icon(Zap);
export const ZoomIn = icon(LZoomIn);
export const ZoomOut = icon(LZoomOut);

const brand = (I: ComponentType<IconProps>) => {
  const Icon = (p: IconProps) => <I size="1em" stroke={1.6} aria-hidden {...p} />;
  Icon.displayName = I.displayName;
  return Icon;
};

export const WhatsApp = brand(IconBrandWhatsapp);
export const Instagram = brand(IconBrandInstagram);
