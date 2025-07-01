import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// Define authentication options using the NextAuthOptions type for type safety.
// 使用 NextAuthOptions 类型来定义认证选项，以确保类型安全。
export const authOptions: NextAuthOptions = {
  // Configure one or more authentication providers.
  // 配置一个或多个认证提供商。
  providers: [
    GoogleProvider({
      // The client ID and secret are asserted as strings, as they are expected to be set in .env.local.
      // 客户端ID和密钥被断言为字符串，因为我们期望它们在 .env.local 文件中被设置。
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    // ...add more providers here if needed
    // ...如果需要，可以在这里添加更多的提供商
  ],
  
  // A secret is used to sign and encrypt JWTs and hash session tokens.
  // secret 用于签名和加密 JWT 以及哈希 session token。
  secret: process.env.NEXTAUTH_SECRET,

  // 使用默认的 NextAuth 登录页面
  // Use default NextAuth sign-in page
  // pages: {
  //   signIn: '/signin', // A custom sign-in page, if you have one.
  //                      // 如果你有自定义的登录页面，在这里指定。
  // }
};

// The handler function initializes NextAuth with the defined options.
// handler 函数使用定义好的选项来初始化 NextAuth。
const handler = NextAuth(authOptions);

// Export the handler for both GET and POST requests. This is a Next.js App Router convention.
// 为 GET 和 POST 请求导出 handler。这是 Next.js App Router 的规范。
export { handler as GET, handler as POST }; 