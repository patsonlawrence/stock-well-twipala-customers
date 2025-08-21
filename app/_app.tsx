// pages/_app.tsx
import type { AppProps } from 'next/app'
import Head from 'next/head'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <link rel="icon" href="/twipalalogo192.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0d6efd" />
        <link rel="apple-touch-icon" href="/twipalalogo192.png" />
        {/* Optional: add different sizes/icons for better cross-device support */}
      </Head>
      <Component {...pageProps} />
    </>
  )
}

export default MyApp
