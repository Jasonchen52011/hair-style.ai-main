# Primary 颜色系统使用指南

## 概述
我们已经将 primary 颜色定义为 `purple-700` (#7c3aed)，并提供了完整的深浅色变体。

## 颜色定义

### Tailwind 类名
- `bg-primary-50` - 最浅色 (#faf5ff)
- `bg-primary-100` - 浅色 (#f3e8ff)
- `bg-primary-200` - 较浅色 (#e9d5ff)
- `bg-primary-300` - 中浅色 (#d8b4fe)
- `bg-primary-400` - 中等色 (#c084fc)
- `bg-primary-500` - 标准色 (#a855f7)
- `bg-primary-600` - 较深色 (#9333ea)
- `bg-primary-700` - **主色** (#7c3aed)
- `bg-primary-800` - 深色 (#6b21a8)
- `bg-primary-900` - 最深色 (#581c87)
- `bg-primary-950` - 超深色 (#3b0764)

### CSS 变量
- `var(--primary)` - 主色 (primary-700)
- `var(--primary-dark)` - 深色 (primary-800)
- `var(--primary-light)` - 浅色 (primary-500)
- `var(--primary-lighter)` - 更浅色 (primary-300)
- `var(--primary-lightest)` - 最浅色 (primary-100)

## 使用示例

### 1. DaisyUI 按钮
```jsx
<button className="btn btn-primary">Primary Button</button>
```

### 2. 自定义按钮样式
```jsx
<button className="btn-primary-custom">Custom Primary Button</button>
```

### 3. Tailwind 类名使用
```jsx
// 背景色
<div className="bg-primary-700">主色背景</div>
<div className="bg-primary-800">深色背景</div>
<div className="bg-primary-500">浅色背景</div>

// 文字颜色
<p className="text-primary-700">主色文字</p>
<p className="text-primary-800">深色文字</p>

// 边框
<div className="border-primary-700 border-2">主色边框</div>
```

### 4. CSS 变量使用
```css
.custom-element {
  background-color: var(--primary);
  border-color: var(--primary-dark);
  color: white;
}

.custom-element:hover {
  background-color: var(--primary-dark);
}
```

## 主题设置
项目配置为强制使用浅色主题，确保始终显示白色背景和良好的对比度。

## 最佳实践

1. **主色 (primary-700)**: 用于主要按钮、链接、重要元素
2. **深色 (primary-800)**: 用于 hover 状态、激活状态
3. **浅色 (primary-500)**: 用于次要元素、图标
4. **更浅色 (primary-300)**: 用于背景、分隔线
5. **最浅色 (primary-100)**: 用于卡片背景、轻微强调

## 组件中的使用
当前项目中的按钮已经使用了这些颜色：
```jsx
<Link 
  href="/ai-hairstyle" 
  className="btn btn-primary btn-lg"
>
  Try on Now
</Link>
```

DaisyUI 的 `btn-primary` 现在使用的是我们定义的 purple-700 (#7c3aed)。 