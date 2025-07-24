import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './Input';
import { Search, Mail, Lock, User, DollarSign, Calendar, Mic } from 'lucide-react';
import { Button } from './Button';

const meta = {
  title: 'Design System/Input',
  component: Input,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'glass', 'fresh', 'warm'],
      description: 'Visual style variant of the input',
    },
    inputSize: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the input',
    },
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'tel', 'search', 'date'],
      description: 'Input type',
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the input',
    },
    isInvalid: {
      control: 'boolean',
      description: 'Shows invalid state',
    },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic variants
export const Default: Story = {
  args: {
    placeholder: 'Ingresá texto...',
    variant: 'default',
  },
};

export const Glass: Story = {
  args: {
    placeholder: 'Input con efecto glass',
    variant: 'glass',
  },
};

export const Fresh: Story = {
  args: {
    placeholder: 'Buscá frutas y verduras',
    variant: 'fresh',
  },
};

export const Warm: Story = {
  args: {
    placeholder: 'Buscá platos calientes',
    variant: 'warm',
  },
};

// Sizes
export const Sizes: Story = {
  render: () => (
    <div className="space-y-4 w-96">
      <Input inputSize="sm" placeholder="Small input" />
      <Input inputSize="md" placeholder="Medium input (default)" />
      <Input inputSize="lg" placeholder="Large input" />
    </div>
  ),
};

// With labels and helpers
export const WithLabel: Story = {
  args: {
    label: 'Nombre del ingrediente',
    placeholder: 'Ej: Tomate, Cebolla...',
    helper: 'Ingresá el nombre del producto que querés agregar',
  },
};

export const WithError: Story = {
  args: {
    label: 'Email',
    placeholder: 'tu@email.com',
    value: 'email-invalido',
    error: 'Por favor ingresá un email válido',
    isInvalid: true,
  },
};

// With icons
export const WithLeftIcon: Story = {
  args: {
    placeholder: 'Buscar recetas...',
    leftIcon: <Search />,
  },
};

export const WithRightIcon: Story = {
  args: {
    placeholder: 'Hablar para buscar',
    rightIcon: <Mic />,
    variant: 'fresh',
  },
};

export const WithBothIcons: Story = {
  args: {
    placeholder: 'Email',
    leftIcon: <Mail />,
    rightIcon: <User />,
    type: 'email',
  },
};

// With addons
export const WithLeftAddon: Story = {
  args: {
    placeholder: '0.00',
    leftAddon: '$',
    type: 'number',
  },
};

export const WithRightAddon: Story = {
  args: {
    placeholder: '1',
    rightAddon: 'kg',
    type: 'number',
  },
};

// Real use cases
export const SearchInput: Story = {
  render: () => (
    <div className="w-96">
      <Input
        placeholder="Buscar ingredientes, recetas o categorías..."
        leftIcon<Search />}
        variant="glass"
        className="pr-24"
      />
      <Button 
        variant="fresh" 
        size="sm" 
        className="absolute right-1 top-1/2 -translate-y-1/2"
        leftIcon={<Mic className="w-4 h-4" />}
      >
        Hablar
      </Button>
    </div>
  ),
};

export const LoginForm: Story = {
  render: () => (
    <div className="space-y-4 w-96">
      <Input
        label="Email"
        type="email"
        placeholder="tu@email.com"
        leftIcon={<Mail />}
      />
      <Input
        label="Contraseña"
        type="password"
        placeholder="••••••••"
        leftIcon={<Lock />}
        helper="Mínimo 8 caracteres"
      />
    </div>
  ),
};

export const IngredientInput: Story = {
  render: () => (
    <div className="space-y-4 w-96">
      <Input
        label="Ingrediente"
        placeholder="Nombre del ingrediente"
        variant="fresh"
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Cantidad"
          placeholder="0"
          rightAddon="kg"
          type="number"
          variant="fresh"
        />
        <Input
          label="Precio"
          placeholder="0.00"
          leftAddon="$"
          type="number"
          variant="fresh"
        />
      </div>
    </div>
  ),
};

// States
export const States: Story = {
  render: () => (
    <div className="space-y-4 w-96">
      <Input placeholder="Normal state" />
      <Input placeholder="Focused state (click me)" />
      <Input placeholder="Disabled state" disabled />
      <Input 
        placeholder="Error state" 
        error="Este campo es requerido"
        isInvalid 
      />
      <Input 
        placeholder="Success state" 
        helper="✓ Disponible"
        className="border-green-500 focus:border-green-500 focus:ring-green-200"
      />
    </div>
  ),
};

// Input types
export const InputTypes: Story = {
  render: () => (
    <div className="space-y-4 w-96">
      <Input type="text" label="Texto" placeholder="Texto normal" />
      <Input type="email" label="Email" placeholder="email@ejemplo.com" />
      <Input type="password" label="Contraseña" placeholder="••••••••" />
      <Input type="number" label="Número" placeholder="123" />
      <Input type="tel" label="Teléfono" placeholder="+54 11 1234-5678" />
      <Input 
        type="date" 
        label="Fecha de vencimiento" 
        leftIcon={<Calendar />}
      />
    </div>
  ),
};

// Interactive demo
export const Interactive: Story = {
  render: () => {
    const [value, setValue] = React.useState('');
    const [error, setError] = React.useState('');
    
    const validate = (val: string) => {
      if (val.length < 3) {
        setError('Mínimo 3 caracteres');
      } else {
        setError('');
      }
    };
    
    return (
      <div className="w-96">
        <Input
          label="Nombre del plato"
          placeholder="Ej: Milanesa napolitana"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            validate(e.target.value);
          }}
          error={error}
          isInvalid={!!error}
          helper={!error && value ? `${value.length} caracteres` : ''}
          variant="warm"
        />
        {value && !error && (
          <p className="mt-4 text-sm text-gray-600">
            Buscando recetas de: <strong>{value}</strong>
          </p>
        )}
      </div>
    );
  },
};