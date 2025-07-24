import type { Meta, StoryObj } from '@storybook/react';
import { MoreVertical, Clock, Users, Star } from 'lucide-react';

import { Card, CardHeader, CardBody, CardFooter } from './Card';
import { Button } from './Button';

const meta = {
  title: 'Design System/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'glass', 'glass-interactive', 'fresh', 'warm', 'rich', 'golden'],
      description: 'Visual style variant of the card',
    },
    padding: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg', 'xl'],
      description: 'Padding size of the card',
    },
    hover: {
      control: 'boolean',
      description: 'Adds hover lift effect',
    },
    glow: {
      control: 'boolean',
      description: 'Adds glow effect',
    },
    blur: {
      control: 'boolean',
      description: 'Adds backdrop blur effect',
    },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic variants
export const Default: Story = {
  args: {
    children: (
      <div>
        <h3 className="text-lg font-semibold mb-2">Default Card</h3>
        <p className="text-gray-600">This is a basic card with default styling.</p>
      </div>
    ),
    variant: 'default',
  },
};

export const Glass: Story = {
  args: {
    children: (
      <div>
        <h3 className="text-lg font-semibold mb-2">Glass Card</h3>
        <p className="text-gray-600">This card has a glass morphism effect.</p>
      </div>
    ),
    variant: 'glass',
  },
};

export const GlassInteractive: Story = {
  args: {
    children: (
      <div>
        <h3 className="text-lg font-semibold mb-2">Interactive Glass Card</h3>
        <p className="text-gray-600">Click me! I have interactive hover effects.</p>
      </div>
    ),
    variant: 'glass-interactive',
    hover: true,
  },
};

// Food theme variants
export const FoodThemeCards: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4 w-96">
      <Card variant="fresh" glow>
        <h3 className="font-semibold text-green-700">Fresh</h3>
        <p className="text-sm text-gray-600 mt-1">For vegetables and salads</p>
      </Card>
      <Card variant="warm" glow>
        <h3 className="font-semibold text-orange-700">Warm</h3>
        <p className="text-sm text-gray-600 mt-1">For hot dishes and comfort food</p>
      </Card>
      <Card variant="rich" glow>
        <h3 className="font-semibold text-red-700">Rich</h3>
        <p className="text-sm text-gray-600 mt-1">For meats and hearty meals</p>
      </Card>
      <Card variant="golden" glow>
        <h3 className="font-semibold text-yellow-700">Golden</h3>
        <p className="text-sm text-gray-600 mt-1">For baked goods and grains</p>
      </Card>
    </div>
  ),
};

// With Card components
export const WithCardComponents: Story = {
  render: () => (
    <Card className="w-96">
      <CardHeader 
        title="Milanesa a la Napolitana"
        subtitle="Receta tradicional argentina"
        action={
          <Button variant="ghost" size="sm" className="rounded-full aspect-square">
            <MoreVertical className="w-4 h-4" />
          </Button>
        }
      />
      <CardBody>
        <p className="mb-4">
          Deliciosa milanesa cubierta con jamón, queso y salsa de tomate. 
          Un clásico de la cocina argentina que nunca falla.
        </p>
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            45 min
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            4 porciones
          </span>
          <span className="flex items-center gap-1 text-yellow-500">
            <Star className="w-4 h-4 fill-current" />
            4.8
          </span>
        </div>
      </CardBody>
      <CardFooter justify="between">
        <Button variant="ghost" size="sm">Cancelar</Button>
        <Button variant="primary" size="sm">Ver Receta</Button>
      </CardFooter>
    </Card>
  ),
};

// Different paddings
export const PaddingSizes: Story = {
  render: () => (
    <div className="space-y-4 w-96">
      <Card padding="none">
        <div className="p-4">No padding (custom content padding)</div>
      </Card>
      <Card padding="sm">Small padding</Card>
      <Card padding="md">Medium padding (default)</Card>
      <Card padding="lg">Large padding</Card>
      <Card padding="xl">Extra large padding</Card>
    </div>
  ),
};

// Interactive effects
export const HoverEffects: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4 w-96">
      <Card hover>
        <h3 className="font-semibold mb-2">Hover Lift</h3>
        <p className="text-sm text-gray-600">Hover to see lift effect</p>
      </Card>
      <Card variant="glass" hover glow>
        <h3 className="font-semibold mb-2">Hover Glow</h3>
        <p className="text-sm text-gray-600">Hover to see glow effect</p>
      </Card>
    </div>
  ),
};

// Real use case - Recipe Card
export const RecipeCard: Story = {
  render: () => (
    <Card variant="glass-interactive" hover className="w-80">
      <div className="aspect-video bg-gradient-to-br from-orange-400 to-red-500 rounded-lg mb-4" />
      <CardHeader 
        title="Empanadas de Carne"
        subtitle="30 min • 12 unidades"
      />
      <CardBody>
        <div className="flex items-center justify-between">
          <div className="flex -space-x-2">
            {['🥩', '🧅', '🥚', '🌶️'].map((emoji, i) => (
              <div key={i} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center border-2 border-white">
                <span className="text-sm">{emoji}</span>
              </div>
            ))}
          </div>
          <Button variant="fresh" size="sm" glow>
            Cocinar
          </Button>
        </div>
      </CardBody>
    </Card>
  ),
};

// Pantry Item Card
export const PantryItemCard: Story = {
  render: () => (
    <Card variant="warm" hover glow className="w-72">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-lg">Tomates</h3>
          <p className="text-sm text-gray-600">2 kg disponibles</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
              Vence en 3 días
            </span>
          </div>
        </div>
        <div className="text-3xl">🍅</div>
      </div>
    </Card>
  ),
};

// Loading state
export const LoadingCard: Story = {
  render: () => (
    <Card className="w-96">
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded"></div>
          <div className="h-3 bg-gray-200 rounded"></div>
          <div className="h-3 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    </Card>
  ),
};