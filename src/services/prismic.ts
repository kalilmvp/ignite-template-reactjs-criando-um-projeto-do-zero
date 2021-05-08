import Prismic from '@prismicio/client';
import { DefaultClient } from '@prismicio/client/types/client';

export function getPrismicClient(req?: unknown): DefaultClient {
  return Prismic.client(process.env.PRISMIC_URL_API, {
    req,
    accessToken: process.env.PRISMIC_ACCESS_TOKEN,
  });
}
