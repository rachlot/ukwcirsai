//import '@/styles/globals.css'
import "../widgets/AIChat.css";
import "../../public/assets/speech-input.css";
import type { AppProps } from 'next/app';
import Head from "next/head";


export default function App({ Component, pageProps }: AppProps) {
  return <>
    <Head>
      <meta name="viewport" content="width=device-width, initial-scale=1"></meta>
    </Head>
    <Component {...pageProps} />
  </>
}
