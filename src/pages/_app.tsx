import { AppProps } from 'next/app';
import '../styles/globals.scss';
import '../styles/common.module.scss';
import Header from '../components/Header';

function MyApp({ Component, pageProps }: AppProps): JSX.Element {
  return (
    <>
      <Header />
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
