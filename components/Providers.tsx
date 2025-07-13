// file: app/components/Providers.tsx
// 文件路径: app/components/Providers.tsx

'use client'; // This directive marks the component as a Client Component.
              // 这个指令将该组件标记为客户端组件。

import React from 'react';
import { CreditsProvider } from '@/contexts/CreditsContext';

// Define the props for the Providers component, specifying that children should be a React node.
// 定义 Providers 组件的 props，指明 children 应该是一个 React 节点。
interface ProvidersProps {
  children: React.ReactNode;
}

// This is a wrapper component that provides the context to its children.
// 这是一个包装组件，它为其子组件提供上下文。
// 注意：我们移除了NextAuth SessionProvider，因为它与Supabase Auth产生冲突
export default function Providers({ children }: ProvidersProps) {
  return (
    <CreditsProvider>
      {children}
    </CreditsProvider>
  );
}
