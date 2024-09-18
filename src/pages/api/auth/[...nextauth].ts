// Code in this file is based on https://docs.login.xyz/integrations/nextauth.js
// with added process.env.VERCEL_URL detection to support preview deployments
// and with auth option logic extracted into a 'getAuthOptions' function so it
// can be used to get the session server-side with 'unstable_getServerSession'
import type { IncomingMessage } from "node:http";
import type { NextApiRequest, NextApiResponse } from "next";
import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { SiweMessage } from "siwe";

export function getAuthOptions(req: IncomingMessage): NextAuthOptions {
  const providers = [
    CredentialsProvider({
      async authorize(credentials) {
        // server
        if (credentials === undefined) return null;
        console.log(credentials);
        try {
          const siwe = new SiweMessage(JSON.parse(credentials.message));

          console.log("siwe", siwe);

          //! TODO: check if the domain is correct or CORS if we care
          // const nextAuthHost = new URL("http://localhost:3000").host;
          // if (siwe.domain !== nextAuthHost) {
          //   return null;
          // }

          //! TODO: check csrfToken
          // if (siwe.nonce !== credentials?.csrfToken) {
          //   return null;
          // }

          const res = await siwe.verify({
            signature: credentials.signature || "",
          });
          if (res.error) {
            console.error(res.error);
            return null;
          }

          return {
            id: siwe.address,
          };
        } catch (e) {
          return null;
        }
      },
      credentials: {
        message: {
          label: "Message",
          placeholder: "0x0",
          type: "text",
        },
        signature: {
          label: "Signature",
          placeholder: "0x0",
          type: "text",
        },
      },
      name: "Ethereum",
    }),
  ];

  return {
    callbacks: {
      async session({ session, token }) {
        session.user = {
          name: token.sub,
        };
        console.log("session", session);
        console.log("token", token);
        return session;
      },
    },
    // https://next-auth.js.org/configuration/providers/oauth
    providers,
    // secret: process.env.NEXTAUTH_SECRET,
    secret: "asdf",
    session: {
      strategy: "jwt",
    },
  };
}

// For more information on each option (and a full list of options) go to
// https://next-auth.js.org/configuration/options
export default async function auth(req: NextApiRequest, res: NextApiResponse) {
  const authOptions = getAuthOptions(req);

  if (!Array.isArray(req.query.nextauth)) {
    res.status(400).send("Bad request");
    return;
  }

  const isDefaultSigninPage =
    req.method === "GET" &&
    req.query.nextauth.find((value) => value === "signin");

  // Hide Sign-In with Ethereum from default sign page
  if (isDefaultSigninPage) {
    authOptions.providers.pop();
  }

  return await NextAuth(req, res, authOptions);
}
