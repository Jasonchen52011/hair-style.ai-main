'use client'; // This is a Client Component because it uses hooks and event handlers.
              // 这是一个客户端组件，因为它使用了 hook 和事件处理函数。

import { useSession, signIn, signOut } from 'next-auth/react';
import Image from 'next/image';

export default function LoginButton() {
  // The useSession hook provides session data and status, with types inferred automatically.
  // useSession hook 提供了 session 数据和状态，其类型会被自动推断。
  const { data: session, status } = useSession();

  // 添加调试日志
  console.log('LoginButton - Status:', status);
  console.log('LoginButton - Session:', session);

  // The status can be 'loading', 'authenticated', or 'unauthenticated'.
  // status 的值可以是 'loading', 'authenticated', 或 'unauthenticated'。
  if (status === 'loading') {
    return <p>Loading...</p>; // Show a loading message while session is being checked.
                               // 检查 session 状态时显示加载信息。
  }

  // If the user is authenticated, show their info and a sign-out button.
  // The session object is fully typed, so you can safely access user properties.
  // 如果用户已认证，显示他们的信息和登出按钮。session 对象是完全类型化的，所以你可以安全地访问用户属性。
  if (session) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* session.user.image can be null, so we check for its existence. */}
        {/* session.user.image 可能为 null，所以我们检查它是否存在。 */}
        {session.user?.image && (
          <Image 
            src={session.user.image} 
            alt={session.user?.name ?? 'User avatar'} // Provide a fallback for alt text.
                                                      // 为 alt 文本提供一个备用选项。
            width={40} 
            height={40} 
            style={{ borderRadius: '50%' }} 
          />
        )}
        <div>
          <p>Signed in as {session.user?.email}</p>
          <button onClick={() => signOut()}>Sign out</button>
        </div>
      </div>
    );
  }

  // If the user is not authenticated, show a sign-in button.
  // 如果用户未认证，显示登录按钮。
  return (
    <div>
      <button 
        onClick={() => {
          console.log('Login button clicked');
          signIn('google');
        }}
        style={{
          padding: '8px 16px',
          backgroundColor: '#4285f4',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Sign in
      </button>
    </div>
  );
}
