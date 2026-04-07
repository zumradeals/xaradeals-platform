import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Helmet } from "react-helmet-async";
import { Calendar, Tag, User } from "lucide-react";

type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  category: string | null;
  tags: string[];
  seo_title: string | null;
  seo_description: string | null;
  published_at: string | null;
};

// Simple markdown-to-HTML (headings, bold, italic, links, lists, code blocks, paragraphs)
function renderMarkdown(md: string): string {
  let html = md
    // Code blocks
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="rounded-lg bg-muted p-4 overflow-x-auto text-sm my-4"><code>$2</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="rounded bg-muted px-1.5 py-0.5 text-sm">$1</code>')
    // Headers
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-6 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-8 mb-3">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>')
    // Bold & italic
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary underline" target="_blank" rel="noopener noreferrer">$1</a>')
    // Images
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="rounded-xl my-4 max-w-full" loading="lazy" />')
    // Unordered lists
    .replace(/^[*-] (.+)$/gm, '<li class="ml-4">$1</li>')
    // Horizontal rules
    .replace(/^---$/gm, '<hr class="my-6 border-border" />');

  // Wrap consecutive <li> in <ul>
  html = html.replace(/((?:<li[^>]*>.*<\/li>\n?)+)/g, '<ul class="list-disc space-y-1 my-3">$1</ul>');

  // Paragraphs for remaining text
  html = html
    .split("\n\n")
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";
      if (trimmed.startsWith("<h") || trimmed.startsWith("<ul") || trimmed.startsWith("<pre") || trimmed.startsWith("<hr") || trimmed.startsWith("<img")) return trimmed;
      return `<p class="leading-relaxed text-muted-foreground mb-4">${trimmed.replace(/\n/g, "<br />")}</p>`;
    })
    .join("\n");

  return html;
}

export default function BlogArticle() {
  const { articleSlug } = useParams<{ articleSlug: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", articleSlug)
        .single();
      if (data) setPost(data as Post);
      setLoading(false);
    };
    fetch();
  }, [articleSlug]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col pb-20 md:pb-0">
        <Header />
        <main className="flex-1 py-8">
          <div className="container max-w-3xl">
            <Skeleton className="mb-4 h-10 w-3/4" />
            <Skeleton className="mb-8 h-6 w-1/2" />
            <Skeleton className="h-64" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex min-h-screen flex-col pb-20 md:pb-0">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">Article introuvable.</p>
        </main>
        <Footer />
      </div>
    );
  }

  const htmlContent = renderMarkdown(post.content);

  return (
    <div className="flex min-h-screen flex-col pb-20 md:pb-0">
      <Helmet>
        <title>{post.seo_title || `${post.title} — Blog XaraDeals`}</title>
        <meta name="description" content={post.seo_description || post.excerpt || post.title} />
        <link rel="canonical" href={`https://xaradeals.com/blog/${post.slug}`} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={post.seo_title || post.title} />
        <meta property="og:description" content={post.seo_description || post.excerpt || post.title} />
        {post.cover_image_url && <meta property="og:image" content={post.cover_image_url} />}
        <meta property="article:published_time" content={post.published_at || post.published_at || ""} />
        {post.tags.map((tag) => (
          <meta key={tag} property="article:tag" content={tag} />
        ))}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.title,
            description: post.seo_description || post.excerpt,
            image: post.cover_image_url,
            datePublished: post.published_at,
            dateModified: post.published_at,
            author: { "@type": "Organization", name: "XaraDeals" },
            publisher: {
              "@type": "Organization",
              name: "XaraDeals",
              url: "https://xaradeals.com",
            },
            mainEntityOfPage: `https://xaradeals.com/blog/${post.slug}`,
          })}
        </script>
      </Helmet>
      <Header />
      <main className="flex-1 py-8">
        <div className="container max-w-3xl">
          <Breadcrumbs items={[
            { label: "Blog", href: "/blog" },
            { label: post.title },
          ]} />

          {post.cover_image_url && (
            <div className="mb-6 overflow-hidden rounded-xl">
              <img src={post.cover_image_url} alt={post.title} className="w-full aspect-video object-cover" />
            </div>
          )}

          <div className="mb-4 flex flex-wrap items-center gap-3">
            {post.category && <Badge variant="secondary">{post.category}</Badge>}
            {post.published_at && (
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(post.published_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
              </span>
            )}
          </div>

          <h1 className="mb-6 text-3xl font-bold leading-tight sm:text-4xl">{post.title}</h1>

          {post.excerpt && (
            <p className="mb-8 text-lg text-muted-foreground leading-relaxed border-l-4 border-primary/30 pl-4">
              {post.excerpt}
            </p>
          )}

          <article
            className="prose-custom"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />

          {post.tags.length > 0 && (
            <div className="mt-8 flex items-center gap-2 flex-wrap border-t border-border pt-6">
              <Tag className="h-4 w-4 text-muted-foreground" />
              {post.tags.map((tag) => (
                <Badge key={tag} variant="outline">#{tag}</Badge>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
