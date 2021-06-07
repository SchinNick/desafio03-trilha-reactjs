import { GetStaticPaths, GetStaticProps } from 'next';

import Head from 'next/head';

import { getPrismicClient } from '../../services/prismic';
import Prismic from '@prismicio/client'
import { RichText } from "prismic-dom";

import { format } from 'date-fns'
import ptBR from 'date-fns/locale/pt-BR';

import { FiCalendar, FiUser, FiClock } from 'react-icons/fi'

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { useRouter } from 'next/router';

interface Post {
   first_publication_date: string | null;
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

export default function Post({ post }: PostProps) {
   const router = useRouter()

   if (router.isFallback) {
      return <div>Carregando...</div>
   }

   const wordCount = post.data.content.reduce((count, section) => {
      count += RichText.asText(section.body).match(/\S+/g).length;

      return count
   }, 0)

   const readingTime = Math.ceil(wordCount / 200)

   return (
      <>
         <Head>
            <title>{post.data.title} | spacetraveling.</title>
         </Head>

         <div className={styles.banner}
            style={{ backgroundImage: `url(${post.data.banner.url})` }}>
         </div>

         <article className={`${commonStyles.commonContainer} ${styles.container}`}>
            <h1>{post.data.title}</h1>
            <span className={styles.info}>
               <FiCalendar />
               <time>
                  {format(
                     new Date(post.first_publication_date),
                     "dd MMM yyyy",
                     {
                        locale: ptBR
                     }
                  )}
               </time>
            </span>
            <span className={styles.info}>
               <FiUser />
               {post.data.author}
            </span>
            <span className={styles.info}>
               <FiClock />
               {readingTime} min
            </span>

            <main className={styles.postContent}>
               {post.data.content.map(section => (
                  <section key={section.heading}>
                     <h3>{section.heading}</h3>
                     <div
                        dangerouslySetInnerHTML={{ __html: RichText.asHtml(section.body) }} />
                  </section>
               ))}
            </main>
         </article>
      </>
   )
}

export const getStaticPaths = async () => {
   const prismic = getPrismicClient();
   const posts = await prismic.query(
      Prismic.predicates.at('document.type', 'posts'), {}
   )

   const paths = posts.results.map(post => {
      return {
         params: {
            slug: post.uid
         }
      }
   })

   // TODO
   return {
      paths,
      fallback: true,
   }
};

export const getStaticProps = async ({ params }) => {
   const { slug } = params;

   const prismic = getPrismicClient();
   const response = await prismic.getByUID('posts', String(slug), {});

   const post = {
      data: {
         title: response.data.title,
         subtitle: response.data.subtitle,
         banner: {
            url: response.data.banner.url
         },
         author: response.data.author,
         content: response.data.content
      },
      first_publication_date: response.first_publication_date,
      uid: response.uid
   }

   return {
      props: {
         post
      }
   }
};
