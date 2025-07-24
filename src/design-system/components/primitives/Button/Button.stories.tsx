import type { Meta, StoryObj } from '@storybook/react';
import { 
  PlusIcon, 
  TrashIcon, 
  MicrophoneIcon, 
  ShoppingCartIcon,
  SparklesIcon,
  ArrowRightIcon 
} from '@heroicons/react/24/solid';

import { Button } from './Button';

const meta = {
  title: 'Design System/Primitives/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Botón base del sistema de diseño con múltiples variantes y estados.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'danger', 'outline'],
      description: 'Estilo visual del botón',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'icon'],
      description: 'Tamaño del botón',
    },
    isLoading: {
      control: 'boolean',
      description: 'Estado de carga',
    },
    disabled: {
      control: 'boolean',
      description: 'Estado deshabilitado',
    },
    fullWidth: {
      control: 'boolean',
      description: 'Ancho completo del contenedor',
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// Variantes básicas
export const Primary: Story = {
  args: {
    children: 'Agregar al carrito',
    variant: 'primary',
  },
};

export const Secondary: Story = {
  args: {
    children: 'Ver recetas',
    variant: 'secondary',
  },
};

export const Ghost: Story = {
  args: {
    children: 'Cancelar',
    variant: 'ghost',
  },
};

export const Danger: Story = {
  args: {
    children: 'Eliminar',
    variant: 'danger',
  },
};

export const Outline: Story = {
  args: {
    children: 'Más opciones',
    variant: 'outline',
  },
};

// Tamaños
export const Small: Story = {
  args: {
    children: 'Pequeño',
    size: 'sm',
  },
};

export const Medium: Story = {
  args: {
    children: 'Mediano',
    size: 'md',
  },
};

export const Large: Story = {
  args: {
    children: 'Grande',
    size: 'lg',
  },
};

// Estados
export const Loading: Story = {
  args: {
    children: 'Guardando',
    isLoading: true,
  },
};

export const Disabled: Story = {
  args: {
    children: 'No disponible',
    disabled: true,
  },
};

// Con iconos
export const WithLeftIcon: Story = {
  args: {
    children: 'Agregar ingrediente',
    leftIcon: <PlusIcon className="w-5 h-5" />,
  },
};

export const WithRightIcon: Story = {
  args: {
    children: 'Siguiente',
    rightIcon: <ArrowRightIcon className="w-5 h-5" />,
  },
};

export const WithBothIcons: Story = {
  args: {
    children: 'Generar con IA',
    leftIcon: <SparklesIcon className="w-5 h-5" />,
    rightIcon: <ArrowRightIcon className="w-5 h-5" />,
    variant: 'secondary',
  },
};

// Solo icono
export const IconOnly: Story = {
  args: {
    children: <MicrophoneIcon className="w-5 h-5" />,
    size: 'icon',
    variant: 'ghost',
    'aria-label': 'Activar micrófono',
  },
};

// Ancho completo
export const FullWidth: Story = {
  args: {
    children: 'Crear plan de comidas',
    fullWidth: true,
    leftIcon: <SparklesIcon className="w-5 h-5" />,
  },
};

// Casos de uso reales
export const AddToCart: Story = {
  name: 'Agregar al carrito',
  args: {
    children: 'Agregar al carrito',
    leftIcon: <ShoppingCartIcon className="w-5 h-5" />,
    variant: 'primary',
  },
};

export const DeleteItem: Story = {
  name: 'Eliminar item',
  args: {
    children: 'Eliminar',
    leftIcon: <TrashIcon className="w-5 h-5" />,
    variant: 'danger',
    size: 'sm',
  },
};

export const VoiceInput: Story = {
  name: 'Entrada de voz',
  args: {
    children: <MicrophoneIcon className="w-6 h-6" />,
    size: 'icon',
    variant: 'secondary',
    'aria-label': 'Activar entrada de voz',
  },
};

// Grupo de botones
export const ButtonGroup: Story = {
  name: 'Grupo de botones',
  render: () => (
    <div className="flex gap-2">
      <Button variant="ghost">Cancelar</Button>
      <Button variant="primary">Guardar cambios</Button>
    </div>
  ),
};

// Todos los tamaños
export const AllSizes: Story = {
  name: 'Todos los tamaños',
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="sm">Pequeño</Button>
      <Button size="md">Mediano</Button>
      <Button size="lg">Grande</Button>
      <Button size="icon" aria-label="Icono">
        <PlusIcon className="w-5 h-5" />
      </Button>
    </div>
  ),
};

// Todas las variantes
export const AllVariants: Story = {
  name: 'Todas las variantes',
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="danger">Danger</Button>
        <Button variant="outline">Outline</Button>
      </div>
      <div className="flex gap-2">
        <Button variant="primary" disabled>Primary</Button>
        <Button variant="secondary" disabled>Secondary</Button>
        <Button variant="ghost" disabled>Ghost</Button>
        <Button variant="danger" disabled>Danger</Button>
        <Button variant="outline" disabled>Outline</Button>
      </div>
    </div>
  ),
};