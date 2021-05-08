import { GetStaticPaths, GetStaticProps } from 'next';

import { getPrismicClient } from '../../services/prismic';

import styles from './post.module.scss';
import { useRouter } from "next/router";
import { format } from "date-fns";
import ptBR from "date-fns/locale/pt-BR";
import { FiCalendar, FiUser, FiClock } from "react-icons/fi";
import { RichText } from "prismic-dom";
import Prismic from "@prismicio/client";

interface Post {
  first_publication_date: string | null;
  tempoDeLeitura?: string;
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
}

export default function Post({post}: PostProps) {
  const router = useRouter();
  
  if (router.isFallback) {
    return <div>Carregando...</div>
  }
  
  if (!post) {
    return <div>Carregando...</div>
  }

  return (
    <div>
      <main className={ styles.container }>
        <div className={styles.banner}>
          <img src={post.data.banner.url} alt="banner" />
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
          {post.data.content.map(content => (
            <div key={content.heading} className={styles.postContentContainer}>
              <h4>{ content.heading }</h4>
              { content.body.map(body => (
                <div key={body.text} className={ `${ styles.postContent }` }
                     dangerouslySetInnerHTML={ { __html: body.text } } />
              ))}
            </div>
          ))}
        </article>
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
  
  response.data.content.map(content => {
    
  })
  
  const tempoDeLeituraFinal = null;
  
  const post: Post = Object.assign(response, {
    tempoDeLeitura: '4 min',
    first_publication_date: format(
      new Date(response.first_publication_date),
      'dd MMM yyyy',
      {
        locale: ptBR,
      }
    )
  });

  return {
    props: {
      post,
    },
    revalidate: 60 * 30 // 30 minutes
  }
};
