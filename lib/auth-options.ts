import type { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    GitHubProvider({
      clientId: process.env.AUTH_GITHUB_ID ?? "",
      clientSecret: process.env.AUTH_GITHUB_SECRET ?? "",
      authorization: {
        params: {
          scope: "read:user repo",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account?.provider === "github") {
        token.accessToken = account.access_token;
        token.githubUserId = account.providerAccountId;

        if (profile && typeof profile === "object" && "login" in profile) {
          token.login =
            typeof profile.login === "string"
              ? profile.login
              : String(profile.login);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id =
          typeof token.githubUserId === "string" ? token.githubUserId : "";
        session.user.login =
          typeof token.login === "string" ? token.login : session.user.name ?? "";
      }

      session.accessToken =
        typeof token.accessToken === "string" ? token.accessToken : undefined;

      return session;
    },
  },
};
