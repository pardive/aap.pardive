import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { MDXRemote } from 'next-mdx-remote/rsc';
import HelpShell from '@/app/help/HelpShell';

export default async function HelpPage({ params }: { params: { slug: string[] } }) {
  const slugPath = params.slug.join('/');
  const filePath = path.join(process.cwd(), 'src/app/help', `${slugPath}.mdx`);

  const source = fs.readFileSync(filePath, 'utf8');
  const { content, data: frontmatter } = matter(source);

  const title = frontmatter?.title ?? 'Untitled';
  const description = Array.isArray(frontmatter?.description) ? frontmatter.description : [];

  return (
    <HelpShell title={title} description={description}>
      <MDXRemote source={content} />
    </HelpShell>
  );
}
