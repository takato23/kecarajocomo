import type { Meta, StoryObj } from '@storybook/react';
import { 
  MagnifyingGlassIcon,
  EnvelopeIcon,
  LockClosedIcon,
  UserIcon,
  CurrencyDollarIcon,
  CalendarIcon,
} from '@heroicons/react/24/solid';
import { useState } from 'react';

import { Input } from './Input';

const meta = {
  title: 'Design System/Primitives/Input',
  component: Input,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Campo de entrada con soporte para voz, iconos y validación.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'error', 'success'],
      description: 'Estado visual del input',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Tamaño del input',
    },
    withVoice: {
      control: 'boolean',
      description: 'Habilitar entrada de voz',
    },
    clearable: {
      control: 'boolean',
      description: 'Mostrar botón para limpiar',
    },
    disabled: {
      control: 'boolean',
      description: 'Estado deshabilitado',
    },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

// Casos básicos
export const Default: Story = {
  args: {
    placeholder: 'Escribe algo...',
  },
};

export const WithLabel: Story = {
  args: {
    label: 'Nombre del ingrediente',
    placeholder: 'Ej: Tomates',
  },
};

export const WithHint: Story = {
  args: {
    label: 'Cantidad',
    placeholder: '0',
    hint: 'Ingresa la cantidad en kilogramos',
  },
};

// Estados
export const ErrorState: Story = {
  args: {
    label: 'Email',
    placeholder: 'correo@ejemplo.com',
    value: 'correo-invalido',
    error: 'El formato del email no es válido',
  },
};

export const SuccessState: Story = {
  args: {
    label: 'Código de barras',
    placeholder: '000000000000',
    value: '759312458965',
    success: 'Producto encontrado: Leche Entera 1L',
  },
};

// Tamaños
export const Small: Story = {
  args: {
    size: 'sm',
    placeholder: 'Input pequeño',
  },
};

export const Medium: Story = {
  args: {
    size: 'md',
    placeholder: 'Input mediano',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    placeholder: 'Input grande',
  },
};

// Con iconos
export const WithLeftIcon: Story = {
  args: {
    placeholder: 'Buscar recetas...',
    leftIcon: <MagnifyingGlassIcon className="w-5 h-5" />,
  },
};

export const WithRightIcon: Story = {
  args: {
    placeholder: 'Precio',
    rightIcon: <CurrencyDollarIcon className="w-5 h-5" />,
  },
};

export const WithBothIcons: Story = {
  args: {
    placeholder: 'usuario@ejemplo.com',
    leftIcon: <EnvelopeIcon className="w-5 h-5" />,
    rightIcon: <UserIcon className="w-5 h-5" />,
  },
};

// Funcionalidades especiales
export const WithVoice: Story = {
  args: {
    label: 'Agregar ingrediente',
    placeholder: 'Habla o escribe...',
    withVoice: true,
  },
};

export const Clearable: Story = {
  args: {
    label: 'Búsqueda',
    placeholder: 'Buscar productos...',
    clearable: true,
    value: 'Manzanas rojas',
  },
};

export const VoiceAndClearable: Story = {
  args: {
    label: 'Nota de voz',
    placeholder: 'Habla o escribe tu nota...',
    withVoice: true,
    clearable: true,
  },
};

// Estados deshabilitados
export const Disabled: Story = {
  args: {
    placeholder: 'Campo deshabilitado',
    disabled: true,
    value: 'No se puede editar',
  },
};

export const DisabledWithValue: Story = {
  args: {
    label: 'Usuario',
    value: 'admin@kecarajocomer.com',
    disabled: true,
    leftIcon: <UserIcon className="w-5 h-5" />,
  },
};

// Casos de uso reales
export const SearchRecipes: Story = {
  name: 'Buscar recetas',
  args: {
    placeholder: 'Buscar recetas...',
    leftIcon: <MagnifyingGlassIcon className="w-5 h-5" />,
    clearable: true,
  },
};

export const AddIngredient: Story = {
  name: 'Agregar ingrediente',
  args: {
    label: 'Nuevo ingrediente',
    placeholder: 'Habla o escribe el nombre...',
    withVoice: true,
    clearable: true,
    hint: 'Puedes usar voz diciendo "Agregar 2 kilos de papas"',
  },
};

export const LoginEmail: Story = {
  name: 'Email de login',
  args: {
    label: 'Correo electrónico',
    type: 'email',
    placeholder: 'tu@correo.com',
    leftIcon: <EnvelopeIcon className="w-5 h-5" />,
    required: true,
  },
};

export const Password: Story = {
  name: 'Contraseña',
  args: {
    label: 'Contraseña',
    type: 'password',
    placeholder: '••••••••',
    leftIcon: <LockClosedIcon className="w-5 h-5" />,
    required: true,
  },
};

export const DatePicker: Story = {
  name: 'Selector de fecha',
  args: {
    label: 'Fecha de caducidad',
    type: 'date',
    leftIcon: <CalendarIcon className="w-5 h-5" />,
  },
};

// Ejemplo interactivo
export const InteractiveExample: Story = {
  name: 'Ejemplo interactivo',
  render: function Render() {
    const [value, setValue] = useState('');
    const [voiceResult, setVoiceResult] = useState('');
    
    return (
      <div className="space-y-4 w-80">
        <Input
          label="Campo interactivo"
          placeholder="Prueba todas las funciones..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          withVoice
          clearable
          onVoiceResult={(text) => setVoiceResult(text)}
          hint="Usa el micrófono o el botón de limpiar"
        />
        
        <div className="text-sm text-gray-600">
          <p>Valor actual: {value || '(vacío)'}</p>
          {voiceResult && <p>Último resultado de voz: {voiceResult}</p>}
        </div>
      </div>
    );
  },
};

// Formulario completo
export const FormExample: Story = {
  name: 'Ejemplo de formulario',
  render: () => (
    <form className="space-y-4 w-96">
      <Input
        label="Nombre del producto"
        placeholder="Ej: Leche descremada"
        required
        withVoice
      />
      
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Cantidad"
          placeholder="0"
          type="number"
          required
        />
        <Input
          label="Unidad"
          placeholder="kg, L, unidades..."
          required
        />
      </div>
      
      <Input
        label="Fecha de caducidad"
        type="date"
        leftIcon={<CalendarIcon className="w-5 h-5" />}
      />
      
      <Input
        label="Notas adicionales"
        placeholder="Información adicional..."
        clearable
      />
    </form>
  ),
};