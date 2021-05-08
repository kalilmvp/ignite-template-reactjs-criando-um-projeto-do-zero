import { GetStaticProps } from 'next';
import Link from 'next/link';
import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { FiUser, FiCalendar } from 'react-icons/fi';
import { useCallback, useState } from "react";
import { getPrismicClient } from '../services/prismic';

import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const [postPaginationState, setPostsPaginationState] = useState<PostPagination>(postsPagination);

  const loadNextPage = useCallback((nextPage: string) => {
    fetch(nextPage).then(resp => resp.json()).then((data: PostPagination) => {

      data.results.forEach(post => {
        post.first_publication_date = format(
          new Date(post.first_publication_date),
          'dd MMM yyyy',
          {
            locale: ptBR,
          }
        ); 
      });

      setPostsPaginationState(Object.assign(data, {
        results: postsPagination.results.concat(data.results)
      }));
    })
  }, []);

  return (
    <>
      <main className={styles.container}>
        <div className={styles.post}>
          { postPaginationState.results.map(post => (
            <div key={ post.uid } className={styles.postItem}>
              <Link href={ `/post/${ post.uid }` }>
                <a>
                  <strong>{ post.data.title }</strong>
                  <p>{ post.data.subtitle }</p>
                  <div className={ styles.publInfo }>
                    <time>
                      <FiCalendar color="#BBBBBB" />
                      { post.first_publication_date }
                    </time>
                    <span>
                        <FiUser color="#BBBBBB" />
                      { post.data.author }
                      </span>
                  </div>
                </a>
              </Link>
            </div>
          ))}

          { postPaginationState.next_page && (
            <div className={ styles.carregarMais }>
              <a onClick={() => loadNextPage(postPaginationState.next_page)}>Carregar mais posts</a>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  //
  const response = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts_ignite')],
    {
      fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
      pageSize: 2,
    }
  );

  response.results.forEach(post => {
    post.first_publication_date = format(
      new Date(post.first_publication_date),
      'dd MMM yyyy',
      {
        locale: ptBR,
      }
    );
  });

  return {
    props: {
      postsPagination: response,
    },
  };
};
