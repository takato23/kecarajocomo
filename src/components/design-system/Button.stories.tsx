import type { Meta, StoryObj } from '@storybook/react';
import { ShoppingCart, Heart, Download, ChevronRight, Mic } from 'lucide-react';

import { Button } from './Button';

const meta = {
  title: 'Design System/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'glass', 'fresh', 'warm', 'rich', 'golden'],
      description: 'Visual style variant of the button',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
      description: 'Size of the button',
    },
    loading: {
      control: 'boolean',
      description: 'Shows loading spinner',
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the button',
    },
    fullWidth: {
      control: 'boolean',
      description: 'Makes button full width',
    },
    glow: {
      control: 'boolean',
      description: 'Adds glow effect to button',
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic variants
export const Primary: Story = {
  args: {
    children: 'Primary Button',
    variant: 'primary',
  },
};

export const Secondary: Story = {
  args: {
    children: 'Secondary Button',
    variant: 'secondary',
  },
};

export const Ghost: Story = {
  args: {
    children: 'Ghost Button',
    variant: 'ghost',
  },
};

export const Glass: Story = {
  args: {
    children: 'Glass Button',
    variant: 'glass',
  },
};

// Food theme variants
export const Fresh: Story = {
  args: {
    children: 'Fresh Button',
    variant: 'fresh',
    glow: true,
  },
};

export const Warm: Story = {
  args: {
    children: 'Warm Button',
    variant: 'warm',
    glow: true,
  },
};

export const Rich: Story = {
  args: {
    children: 'Rich Button',
    variant: 'rich',
    glow: true,
  },
};

export const Golden: Story = {
  args: {
    children: 'Golden Button',
    variant: 'golden',
    glow: true,
  },
};

// Sizes
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
      <Button size="xl">Extra Large</Button>
    </div>
  ),
};

// With Icons
export const WithLeftIcon: Story = {
  args: {
    children: 'Add to Cart',
    leftIcon: <ShoppingCart className="w-4 h-4" />,
    variant: 'primary',
  },
};

export const WithRightIcon: Story = {
  args: {
    children: 'Continue',
    rightIcon: <ChevronRight className="w-4 h-4" />,
    variant: 'primary',
  },
};

export const WithBothIcons: Story = {
  args: {
    children: 'Download Recipe',
    leftIcon: <Download className="w-4 h-4" />,
    rightIcon: <ChevronRight className="w-4 h-4" />,
    variant: 'secondary',
  },
};

// States
export const Loading: Story = {
  args: {
    children: 'Loading...',
    loading: true,
    variant: 'primary',
  },
};

export const Disabled: Story = {
  args: {
    children: 'Disabled Button',
    disabled: true,
    variant: 'primary',
  },
};

// Special Cases
export const FullWidth: Story = {
  args: {
    children: 'Full Width Button',
    fullWidth: true,
    variant: 'primary',
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
};

export const IconOnly: Story = {
  args: {
    children: <Heart className="w-5 h-5" />,
    variant: 'ghost',
    size: 'sm',
    className: 'rounded-full aspect-square',
  },
};

// Real Use Cases
export const VoiceButton: Story = {
  args: {
    children: 'Hablar',
    leftIcon: <Mic className="w-4 h-4" />,
    variant: 'fresh',
    glow: true,
  },
};

export const FavoriteButton: Story = {
  args: {
    children: <Heart className="w-5 h-5" />,
    variant: 'ghost',
    size: 'sm',
    className: 'rounded-full aspect-square hover:text-red-500',
  },
};

// Interactive Demo
export const Interactive: Story = {
  render: () => {
    return (
      <div className="space-y-8">
        <div>
          <h3 className="text-lg font-semibold mb-4">Click to see hover effects</h3>
          <div className="flex flex-wrap gap-4">
            <Button variant="primary" glow>Primary with Glow</Button>
            <Button variant="fresh" glow>Fresh with Glow</Button>
            <Button variant="warm" glow>Warm with Glow</Button>
            <Button variant="glass">Glass Effect</Button>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-4">Different states</h3>
          <div className="flex flex-wrap gap-4">
            <Button>Normal</Button>
            <Button loading>Loading</Button>
            <Button disabled>Disabled</Button>
          </div>
        </div>
      </div>
    );
  },
};