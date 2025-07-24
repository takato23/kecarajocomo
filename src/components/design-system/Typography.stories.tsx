import type { Meta, StoryObj } from '@storybook/react';

import { Heading, Text, Caption, Label, Code } from './Typography';

const meta = {
  title: 'Design System/Typography',
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;

// Heading Stories
export const Headings: StoryObj = {
  render: () => (
    <div className="space-y-4">
      <Heading as="h1" size="4xl">Heading 4XL - Page Title</Heading>
      <Heading as="h2" size="3xl">Heading 3XL - Section Title</Heading>
      <Heading as="h3" size="2xl">Heading 2XL - Subsection</Heading>
      <Heading as="h4" size="xl">Heading XL - Card Title</Heading>
      <Heading as="h5" size="lg">Heading LG - List Title</Heading>
      <Heading as="h6" size="md">Heading MD - Small Title</Heading>
    </div>
  ),
};

export const HeadingWeights: StoryObj = {
  render: () => (
    <div className="space-y-4">
      <Heading weight="normal">Normal Weight Heading</Heading>
      <Heading weight="medium">Medium Weight Heading</Heading>
      <Heading weight="semibold">Semibold Weight Heading</Heading>
      <Heading weight="bold">Bold Weight Heading</Heading>
      <Heading weight="extrabold">Extrabold Weight Heading</Heading>
    </div>
  ),
};

export const HeadingColors: StoryObj = {
  render: () => (
    <div className="space-y-4">
      <Heading color="default">Default Color Heading</Heading>
      <Heading color="muted">Muted Color Heading</Heading>
      <Heading color="fresh">Fresh Color Heading</Heading>
      <Heading color="warm">Warm Color Heading</Heading>
      <Heading color="rich">Rich Color Heading</Heading>
      <Heading color="golden">Golden Color Heading</Heading>
    </div>
  ),
};

export const GradientHeadings: StoryObj = {
  render: () => (
    <div className="space-y-6">
      <Heading size="3xl" gradient>
        Gradient Heading - Fresh Theme
      </Heading>
      <Heading size="2xl" gradient color="warm">
        Gradient Heading - Warm Theme
      </Heading>
      <Heading size="xl" gradient color="rich">
        Gradient Heading - Rich Theme
      </Heading>
    </div>
  ),
};

// Text Stories
export const TextSizes: StoryObj = {
  render: () => (
    <div className="space-y-4">
      <Text size="xl">Extra Large Text - For important content</Text>
      <Text size="lg">Large Text - For emphasis</Text>
      <Text size="base">Base Text - Default body text</Text>
      <Text size="sm">Small Text - For secondary content</Text>
      <Text size="xs">Extra Small Text - For captions</Text>
    </div>
  ),
};

export const TextWeights: StoryObj = {
  render: () => (
    <div className="space-y-4">
      <Text weight="normal">Normal weight text for regular content</Text>
      <Text weight="medium">Medium weight text for slight emphasis</Text>
      <Text weight="semibold">Semibold weight text for strong emphasis</Text>
      <Text weight="bold">Bold weight text for maximum emphasis</Text>
    </div>
  ),
};

export const TextColors: StoryObj = {
  render: () => (
    <div className="space-y-4">
      <Text color="default">Default text color for primary content</Text>
      <Text color="muted">Muted text color for secondary content</Text>
      <Text color="fresh">Fresh theme text color</Text>
      <Text color="warm">Warm theme text color</Text>
      <Text color="rich">Rich theme text color</Text>
      <Text color="golden">Golden theme text color</Text>
      <Text color="error">Error text color for warnings</Text>
      <Text color="success">Success text color for confirmations</Text>
    </div>
  ),
};

// Caption Stories
export const Captions: StoryObj = {
  render: () => (
    <div className="space-y-4">
      <div>
        <Heading size="lg" className="mb-2">Recipe Title</Heading>
        <Caption>Posted 2 hours ago • 5 min read</Caption>
      </div>
      <div className="p-4 border rounded-lg">
        <Text>Main content goes here</Text>
        <Caption className="mt-2">*Terms and conditions apply</Caption>
      </div>
    </div>
  ),
};

// Label Stories
export const Labels: StoryObj = {
  render: () => (
    <div className="space-y-4">
      <div>
        <Label>Email Address</Label>
        <input type="email" className="mt-1 block w-full rounded-md border-gray-300" />
      </div>
      <div>
        <Label required>Full Name</Label>
        <input type="text" className="mt-1 block w-full rounded-md border-gray-300" />
      </div>
      <div>
        <Label>
          Password
          <Caption className="ml-1 inline">(min 8 characters)</Caption>
        </Label>
        <input type="password" className="mt-1 block w-full rounded-md border-gray-300" />
      </div>
    </div>
  ),
};

// Code Stories
export const CodeExamples: StoryObj = {
  render: () => (
    <div className="space-y-4">
      <Text>
        Use the <Code>npm run dev</Code> command to start the development server.
      </Text>
      <Text>
        The function <Code>calculateTotal()</Code> returns the sum of all items.
      </Text>
      <div className="p-4 bg-gray-100 rounded-lg">
        <Code block className="text-sm">
{`// Recipe calculation example
const servings = 4;
const ingredients = ['tomato', 'onion', 'garlic'];
const totalCost = calculateRecipeCost(ingredients, servings);`}
        </Code>
      </div>
    </div>
  ),
};

// Real Use Cases
export const RecipeCard: StoryObj = {
  render: () => (
    <div className="max-w-md p-6 bg-white rounded-xl shadow-lg">
      <Heading size="xl" weight="bold">Milanesa a la Napolitana</Heading>
      <Caption className="mb-4">Receta tradicional • 45 min</Caption>
      <Text className="mb-4">
        Deliciosa milanesa cubierta con jamón, queso y salsa de tomate. 
        Un clásico de la cocina argentina.
      </Text>
      <div className="flex items-center gap-4">
        <Label>Dificultad:</Label>
        <Text weight="semibold" color="warm">Media</Text>
      </div>
    </div>
  ),
};

export const IngredientList: StoryObj = {
  render: () => (
    <div className="max-w-sm">
      <Heading size="lg" weight="semibold" className="mb-4">
        Ingredientes Necesarios
      </Heading>
      <div className="space-y-3">
        {[
          { name: 'Milanesas de ternera', amount: '4 unidades' },
          { name: 'Queso mozzarella', amount: '200g' },
          { name: 'Jamón cocido', amount: '150g' },
          { name: 'Salsa de tomate', amount: '1 taza' },
        ].map((ingredient, i) => (
          <div key={i} className="flex justify-between items-center">
            <Text>{ingredient.name}</Text>
            <Text weight="semibold" color="fresh">{ingredient.amount}</Text>
          </div>
        ))}
      </div>
      <Caption className="mt-4">*Rinde para 4 porciones</Caption>
    </div>
  ),
};

export const KitchenTimer: StoryObj = {
  render: () => (
    <div className="text-center p-8 bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl">
      <Heading size="3xl" weight="bold" gradient>
        15:30
      </Heading>
      <Text size="lg" weight="medium" className="mt-2">
        Tiempo restante
      </Text>
      <Caption className="mt-1">Milanesas en el horno</Caption>
    </div>
  ),
};