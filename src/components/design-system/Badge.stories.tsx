import type { Meta, StoryObj } from '@storybook/react';
import { Clock, Star, AlertCircle, Check, TrendingUp, Flame } from 'lucide-react';

import { Badge } from './Badge';

const meta = {
  title: 'Design System/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'fresh', 'warm', 'rich', 'golden', 'neutral', 'success', 'warning', 'error', 'info'],
      description: 'Visual style variant of the badge',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the badge',
    },
    outline: {
      control: 'boolean',
      description: 'Use outline style instead of filled',
    },
    pill: {
      control: 'boolean',
      description: 'Use pill shape (fully rounded)',
    },
    removable: {
      control: 'boolean',
      description: 'Show remove button',
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic variants
export const Default: Story = {
  args: {
    children: 'Default',
    variant: 'default',
  },
};

// Food theme variants
export const FoodThemes: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="fresh">Verduras</Badge>
      <Badge variant="warm">Caliente</Badge>
      <Badge variant="rich">Carnes</Badge>
      <Badge variant="golden">Panadería</Badge>
    </div>
  ),
};

// Semantic variants
export const SemanticVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="success">Disponible</Badge>
      <Badge variant="warning">Por vencer</Badge>
      <Badge variant="error">Vencido</Badge>
      <Badge variant="info">Información</Badge>
      <Badge variant="neutral">Neutral</Badge>
    </div>
  ),
};

// Sizes
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Badge size="sm">Small</Badge>
      <Badge size="md">Medium</Badge>
      <Badge size="lg">Large</Badge>
    </div>
  ),
};

// Outline style
export const OutlineStyle: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="fresh" outline>Verduras</Badge>
      <Badge variant="warm" outline>Caliente</Badge>
      <Badge variant="rich" outline>Carnes</Badge>
      <Badge variant="golden" outline>Panadería</Badge>
    </div>
  ),
};

// Pill shape
export const PillShape: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge pill>Default Pill</Badge>
      <Badge variant="fresh" pill>Fresh Pill</Badge>
      <Badge variant="success" pill>Success Pill</Badge>
      <Badge variant="error" pill outline>Error Outline Pill</Badge>
    </div>
  ),
};

// With icons
export const WithIcons: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Badge leftIcon={<Clock />}>30 min</Badge>
        <Badge leftIcon={<Star />} variant="golden">Popular</Badge>
        <Badge leftIcon={<AlertCircle />} variant="warning">Atención</Badge>
        <Badge leftIcon={<Check />} variant="success">Listo</Badge>
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge rightIcon={<TrendingUp />} variant="info">Tendencia</Badge>
        <Badge rightIcon={<Flame />} variant="warm">Picante</Badge>
      </div>
    </div>
  ),
};

// Removable badges
export const Removable: Story = {
  render: () => {
    const [badges, setBadges] = React.useState([
      { id: 1, text: 'Tomate', variant: 'fresh' as const },
      { id: 2, text: 'Cebolla', variant: 'fresh' as const },
      { id: 3, text: 'Ajo', variant: 'warm' as const },
      { id: 4, text: 'Pimiento', variant: 'warm' as const },
    ]);

    return (
      <div className="flex flex-wrap gap-2">
        {badges.map((badge) => (
          <Badge
            key={badge.id}
            variant={badge.variant}
            removable
            onRemove={() => setBadges(badges.filter(b => b.id !== badge.id))}
          >
            {badge.text}
          </Badge>
        ))}
      </div>
    );
  },
};

// Real use cases
export const IngredientTags: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold mb-2">Ingredientes seleccionados:</h3>
        <div className="flex flex-wrap gap-2">
          <Badge variant="fresh" removable>🥕 Zanahoria</Badge>
          <Badge variant="fresh" removable>🥬 Lechuga</Badge>
          <Badge variant="rich" removable>🥩 Carne vacuna</Badge>
          <Badge variant="golden" removable>🍞 Pan integral</Badge>
        </div>
      </div>
    </div>
  ),
};

export const RecipeAttributes: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="success" leftIcon={<Check />}>Vegetariano</Badge>
      <Badge variant="info" leftIcon={<Clock />}>30 min</Badge>
      <Badge variant="warning" leftIcon={<Flame />}>Picante</Badge>
      <Badge variant="golden" leftIcon={<Star />}>4.8</Badge>
      <Badge variant="neutral" pill>4 porciones</Badge>
    </div>
  ),
};

export const InventoryStatus: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <span className="text-sm">Tomates:</span>
        <Badge variant="success">En stock</Badge>
        <Badge variant="default" outline>2 kg</Badge>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm">Leche:</span>
        <Badge variant="warning">Por vencer</Badge>
        <Badge variant="default" outline>3 días</Badge>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm">Yogurt:</span>
        <Badge variant="error">Vencido</Badge>
        <Badge variant="default" outline>Hace 2 días</Badge>
      </div>
    </div>
  ),
};

export const CategoryBadges: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4">
      <div className="p-4 border rounded-lg">
        <h3 className="font-semibold mb-2">Categorías de productos</h3>
        <div className="flex flex-wrap gap-2">
          <Badge variant="fresh" pill>Frutas y Verduras</Badge>
          <Badge variant="rich" pill>Carnes</Badge>
          <Badge variant="golden" pill>Panadería</Badge>
          <Badge variant="neutral" pill>Lácteos</Badge>
        </div>
      </div>
      <div className="p-4 border rounded-lg">
        <h3 className="font-semibold mb-2">Filtros activos</h3>
        <div className="flex flex-wrap gap-2">
          <Badge removable outline>Precio &lt; $500</Badge>
          <Badge removable outline>En oferta</Badge>
          <Badge removable outline>Orgánico</Badge>
          <Badge removable outline>Sin TACC</Badge>
        </div>
      </div>
    </div>
  ),
};