import { GetStaticPaths, GetStaticProps } from 'next';

import { getPrismicClient } from '../../services/prismic';

import styles from './post.module.scss';
import { useRouter } from "next/router";
import { format } from "date-fns";
import ptBR from "date-fns/locale/pt-BR";
import { FiCalendar, FiUser, FiClock } from "react-icons/fi";
import { RichText } from "prismic-dom";
import Prismic from "@prismicio/client";
import Comments from "../../components/Comments";
import { useCallback } from "react";

interface Post {
  uid?: string;
  first_publication_date: string | null;
  last_publication_date: string | null;
  tempoDeLeitura?: string;
  href?: string;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
  nextPost: Post;
  beforePost: Post;
}

export default function Post({post, nextPost, beforePost}: PostProps) {
  const router = useRouter();
  
  if (router.isFallback) {
    return <div>Carregando...</div>
  }
  
  if (!post) {
    return <div>Carregando...</div>
  }

  const loadPage = useCallback((uid: string) => {
    router.push(`/post/${uid}`)
  }, [ post, nextPost, beforePost]);

  return (
    <div>
      <main className={ styles.container }>
        <div className={styles.banner}>
          <img src={ post.data.banner.url} alt="banner" />
        </div>
        <article className={ styles.post }>
          <h3>{ post.data.title }</h3>
          <div className={ styles.publInfo }>
            <time>
              <FiCalendar color="#BBBBBB" />
              { post.first_publication_date }
            </time>
            <span>
              <FiUser color="#BBBBBB" />{ post.data.author }
            </span>
            <span>
              <FiClock color="#BBBBBB" />{ post.tempoDeLeitura }
            </span>
          </div>
          <span className={styles.editadoEm}>
            * editado em {post.last_publication_date} 
          </span>
          { post.data.content.map(content => (
            <div key={content.heading} className={styles.postContentContainer}>
              <h4>{ content.heading }</h4>
              { content.body.map(body => (
                <div key={body.text} className={ `${ styles.postContent }` }
                     dangerouslySetInnerHTML={ { __html: body.text } } />
              ))}
            </div>
          ))}
          
          <div className={styles.outrosPostsContainer}>
            <div className={ styles.outrosPostsLinks }>
              { beforePost ? (
                <div className={styles.link}>
                  <span>{ beforePost.data.title }</span>
                  <a className={ styles.proximo } onClick={ () => loadPage(beforePost.uid) }>Post Anterior</a>
                </div>
              ) : (
                <div className={  `${ styles.link} ${styles.semPost}`  }>
                  <span>Nenhum Post</span>
                  <a onClick={ () => null }>Post Anterior</a>
                </div>
                )}

              { nextPost ? (
                <div className={ styles.link } style={{textAlign: 'right'}}>
                  <span>{ nextPost.data.title}</span>
                  <a className={styles.proximo} onClick={ () => loadPage(nextPost.uid) }>Próximo Post</a>
                </div>
              ) : (
                <div className={ `${ styles.link } ${ styles.semPost }` }>
                  <span>Nenhum Post</span>
                  <a onClick={ () => null }>Próximo Post</a>
                </div>
              )}
            </div>
          </div>
        </article>
        

        <div className={styles.comments}>
          <Comments />
        </div>
      </main>
    </div>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [ Prismic.predicates.at('document.type', 'posts_ignite') ],
    {
      fetch: [ 'posts.title', 'posts.subtitle', 'posts.author' ],
      pageSize: 2,
    }
  );
  return {
    paths: 
      posts.results.map(post => {
      return {
        params: {
          slug: post.uid
        }
      }
      }),
    fallback: 'blocking'
  }
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const {slug} = params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts_ignite', String(slug), {});

  // console.log('post: ', response);

  const responseAll = await prismic.query(
    [ Prismic.predicates.at('document.type', 'posts_ignite') ],
    {
      fetch: [ 'posts.title', 'posts.subtitle', 'posts.author' ],
      pageSize: 100,
    }
  );
  const beforePost: Post = responseAll.results[responseAll.results.findIndex(re => re.uid === slug) - 1] || null;
  const nextPost: Post = responseAll.results[responseAll.results.findIndex(re => re.uid === slug) + 1] || null;

  const qtdPalavras = response.data.content.reduce((total, content) => {
    let words = content.heading?.split(' ').length ?? 0;
    words += RichText.asText(content.body).split(' ').filter(word => word.match(/^[\w, "'-.]{2,}/g)).length;
    return total + words;
  }, 0);
  const tempoDeLeitura = String(Math.ceil(qtdPalavras/200)).concat(' min');
  
  const post: Post = Object.assign(response, {
    tempoDeLeitura,
    first_publication_date: format(
      new Date(response.first_publication_date),
      'dd MMM yyyy',
      {
        locale: ptBR,
      }
    ),
    last_publication_date: format(
      new Date(response.last_publication_date),
      "dd MMM yyyy, '`as ' HH:mm",
      {
        locale: ptBR,
      }
    )
  });

  console.log('beforePost', beforePost);
  console.log('currentPost', post);
  console.log('nextPost', nextPost);

  return {
    props: {
      post,
      beforePost, 
      nextPost
    },
    revalidate: 60 * 30 // 30 minutes
  }
};
