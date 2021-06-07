import { GetStaticProps } from 'next';

import Head from 'next/head'
import Link from 'next/link';

import { format } from 'date-fns'
import ptBR from 'date-fns/locale/pt-BR';

import { getPrismicClient } from '../services/prismic';
import Prismic from '@prismicio/client'

import { FiCalendar, FiUser } from 'react-icons/fi'

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import { useEffect, useState } from 'react';

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
   const [posts, setPosts] = useState<Post[]>([]);
   const [nextPage, setNextPage] = useState<string>()

   useEffect(() => {
      const postsFormatted = postsPagination.results.map(post => {
         return {
            ...post,
            first_publication_date: format(
               new Date(post.first_publication_date),
               "dd MMM yyyy",
               {
                  locale: ptBR
               }
            ),
         }
      })
      setPosts(postsFormatted)
      setNextPage(postsPagination.next_page)
   }, [postsPagination])

   function handleLoadMore() {
      fetch(postsPagination.next_page)
         .then(response => response.json())
         .then(data => {
            setPosts([...posts, ...data.results])
            setNextPage(data.next_page)
         })
   }

   return (
      <>
         <Head>
            <title>Home | spacetraveling.</title>
         </Head>
         <main className={`${commonStyles.commonContainer} ${styles.container}`}>
            {posts.map(post => (
               <Link href={`/post/${post.uid}`} key={post.uid}>
                  <a className={styles.post}>
                     <strong>{post.data.title}</strong>
                     <p>{post.data.subtitle}</p>
                     <span>
                        <FiCalendar />
                        <time>{post.first_publication_date}</time>
                     </span>
                     <span>
                        <FiUser />
                        {post.data.author}
                     </span>
                  </a>
               </Link>
            ))}

            {nextPage &&
               <button
                  type="submit"
                  className={styles.loadMoreButton}
                  onClick={handleLoadMore}
               >
                  Carregar mais posts
               </button>
            }
         </main>
      </>
   )
}

export const getStaticProps = async () => {
   const prismic = getPrismicClient();

   const postsResponse = await prismic.query([
      Prismic.predicates.at('document.type', 'posts')
   ], {
      fetch: ['post.title', 'post.subtitle', 'post.author'],
      pageSize: 1,
   });

   const postsPagination = {
      next_page: postsResponse.next_page,
      results: postsResponse.results.map(post => {
         return {
            uid: post.uid,
            first_publication_date: post.first_publication_date,
            data: {
               title: post.data.title,
               subtitle: post.data.subtitle,
               author: post.data.author,
            }
         }
      })
   }

   // TODO

   return {
      props: {
         postsPagination
      }
   }
};
