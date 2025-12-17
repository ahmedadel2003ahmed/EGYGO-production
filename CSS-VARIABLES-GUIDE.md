# CSS Variables Guide - EGYGO

## 📋 Quick Reference

All CSS variables are defined in `src/app/globals.css` and can be used across your entire application.

## 🎨 How to Use Variables

### In CSS Modules
```css
.myComponent {
  background-color: var(--color-primary);
  color: var(--color-text);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  transition: var(--transition-all);
}

.myComponent:hover {
  background-color: var(--color-primary-hover);
  box-shadow: var(--shadow-hover);
}
```

### In Inline Styles (if needed)
```jsx
<div style={{ 
  color: 'var(--color-primary)',
  padding: 'var(--spacing-lg)'
}}>
  Content
</div>
```

## 🎨 Available Variables

### Brand Colors
- `--color-primary` - Main brand color (#FF543D)
- `--color-primary-hover` - Hover state
- `--color-primary-light` - Lighter variant
- `--color-primary-dark` - Darker variant
- `--color-secondary` - Secondary brand color
- `--color-accent` - Accent color (gold)

### Neutral Colors
- `--color-bg` - Page background
- `--color-surface` - Card/component background
- `--color-text` - Primary text
- `--color-text-secondary` - Secondary text
- `--color-text-light` - Light text
- `--color-text-muted` - Muted text
- `--color-border` - Border color

### Semantic Colors
- `--color-success` / `--color-success-hover` / `--color-success-light`
- `--color-error` / `--color-error-hover` / `--color-error-light`
- `--color-warning` / `--color-warning-hover` / `--color-warning-light`
- `--color-info` / `--color-info-hover` / `--color-info-light`

### Gradients
- `--gradient-primary` - Primary gradient
- `--gradient-success` - Success gradient
- `--gradient-purple` - Purple gradient
- `--gradient-blue` - Blue gradient

### Shadows
- `--shadow-xs` → `--shadow-2xl` - Various shadow sizes
- `--shadow-hover` - Special hover shadow

### Typography
**Font Sizes:**
- `--font-size-xs` (12px) → `--font-size-4xl` (48px)

**Font Weights:**
- `--font-weight-light` (300) → `--font-weight-extrabold` (800)

**Line Heights:**
- `--line-height-tight` (1.25)
- `--line-height-normal` (1.5)
- `--line-height-relaxed` (1.6)

### Spacing
- `--spacing-xs` (4px) → `--spacing-4xl` (96px)

### Border Radius
- `--radius-xs` (4px) → `--radius-xl` (32px)
- `--radius-full` - Fully rounded (pills/circles)

### Layout
- `--container-max-width` - Max container width
- `--navbar-height` - Navbar height
- `--z-index-modal` / `--z-index-dropdown` etc.

## 💡 Common Use Cases

### Button Styling
```css
.button {
  background: var(--gradient-primary);
  color: white;
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: var(--radius-md);
  font-weight: var(--font-weight-semibold);
  transition: var(--transition-all);
  box-shadow: var(--shadow-md);
}

.button:hover {
  box-shadow: var(--shadow-hover);
  transform: translateY(-2px);
}
```

### Card Styling
```css
.card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-md);
  transition: var(--transition-all);
}

.card:hover {
  box-shadow: var(--shadow-lg);
}
```

### Input Styling
```css
.input {
  background-color: var(--color-surface);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: var(--font-size-base);
  color: var(--color-text);
  transition: var(--transition-fast);
}

.input:focus {
  border-color: var(--color-primary);
  outline: none;
  box-shadow: 0 0 0 3px rgba(255, 84, 61, 0.1);
}
```

### Toast Notification
```css
.toast {
  background: var(--gradient-success);
  color: white;
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  font-weight: var(--font-weight-medium);
}

.toastError {
  background: var(--gradient-primary);
}
```

## 🌙 Dark Mode

Dark mode is automatically handled! The variables adjust when `[data-theme="dark"]` is applied to the HTML element.

To enable dark mode:
```javascript
document.documentElement.setAttribute('data-theme', 'dark');
```

To disable:
```javascript
document.documentElement.setAttribute('data-theme', 'light');
```

## ✅ Migration Tips

1. **Replace hardcoded colors:**
   - `#FF543D` → `var(--color-primary)`
   - `#10b981` → `var(--color-success)`
   - `#ef4444` → `var(--color-error)`

2. **Replace hardcoded spacing:**
   - `8px` → `var(--spacing-sm)`
   - `16px` → `var(--spacing-md)`
   - `24px` → `var(--spacing-lg)`

3. **Replace hardcoded shadows:**
   - Custom shadows → `var(--shadow-md)` or `var(--shadow-lg)`

4. **Replace border-radius:**
   - `8px` → `var(--radius-sm)`
   - `16px` → `var(--radius-md)`

## 🔄 Updating Globally

When you change a variable in `globals.css`, it automatically updates everywhere it's used. For example:

```css
/* Change primary color globally */
:root {
  --color-primary: #1E90FF; /* Change from #FF543D to blue */
}
```

Now ALL components using `var(--color-primary)` will use the new color!

## 🎯 Next Steps

1. Start updating your CSS modules to use these variables
2. Replace hardcoded colors, spacing, and shadows
3. Test dark mode functionality
4. Adjust variable values in `globals.css` to fine-tune your design
