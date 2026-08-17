'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ChevronRight, Clock, ArrowLeft, Share2, Check, BookOpen, Send } from 'lucide-react';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { FloatingContact } from '@/components/common/FloatingContact';
import { blogStore, BlogPost } from '@/lib/blog-store';

export default function BlogDetailPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = use(params);
  const router = useRouter();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initial = blogStore.getPostBySlug(slug);
    if (initial) {
      setPost(initial);
      setLoading(false);
      const all = blogStore.getPosts();
      setRelatedPosts(all.filter((item) => item.id !== initial.id && item.slug !== initial.slug).slice(0, 3));
    }

    blogStore.fetchPosts().then(() => {
      const found = blogStore.getPostBySlug(slug) || null;
      if (found) {
        setPost(found);
        const all = blogStore.getPosts();
        setRelatedPosts(all.filter((item) => item.id !== found.id && item.slug !== found.slug).slice(0, 3));
      }
    }).catch(() => {
      if (!initial) setPost(null);
    }).finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (post?.title && typeof document !== 'undefined') {
      document.title = `${post.title} | Blog OrderChinaViet`;
    }
  }, [post]);

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900  flex flex-col antialiased relative">
        <Header locale={locale as any} dict={null} />
        <main className="flex-1 max-w-4xl mx-auto px-4 py-24 w-full space-y-6 animate-pulse">
          <div className="bg-slate-200 h-8 w-48 rounded-xl" />
          <div className="bg-slate-200 h-12 w-full rounded-2xl" />
          <div className="bg-slate-200 h-72 w-full rounded-3xl" />
        </main>
        <Footer locale={locale as any} dict={null} />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900  flex flex-col antialiased relative">
        <Header locale={locale as any} dict={null} />
        <main className="flex-1 max-w-2xl mx-auto px-4 py-32 text-center space-y-4">
          <BookOpen className="w-12 h-12 text-slate-400 mx-auto" />
          <h1 className="text-xl font-bold text-slate-900">Bài viết không tồn tại hoặc đã bị xóa</h1>
          <Link
            href={`/${locale}/blog`}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl font-bold text-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại trang Blog</span>
          </Link>
        </main>
        <Footer locale={locale as any} dict={null} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900  flex flex-col antialiased relative">
      <Header locale={locale as any} dict={null} />

      <main className="flex-1 pt-28 sm:pt-32 pb-16">
        {/* Breadcrumb Navigation */}
        <div className="bg-white border-b border-slate-200 py-3 mb-6">
          <div className="max-w-4xl mx-auto px-4 text-xs flex items-center gap-2 text-slate-500 font-medium overflow-x-auto">
            <Link href={`/${locale}`} className="hover:text-primary-600 transition-colors shrink-0">
              Trang Chủ
            </Link>
            <ChevronRight className="w-3.5 h-3.5 shrink-0 text-slate-300" />
            <Link href={`/${locale}/blog`} className="hover:text-primary-600 transition-colors shrink-0">
              Blog Cẩm Nang
            </Link>
            <ChevronRight className="w-3.5 h-3.5 shrink-0 text-slate-300" />
            <span className="text-slate-900 font-bold truncate max-w-xs">{post.title}</span>
          </div>
        </div>

        {/* Main Content Article */}
        <article className="max-w-4xl mx-auto px-4 space-y-8">
          {/* Article Header Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-primary-50 text-primary-700 font-bold text-xs rounded-full border border-primary-200">
                {post.category}
              </span>
              <span className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {post.readTime}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight leading-tight">
              {post.title}
            </h1>

            <p className="text-slate-600 text-sm sm:text-base font-medium leading-relaxed bg-slate-100 p-4 rounded-2xl border border-slate-200/80 italic">
              "{post.summary}"
            </p>
          </div>

          {/* Featured Cover Image */}
          <div className="relative h-72 sm:h-96 w-full rounded-3xl overflow-hidden shadow-sm border border-slate-200 bg-slate-100">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              unoptimized
              className="object-cover"
              priority
            />
          </div>

          {/* Full Article Text Body */}
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm space-y-4 text-slate-800 text-sm sm:text-base leading-relaxed  ">
            {(() => {
              const renderFormattedInline = (text: string): React.ReactNode => {
                if (!text) return null;
                // Replace KaTeX-style math shortcuts if present
                const sanitized = text
                  .replace(/\\ge/g, '≥')
                  .replace(/\\le/g, '≤')
                  .replace(/\\times/g, '×')
                  .replace(/\\text\{([^}]+)\}/g, '$1')
                  .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1) / ($2)')
                  .replace(/\$\$/g, '')
                  .replace(/\$/g, '');

                const tokenRegex = /(\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|`([^`]+)`|\*([^*]+)\*)/g;
                const nodes: React.ReactNode[] = [];
                let lastIdx = 0;
                let match: RegExpExecArray | null;

                while ((match = tokenRegex.exec(sanitized)) !== null) {
                  if (match.index > lastIdx) {
                    nodes.push(sanitized.substring(lastIdx, match.index));
                  }

                  if (match[2] && match[3]) {
                    // Link [label](href)
                    const linkText = match[2];
                    let linkHref = match[3];
                    if (linkHref.startsWith('/')) {
                      linkHref = linkHref.replace(/^\/(vi|en|zh)/, '');
                      linkHref = `/${locale}${linkHref}`;
                    }
                    nodes.push(
                      <Link
                        key={`link-${match.index}`}
                        href={linkHref}
                        className="font-bold text-primary-600 hover:text-primary-700 underline decoration-primary-300 underline-offset-2 transition-colors mx-0.5"
                      >
                        {linkText}
                      </Link>
                    );
                  } else if (match[4]) {
                    // Bold **text**
                    nodes.push(
                      <strong key={`b-${match.index}`} className="font-bold text-slate-900">
                        {match[4]}
                      </strong>
                    );
                  } else if (match[5]) {
                    // Inline Code `code`
                    nodes.push(
                      <code key={`c-${match.index}`} className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-primary-700 text-xs font-semibold">
                        {match[5]}
                      </code>
                    );
                  } else if (match[6]) {
                    // Italic *text*
                    nodes.push(
                      <em key={`i-${match.index}`} className="italic text-slate-800">
                        {match[6]}
                      </em>
                    );
                  }

                  lastIdx = tokenRegex.lastIndex;
                }

                if (lastIdx < sanitized.length) {
                  nodes.push(sanitized.substring(lastIdx));
                }

                return nodes.length > 0 ? nodes : sanitized;
              };

              const lines = post.content.split('\n');
              const elements: React.ReactElement[] = [];
              let listBuffer: { type: 'ul' | 'ol'; text: string }[] = [];
              let tableBuffer: string[] = [];

              const flushList = () => {
                if (listBuffer.length > 0) {
                  const isOrdered = listBuffer[0].type === 'ol';
                  if (isOrdered) {
                    elements.push(
                      <ol key={`ol-${elements.length}`} className="list-decimal pl-5 space-y-2 text-slate-700 font-medium text-xs sm:text-sm my-3">
                        {listBuffer.map((item, idx) => (
                          <li key={idx}>{renderFormattedInline(item.text)}</li>
                        ))}
                      </ol>
                    );
                  } else {
                    elements.push(
                      <ul key={`ul-${elements.length}`} className="list-disc pl-5 space-y-2 text-slate-700 font-medium text-xs sm:text-sm my-3">
                        {listBuffer.map((item, idx) => (
                          <li key={idx}>{renderFormattedInline(item.text)}</li>
                        ))}
                      </ul>
                    );
                  }
                  listBuffer = [];
                }
              };

              const flushTable = () => {
                if (tableBuffer.length > 0) {
                  const rows = tableBuffer.map((r) => r.split('|').map((c) => c.trim()).filter((c) => c !== ''));
                  const dataRows = rows.filter((r) => !r.every((cell) => /^[:\-\s]+$/.test(cell)));

                  if (dataRows.length > 0) {
                    const headerRow = dataRows[0];
                    const bodyRows = dataRows.slice(1);

                    elements.push(
                      <div key={`tbl-${elements.length}`} className="my-6 overflow-x-auto rounded-2xl border border-slate-200 shadow-xs bg-white">
                        <table className="w-full text-left text-xs sm:text-sm">
                          <thead>
                            <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-900 font-bold">
                              {headerRow.map((cell, idx) => (
                                <th key={idx} className="p-3.5 sm:p-4">{renderFormattedInline(cell)}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                            {bodyRows.map((r, rIdx) => (
                              <tr key={rIdx} className="hover:bg-slate-50 transition-colors">
                                {r.map((cell, cIdx) => (
                                  <td key={cIdx} className="p-3.5 sm:p-4">{renderFormattedInline(cell)}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  }
                  tableBuffer = [];
                }
              };

              lines.forEach((line, index) => {
                const trimmed = line.trim();

                if (trimmed.startsWith('|')) {
                  flushList();
                  tableBuffer.push(trimmed);
                  return;
                } else {
                  flushTable();
                }

                if (/^\d+\.\s+/.test(trimmed)) {
                  if (listBuffer.length > 0 && listBuffer[0].type !== 'ol') flushList();
                  listBuffer.push({ type: 'ol', text: trimmed.replace(/^\d+\.\s+/, '') });
                  return;
                } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                  if (listBuffer.length > 0 && listBuffer[0].type !== 'ul') flushList();
                  listBuffer.push({ type: 'ul', text: trimmed.replace(/^[-*]\s+/, '') });
                  return;
                } else {
                  flushList();
                }

                const imgMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
                if (imgMatch) {
                  const altText = imgMatch[1];
                  const imgSrc = imgMatch[2];
                  elements.push(
                    <figure key={`img-${index}`} className="my-6 space-y-2">
                      <div className="relative h-64 sm:h-80 md:h-96 w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-xs">
                        <Image
                          src={imgSrc}
                          alt={altText || 'Hình ảnh minh họa sản phẩm'}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      </div>
                      {altText && (
                        <figcaption className="text-center text-xs font-medium text-slate-500 italic">
                          {altText}
                        </figcaption>
                      )}
                    </figure>
                  );
                } else if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
                  elements.push(<hr key={index} className="my-6 border-slate-200" />);
                } else if (trimmed.startsWith('## ')) {
                  elements.push(
                    <h2 key={index} className="text-xl sm:text-2xl font-bold text-slate-900 pt-6 pb-2 border-b border-slate-200 my-4 tracking-tight">
                      {renderFormattedInline(trimmed.replace('## ', ''))}
                    </h2>
                  );
                } else if (trimmed.startsWith('### ')) {
                  elements.push(
                    <h3 key={index} className="text-lg sm:text-xl font-bold text-slate-900 pt-5 pb-1 my-3 tracking-tight">
                      {renderFormattedInline(trimmed.replace('### ', ''))}
                    </h3>
                  );
                } else if (trimmed.startsWith('#### ')) {
                  elements.push(
                    <h4 key={index} className="text-base sm:text-lg font-bold text-slate-900 pt-3 pb-1 my-2">
                      {renderFormattedInline(trimmed.replace('#### ', ''))}
                    </h4>
                  );
                } else if (trimmed.startsWith('> ')) {
                  elements.push(
                    <div key={index} className="my-4 p-4 bg-primary-50/70 border-l-4 border-primary-500 rounded-r-2xl text-xs sm:text-sm font-medium text-slate-800 shadow-2xs">
                      {renderFormattedInline(trimmed.replace('> ', ''))}
                    </div>
                  );
                } else if (trimmed !== '') {
                  elements.push(
                    <p key={index} className="text-slate-700 text-xs sm:text-sm font-medium leading-relaxed my-2.5">
                      {renderFormattedInline(trimmed)}
                    </p>
                  );
                }
              });

              flushList();
              flushTable();

              return elements;
            })()}

            {/* Share & Action Bar */}
            <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Thẻ:</span>
                {post.tags.map((tag, idx) => (
                  <span key={idx} className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold">
                    #{tag}
                  </span>
                ))}
              </div>

              <button
                onClick={handleShare}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
                <span>{copied ? 'Đã Sao Chép Link' : 'Chia Sẻ Bài Viết'}</span>
              </button>
            </div>
          </div>

          {/* Order / Consultation Call to Action Banner */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-3xl p-6 sm:p-8 border border-slate-700 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center sm:text-left">
              <h3 className="text-lg font-bold">Cần Tư Vấn Nguồn Hàng &amp; Dự Toán Cước Vận Chuyển?</h3>
              <p className="text-xs text-slate-300">Đội ngũ OrderChinaViet luôn sẵn sàng hỗ trợ đàm phán giá sỉ 1688 và làm thủ tục chính ngạch 24/7.</p>
            </div>
            <Link
              href={`/${locale}/services/1688`}
              className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-xl shadow-md transition-all shrink-0 cursor-pointer flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Tạo Đơn Hàng Mới</span>
            </Link>
          </div>

          {/* Related Articles Grid */}
          {relatedPosts.length > 0 && (
            <div className="space-y-4 pt-6">
              <h3 className="text-lg font-bold text-slate-900">Bài Viết Liên Quan Khác</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {relatedPosts.map((rPost) => (
                  <Link
                    key={rPost.id}
                    href={`/${locale}/blog/${rPost.slug}`}
                    className="bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-md transition-all space-y-3 group"
                  >
                    <div className="relative h-32 w-full rounded-xl overflow-hidden bg-slate-100">
                      <Image src={rPost.coverImage} alt={rPost.title} fill unoptimized className="object-cover group-hover:scale-105 transition-transform" />
                    </div>
                    <div className="text-[10px] font-bold text-primary-600">{rPost.category}</div>
                    <h4 className="font-bold text-xs text-slate-900 group-hover:text-primary-600 leading-snug line-clamp-2">{rPost.title}</h4>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </article>
      </main>

      <Footer locale={locale as any} dict={null} />
    </div>
  );
}


