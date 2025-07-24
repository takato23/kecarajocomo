import type { Meta, StoryObj } from '@storybook/react';

import { tokens } from './tokens';

const meta = {
  title: 'Design System/Design Tokens',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;

// Color Palette Story
export const ColorPalette: StoryObj = {
  render: () => (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold">Paleta de Colores</h1>
      
      {/* Brand Colors */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Brand Colors</h2>
        <div className="grid grid-cols-3 gap-4">
          <ColorSwatch 
            name="Primary" 
            value={tokens.colors.brand.primary}
            textColor="white"
          />
          <ColorSwatch 
            name="Secondary" 
            value={tokens.colors.brand.secondary}
            textColor="white"
          />
          <ColorSwatch 
            name="Accent" 
            value={tokens.colors.brand.accent}
            textColor="black"
          />
        </div>
      </section>

      {/* Semantic Colors */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Semantic Colors</h2>
        <div className="grid grid-cols-4 gap-4">
          <ColorSwatch 
            name="Success" 
            value={tokens.colors.semantic.success}
            textColor="white"
          />
          <ColorSwatch 
            name="Warning" 
            value={tokens.colors.semantic.warning}
            textColor="black"
          />
          <ColorSwatch 
            name="Error" 
            value={tokens.colors.semantic.error}
            textColor="white"
          />
          <ColorSwatch 
            name="Info" 
            value={tokens.colors.semantic.info}
            textColor="white"
          />
        </div>
      </section>

      {/* Neutral Colors */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Neutral Colors</h2>
        <div className="grid grid-cols-5 gap-4">
          {Object.entries(tokens.colors.neutral).map(([key, value]) => (
            <ColorSwatch 
              key={key}
              name={`Neutral ${key}`}
              value={value}
              textColor={parseInt(key) >= 500 ? 'white' : 'black'}
            />
          ))}
        </div>
      </section>

      {/* Food Theme Colors */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Food Theme Colors</h2>
        {Object.entries(tokens.colors.food).map(([theme, colors]) => (
          <div key={theme} className="mb-6">
            <h3 className="text-lg font-medium mb-3 capitalize">{theme}</h3>
            <div className="grid grid-cols-10 gap-2">
              {Object.entries(colors).map(([shade, value]) => (
                <ColorSwatch 
                  key={`${theme}-${shade}`}
                  name={shade}
                  value={value}
                  textColor={parseInt(shade) >= 500 ? 'white' : 'black'}
                  small
                />
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  ),
};

// Typography Story
export const Typography: StoryObj = {
  render: () => (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold">Tipografía</h1>
      
      {/* Font Sizes */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Font Sizes</h2>
        <div className="space-y-4">
          {Object.entries(tokens.typography.fontSize).map(([key, value]) => (
            <div key={key} className="flex items-baseline gap-4">
              <span className="text-sm text-gray-500 w-16">{key}</span>
              <span className="text-xs text-gray-400 w-20">{value}</span>
              <span style={{ fontSize: value }}>
                The quick brown fox jumps over the lazy dog
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Font Weights */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Font Weights</h2>
        <div className="space-y-4">
          {Object.entries(tokens.typography.fontWeight).map(([key, value]) => (
            <div key={key} className="flex items-center gap-4">
              <span className="text-sm text-gray-500 w-24">{key}</span>
              <span className="text-xs text-gray-400 w-12">{value}</span>
              <span style={{ fontWeight: value }} className="text-lg">
                The quick brown fox jumps over the lazy dog
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Typography Styles */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Typography Styles</h2>
        
        <div className="space-y-6">
          {/* Display */}
          <div>
            <h3 className="text-lg font-medium mb-3">Display</h3>
            {Object.entries(tokens.typographyStyles.display).map(([key, style]) => (
              <div key={key} className="mb-4">
                <span className="text-sm text-gray-500">{key}</span>
                <div style={style}>Display {key}</div>
              </div>
            ))}
          </div>

          {/* Headings */}
          <div>
            <h3 className="text-lg font-medium mb-3">Headings</h3>
            {Object.entries(tokens.typographyStyles.heading).map(([key, style]) => (
              <div key={key} className="mb-3">
                <span className="text-sm text-gray-500">{key.toUpperCase()}</span>
                <div style={style}>Heading Level {key.slice(1)}</div>
              </div>
            ))}
          </div>

          {/* Body */}
          <div>
            <h3 className="text-lg font-medium mb-3">Body</h3>
            {Object.entries(tokens.typographyStyles.body).map(([key, style]) => (
              <div key={key} className="mb-3">
                <span className="text-sm text-gray-500">Body {key}</span>
                <div style={style}>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
                  Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  ),
};

// Spacing Story
export const Spacing: StoryObj = {
  render: () => (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold">Espaciado</h1>
      
      {/* Base Spacing Scale */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Base Spacing Scale</h2>
        <div className="space-y-2">
          {Object.entries(tokens.spacing).map(([key, value]) => (
            <div key={key} className="flex items-center gap-4">
              <span className="text-sm text-gray-500 w-12">{key}</span>
              <span className="text-xs text-gray-400 w-20">{value}</span>
              <div 
                className="bg-purple-500 h-8"
                style={{ width: value }}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Layout Spacing */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Layout Spacing Presets</h2>
        {Object.entries(tokens.layoutSpacing).map(([category, values]) => (
          <div key={category} className="mb-6">
            <h3 className="text-lg font-medium mb-3 capitalize">{category}</h3>
            <div className="space-y-2">
              {Object.entries(values).map(([key, value]) => (
                <div key={key} className="flex items-center gap-4">
                  <span className="text-sm text-gray-500 w-20">{key}</span>
                  <span className="text-xs text-gray-400 w-20">{value}</span>
                  <div 
                    className="bg-blue-500 h-6"
                    style={{ width: value }}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  ),
};

// Effects Story
export const Effects: StoryObj = {
  render: () => (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold">Efectos Visuales</h1>
      
      {/* Border Radius */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Border Radius</h2>
        <div className="grid grid-cols-5 gap-4">
          {Object.entries(tokens.effects.borderRadius).map(([key, value]) => (
            <div key={key} className="text-center">
              <div 
                className="w-24 h-24 bg-gray-300 mx-auto mb-2"
                style={{ borderRadius: value }}
              />
              <p className="text-sm font-medium">{key}</p>
              <p className="text-xs text-gray-500">{value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Shadows */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Shadows</h2>
        <div className="grid grid-cols-3 gap-6">
          {Object.entries(tokens.effects.shadow).map(([key, value]) => {
            if (typeof value === 'string') {
              return (
                <div key={key} className="text-center">
                  <div 
                    className="w-32 h-32 bg-white rounded-lg mx-auto mb-2"
                    style={{ boxShadow: value }}
                  />
                  <p className="text-sm font-medium">{key}</p>
                </div>
              );
            }
            return null;
          })}
        </div>
      </section>

      {/* Glass Effects */}
      <section className="bg-gradient-to-br from-purple-400 to-pink-400 p-8 -mx-8">
        <h2 className="text-2xl font-semibold mb-4 text-white">Glass Effects</h2>
        <div className="grid grid-cols-4 gap-6">
          {Object.entries(tokens.glassEffects).map(([key, value]) => (
            <div key={key} className="text-center">
              <div 
                className="w-32 h-32 rounded-xl mx-auto mb-2 flex items-center justify-center"
                style={value}
              >
                <span className="text-white font-medium">{key}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Blur Values */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Blur Values</h2>
        <div className="grid grid-cols-4 gap-4">
          {Object.entries(tokens.effects.blur).map(([key, value]) => (
            <div key={key} className="relative h-32 rounded-lg overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-400" />
              <div 
                className="absolute inset-0 bg-white/80 flex items-center justify-center"
                style={{ backdropFilter: value }}
              >
                <div className="text-center">
                  <p className="font-medium">{key}</p>
                  <p className="text-sm text-gray-600">{value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  ),
};

// Helper Components
function ColorSwatch({ 
  name, 
  value, 
  textColor = 'white',
  small = false 
}: { 
  name: string; 
  value: string; 
  textColor?: string;
  small?: boolean;
}) {
  return (
    <div className={small ? 'text-center' : ''}>
      <div 
        className={`${small ? 'h-12' : 'h-24'} rounded-lg flex items-center justify-center`}
        style={{ backgroundColor: value, color: textColor }}
      >
        {!small && <span className="font-medium">{value}</span>}
      </div>
      <p className={`${small ? 'text-xs' : 'text-sm'} mt-2 text-gray-600`}>{name}</p>
    </div>
  );
}