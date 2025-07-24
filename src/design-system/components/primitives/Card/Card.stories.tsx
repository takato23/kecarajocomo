import type { Meta, StoryObj } from '@storybook/react';
import {
  ClockIcon,
  FireIcon,
  HeartIcon,
  StarIcon,
  UserGroupIcon,
} from '@heroicons/react/24/solid';

import { Button } from '../Button';
import { Input } from '../Input';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardImage,
} from './Card';


const meta = {
  title: 'Design System/Primitives/Card',
  component: Card,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Componente Card versátil para agrupar contenido relacionado.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'elevated', 'ghost', 'glass'],
      description: 'Estilo visual de la tarjeta',
    },
    padding: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg', 'xl'],
      description: 'Espaciado interno',
    },
    interactive: {
      control: 'boolean',
      description: 'Hace la tarjeta interactiva',
    },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

// Variantes básicas
export const Default: Story = {
  args: {
    children: (
      <div>
        <CardHeader>
          <CardTitle>Tarjeta por defecto</CardTitle>
          <CardDescription>Esta es una tarjeta con estilo por defecto</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Contenido de la tarjeta</p>
        </CardContent>
      </div>
    ),
  },
};

export const Elevated: Story = {
  args: {
    variant: 'elevated',
    children: (
      <div>
        <CardHeader>
          <CardTitle>Tarjeta elevada</CardTitle>
          <CardDescription>Con sombra para mayor prominencia</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Esta tarjeta tiene una sombra que la eleva del fondo</p>
        </CardContent>
      </div>
    ),
  },
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: (
      <div>
        <CardHeader>
          <CardTitle>Tarjeta fantasma</CardTitle>
          <CardDescription>Sutil, con fondo gris claro</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Ideal para contenido secundario</p>
        </CardContent>
      </div>
    ),
  },
};

export const Glass: Story = {
  args: {
    variant: 'glass',
    children: (
      <div>
        <CardHeader>
          <CardTitle>Tarjeta glassmorphism</CardTitle>
          <CardDescription>Con efecto de vidrio esmerilado</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Perfecta para interfaces modernas</p>
        </CardContent>
      </div>
    ),
  },
};

// Tarjeta interactiva
export const Interactive: Story = {
  args: {
    interactive: true,
    onClick: () => alert('Tarjeta clickeada!'),
    children: (
      <div>
        <CardHeader>
          <CardTitle>Tarjeta interactiva</CardTitle>
          <CardDescription>Haz clic en cualquier parte</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Esta tarjeta responde al hover y al clic</p>
        </CardContent>
      </div>
    ),
  },
};

// Casos de uso reales

// Tarjeta de receta
export const RecipeCard: Story = {
  name: 'Tarjeta de receta',
  render: () => (
    <Card className="w-80">
      <CardImage
        src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400"
        alt="Pizza Margherita"
        height={200}
      />
      <CardHeader>
        <CardTitle>Pizza Margherita</CardTitle>
        <CardDescription>Receta italiana clásica</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <ClockIcon className="w-4 h-4" />
            <span>30 min</span>
          </div>
          <div className="flex items-center gap-1">
            <UserGroupIcon className="w-4 h-4" />
            <span>4 porciones</span>
          </div>
          <div className="flex items-center gap-1">
            <FireIcon className="w-4 h-4" />
            <span>320 kcal</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="gap-2">
        <Button size="sm" className="flex-1">Ver receta</Button>
        <Button size="sm" variant="ghost">
          <HeartIcon className="w-4 h-4" />
        </Button>
      </CardFooter>
    </Card>
  ),
};

// Tarjeta de ingrediente en despensa
export const PantryItemCard: Story = {
  name: 'Item de despensa',
  render: () => (
    <Card className="w-80" variant="elevated">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Tomates</CardTitle>
            <CardDescription>Verduras</CardDescription>
          </div>
          <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full">
            Caduca en 3 días
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Cantidad:</span>
            <span className="font-medium">2.5 kg</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Ubicación:</span>
            <span className="font-medium">Refrigerador</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Agregado:</span>
            <span className="font-medium">Hace 5 días</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="gap-2">
        <Button size="sm" variant="outline" className="flex-1">Editar</Button>
        <Button size="sm" variant="danger">Eliminar</Button>
      </CardFooter>
    </Card>
  ),
};

// Tarjeta de estadística
export const StatCard: Story = {
  name: 'Tarjeta de estadística',
  render: () => (
    <Card className="w-64">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Items en despensa</p>
            <p className="text-3xl font-bold text-gray-900">47</p>
            <p className="text-xs text-green-600 mt-1">+12% esta semana</p>
          </div>
          <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
            <ShoppingCartIcon className="w-6 h-6 text-orange-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  ),
};

// Tarjeta de formulario
export const FormCard: Story = {
  name: 'Formulario en tarjeta',
  render: () => (
    <Card className="w-96" variant="elevated">
      <CardHeader>
        <CardTitle>Agregar nuevo ingrediente</CardTitle>
        <CardDescription>
          Completa los datos para agregar un item a tu despensa
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4">
          <Input
            label="Nombre"
            placeholder="Ej: Manzanas"
            withVoice
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Cantidad"
              placeholder="0"
              type="number"
            />
            <Input
              label="Unidad"
              placeholder="kg"
            />
          </div>
          <Input
            label="Fecha de caducidad"
            type="date"
          />
        </form>
      </CardContent>
      <CardFooter className="gap-2 justify-end">
        <Button variant="ghost">Cancelar</Button>
        <Button>Agregar</Button>
      </CardFooter>
    </Card>
  ),
};

// Tarjeta con calificación
export const RatingCard: Story = {
  name: 'Tarjeta con calificación',
  render: () => (
    <Card className="w-80" interactive>
      <CardHeader>
        <CardTitle>Pasta Carbonara</CardTitle>
        <div className="flex items-center gap-1 mt-1">
          {[...Array(5)].map((_, i) => (
            <StarIcon
              key={i}
              className={cn(
                'w-4 h-4',
                i < 4 ? 'text-yellow-400' : 'text-gray-300'
              )}
            />
          ))}
          <span className="text-sm text-gray-600 ml-1">(4.5)</span>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600">
          Deliciosa receta italiana con panceta, huevo y queso parmesano.
          Perfecta para una cena rápida.
        </p>
      </CardContent>
    </Card>
  ),
};

// Múltiples tamaños de padding
export const PaddingSizes: Story = {
  name: 'Tamaños de padding',
  render: () => (
    <div className="space-y-4">
      {(['none', 'sm', 'md', 'lg', 'xl'] as const).map((padding) => (
        <Card key={padding} padding={padding}>
          <p className="text-sm">Padding: {padding}</p>
        </Card>
      ))}
    </div>
  ),
};

// Composición compleja
export const ComplexComposition: Story = {
  name: 'Composición compleja',
  render: () => (
    <Card className="w-96" variant="elevated">
      <CardImage
        src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400"
        alt="Ensalada saludable"
        height={240}
      />
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Plan Semanal Saludable</CardTitle>
            <CardDescription>7 días de comidas balanceadas</CardDescription>
          </div>
          <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">
            Activo
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Calorías diarias:</span>
            <span className="font-medium">1,800 - 2,000</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Comidas preparadas:</span>
            <span className="font-medium">12 de 21</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-orange-500 h-2 rounded-full" style={{ width: '57%' }} />
          </div>
        </div>
      </CardContent>
      <CardFooter className="gap-2">
        <Button className="flex-1">Ver plan completo</Button>
        <Button variant="ghost">Editar</Button>
      </CardFooter>
    </Card>
  ),
};

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}