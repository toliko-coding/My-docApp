import {
  Banknote,
  Briefcase,
  Building,
  Car,
  CircleParking,
  CreditCard,
  Droplet,
  Ellipsis,
  Flame,
  Fuel,
  GraduationCap,
  House,
  Key,
  Landmark,
  Repeat,
  Shield,
  ShoppingBag,
  Smartphone,
  Stethoscope,
  Tv,
  Wifi,
  Wrench,
  Zap,
  type LucideProps,
} from 'lucide-react-native';

// Keyed by the kebab-case `categories.icon` value seeded in supabase/migrations/0001_init.sql.
const ICONS = {
  zap: Zap,
  droplet: Droplet,
  flame: Flame,
  building: Building,
  home: House,
  wifi: Wifi,
  tv: Tv,
  smartphone: Smartphone,
  shield: Shield,
  key: Key,
  landmark: Landmark,
  'credit-card': CreditCard,
  banknote: Banknote,
  car: Car,
  fuel: Fuel,
  'parking-circle': CircleParking,
  'graduation-cap': GraduationCap,
  stethoscope: Stethoscope,
  repeat: Repeat,
  'shopping-bag': ShoppingBag,
  wrench: Wrench,
  briefcase: Briefcase,
  'more-horizontal': Ellipsis,
} satisfies Record<string, React.ComponentType<LucideProps>>;

interface CategoryIconProps extends LucideProps {
  icon: string | null | undefined;
}

export function CategoryIcon({ icon, ...props }: CategoryIconProps) {
  const Icon = (icon && ICONS[icon as keyof typeof ICONS]) || Ellipsis;
  return <Icon {...props} />;
}
