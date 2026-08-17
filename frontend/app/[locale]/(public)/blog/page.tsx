'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, BookOpen, Clock, ArrowRight, Filter } from 'lucide-react';
import { PageHeroBanner } from '@/components/common/PageHeroBanner';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { FloatingContact } from '@/components/common/FloatingContact';
import { blogStore, BlogPost } from '@/lib/blog-store';

export default function BlogListingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    blogStore.fetchPosts().then(setPosts).catch(() => setPosts([])).finally(() => setLoading(false));
  }, []);

  const categories = ['ALL', ...Array.from(new Set(posts.map((p) => p.category)))];

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'ALL' || post.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const featuredPost = posts.find((p) => p.featured) || posts[0];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900  flex flex-col antialiased relative">
      <Header locale={locale as any} dict={null} />

      <main className="flex-1 pb-16">
        {/* Banner Section */}
        <PageHeroBanner
          badge="Cẩm Nang & Xu Hướng Thị Trường"
          title="Blog Kiến Thức & Xu Hướng Nhập Hàng Trung Quốc"
          summary="Tổng hợp những bí quyết tìm nguồn hàng 1688, Taobao, Tmall giá gốc, quy trình vận chuyển logistics, phân tích thị trường và cẩm nang kinh doanh từ OrderChinaViet."
          breadcrumbs={[{ label: 'Blog Cẩm Nang' }]}
          bgImage="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=85"
        >
          {/* Search Input Bar */}
          <div className="pt-2 max-w-xl">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm bài viết (1688, Taobao, chính ngạch, cước phí, xu hướng...)"
                className="w-full bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-slate-300 rounded-2xl pl-11 pr-4 py-3 text-xs sm:text-sm outline-none focus:border-primary-400 focus:bg-white/15 transition-all font-medium shadow-inner"
              />
            </div>
          </div>
        </PageHeroBanner>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Category Filter Badges */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <Filter className="w-4 h-4 text-slate-400 shrink-0 mr-1" />
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${selectedCategory === cat
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
              >
                {cat === 'ALL' ? 'Tất Cả Bài Viết' : cat}
              </button>
            ))}
          </div>

          {/* Featured Hero Article Banner */}
          {featuredPost && selectedCategory === 'ALL' && !searchQuery && (
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center group hover:shadow-md transition-shadow">
              <div className="relative h-64 md:h-80 w-full rounded-2xl overflow-hidden bg-slate-100">
                <Image
                  src={featuredPost.coverImage}
                  alt={featuredPost.title}
                  fill
                  unoptimized
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-4 left-4 bg-primary-600 text-white px-3 py-1 rounded-full text-[11px] font-bold shadow-xs">
                  Nổi Bật
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-primary-50 text-primary-700 font-bold border border-primary-200">
                    {featuredPost.category}
                  </span>
                  <span className="flex items-center gap-1 text-slate-500 font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    {featuredPost.readTime}
                  </span>
                </div>

                <h2 className="text-xl md:text-2xl font-bold text-slate-900 group-hover:text-primary-600 transition-colors leading-snug">
                  <Link href={`/${locale}/blog/${featuredPost.slug}`}>
                    {featuredPost.title}
                  </Link>
                </h2>

                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed line-clamp-3 font-medium">
                  {featuredPost.summary}
                </p>

                <div className="pt-2">
                  <Link
                    href={`/${locale}/blog/${featuredPost.slug}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                  >
                    <span>Đọc Bài Viết Này</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Grid of 10 Blog Cards */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-2xl h-80 border border-slate-200" />
              ))}
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
              <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-sm font-bold text-slate-900">Không tìm thấy bài viết phù hợp</h3>
              <p className="text-xs text-slate-500">Thử tìm kiếm với từ khóa khác hoặc bấm xem tất cả bài viết.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.map((post) => (
                <article
                  key={post.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group cursor-pointer"
                >
                  <Link href={`/${locale}/blog/${post.slug}`} className="block relative h-48 w-full bg-slate-100 overflow-hidden">
                    <Image
                      src={post.coverImage}
                      alt={post.title}
                      fill
                      unoptimized
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs text-slate-800 px-2.5 py-1 rounded-lg text-[10px] font-bold border border-slate-200/80 shadow-xs">
                      {post.category}
                    </div>
                  </Link>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{post.readTime}</span>
                      </div>

                      <h3 className="font-bold text-sm text-slate-900 group-hover:text-primary-600 transition-colors leading-snug line-clamp-2">
                        <Link href={`/${locale}/blog/${post.slug}`}>
                          {post.title}
                        </Link>
                      </h3>

                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 font-medium">
                        {post.summary}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {post.tags.slice(0, 2).map((t, idx) => (
                          <span key={idx} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold">
                            #{t}
                          </span>
                        ))}
                      </div>

                      <Link
                        href={`/${locale}/blog/${post.slug}`}
                        className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                      >
                        <span>Đọc tiếp</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer locale={locale as any} dict={null} />
    </div>
  );
}
