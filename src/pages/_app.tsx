import "../styles/globals.css";
import "@rainbow-me/rainbowkit/styles.css";
import type { AppProps } from "next/app";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { SessionProvider } from "next-auth/react";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import type { Session } from "next-auth";

import { config } from "../wagmi";
import { RainbowKitSiweNextAuthProvider } from "@rainbow-me/rainbowkit-siwe-next-auth";

const client = new QueryClient();

function MyApp({
  Component,
  pageProps,
}: AppProps<{
  session: Session;
}>) {
  return (
    <WagmiProvider config={config}>
      <SessionProvider refetchInterval={0} session={pageProps.session}>
        <QueryClientProvider client={client}>
          <RainbowKitSiweNextAuthProvider
            getSiweMessageOptions={() => ({
              statement: "Sign in with Ethereum",
            })}
          >
            <RainbowKitProvider>
              <Component {...pageProps} />
            </RainbowKitProvider>
          </RainbowKitSiweNextAuthProvider>
        </QueryClientProvider>
      </SessionProvider>
    </WagmiProvider>
  );
}

export default MyApp;
