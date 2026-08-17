'use client';

import { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  Search,
  BookOpen,
  HelpCircle,
  ShieldCheck,
  Bell,
  Package,
  X,
  Save,
  Clock,
  Eye,
} from 'lucide-react';
import { blogStore, BlogPost } from '@/lib/blog-store';
import { apiFetch } from '@/lib/api-client';

export default function AdminCMSPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'BLOG' | 'SERVICES' | 'GUIDES' | 'POLICIES'>('BLOG');
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [servicesData, setServicesData] = useState<any[]>([]);
  const [guidesData, setGuidesData] = useState<any[]>([]);
  const [policiesData, setPoliciesData] = useState<any[]>([]);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    slug: '',
    category: 'Kinh Nghiệm 1688',
    summary: '',
    coverImage: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80',
    readTime: '6 phút đọc',
    content: '',
    tags: '1688, Logistics, Nhập Hàng',
  });

  const servicesList = [
    { title: 'Đặt Hàng 1688', category: '1688', slug: 'dat-hang-1688', status: 'Xuất bản' },
    { title: 'Đặt Hàng Tmall', category: 'TMALL', slug: 'dat-hang-tmall', status: 'Xuất bản' },
    { title: 'Nhập Hàng Trung Quốc', category: 'NHAP_HANG', slug: 'nhap-hang-trung-quoc', status: 'Xuất bản' },
    { title: 'Vận Chuyển Trung – Việt', category: 'VAN_CHUYEN', slug: 'van-chuyen-trung-viet', status: 'Xuất bản' },
    { title: 'Xuất Nhập Khẩu Chính Ngạch', category: 'XNK', slug: 'xuat-nhap-khau-chinh-ngach', status: 'Xuất bản' },
    { title: 'Thanh Toán Hộ Alipay', category: 'ALIPAY', slug: 'thanh-toan-ho-alipay', status: 'Xuất bản' },
  ];

  const guidesList = [
    { title: 'Hướng Dẫn Đặt Hàng', category: 'DAT_HANG', slug: 'huong-dan-dat-hang', status: 'Xuất bản' },
    { title: 'Hướng Dẫn Nạp Tiền', category: 'NAP_TIEN', slug: 'huong-dan-nap-tien', status: 'Xuất bản' },
    { title: 'Tải App ODH Logistics', category: 'APP', slug: 'tai-app-odh-logistics', status: 'Xuất bản' },
    { title: 'Hướng Dẫn Rút Tiền', category: 'RUT_TIEN', slug: 'huong-dan-rut-tien', status: 'Xuất bản' },
  ];

  const policiesList = [
    { title: 'Chính Sách Mua Hàng', category: 'MUA_HANG', slug: 'chinh-sach-mua-hang', status: 'Xuất bản' },
    { title: 'Chính Sách Khiếu Nại', category: 'KHIEU_NAI', slug: 'chinh-sach-khieu-nai', status: 'Xuất bản' },
    { title: 'Chính Sách Đóng Gỗ', category: 'DONG_GO', slug: 'chinh-sach-dong-go', status: 'Xuất bản' },
    { title: 'Chính Sách Kiểm Hàng', category: 'KIEM_HANG', slug: 'chinh-sach-kiem-hang', status: 'Xuất bản' },
  ];

  const refreshBlogPosts = () => {
    setBlogPosts(blogStore.getPosts());
  };

  useEffect(() => {
    blogStore.fetchPosts().then(setBlogPosts).catch(() => setBlogPosts([])).finally(() => setLoading(false));
    Promise.all(['services', 'guides', 'policies'].map((resource) => apiFetch(`/cms/${resource}`, {}, false).then((response) => response.json())))
      .then(([services, guides, policies]) => { setServicesData(services.data || []); setGuidesData(guides.data || []); setPoliciesData(policies.data || []); });
  }, []);

  const handleOpenAddModal = () => {
    setEditingPostId(null);
    setForm({
      title: '',
      slug: '',
      category: 'Kinh Nghiệm 1688',
      summary: '',
      coverImage: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80',
      readTime: '6 phút đọc',
      content: '',
      tags: '1688, Logistics, Nhập Hàng',
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (post: BlogPost) => {
    setEditingPostId(post.id);
    setForm({
      title: post.title,
      slug: post.slug,
      category: post.category,
      summary: post.summary,
      coverImage: post.coverImage,
      readTime: post.readTime,
      content: post.content,
      tags: post.tags.join(', '),
    });
    setShowModal(true);
  };

  const handleDeleteBlogPost = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa bài viết này khỏi hệ thống Blog?')) {
      blogStore.deletePost(id);
      refreshBlogPosts();
    }
  };

  const handleSaveBlogPost = (e: React.FormEvent) => {
    e.preventDefault();
    const tagsArray = form.tags.split(',').map((t) => t.trim()).filter(Boolean);
    const slugValue = form.slug || form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    if (editingPostId) {
      blogStore.updatePost(editingPostId, {
        title: form.title,
        slug: slugValue,
        category: form.category,
        summary: form.summary,
        coverImage: form.coverImage,
        readTime: form.readTime,
        content: form.content,
        tags: tagsArray,
      });
    } else {
      blogStore.createPost({
        title: form.title,
        slug: slugValue,
        category: form.category,
        summary: form.summary,
        coverImage: form.coverImage,
        readTime: form.readTime,
        content: form.content,
        tags: tagsArray,
      });
    }

    refreshBlogPosts();
    setShowModal(false);
  };

  const filteredBlogPosts = blogPosts.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6 text-slate-900  animate-pulse">
        <div className="bg-slate-200 h-28 rounded-2xl sm:rounded-3xl w-full" />
        <div className="bg-slate-200 h-12 rounded-2xl w-full" />
        <div className="bg-slate-200 h-64 rounded-2xl sm:rounded-3xl w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 text-slate-900  animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Quản Lý Bài Viết Blog &amp; Nội Dung CMS</h1>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Tạo mới, chỉnh sửa nội dung bài viết cẩm nang kinh nghiệm 1688/Taobao, thông quan chính ngạch và quản lý bài viết hiển thị trên trang Blog.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="w-full sm:w-auto px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Bài Viết Mới</span>
        </button>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 font-bold text-xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('BLOG')}
          className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${activeTab === 'BLOG'
              ? 'bg-primary-600 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
        >
          Bài Viết Blog ({blogPosts.length})
        </button>
        <button
          onClick={() => setActiveTab('SERVICES')}
          className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${activeTab === 'SERVICES'
              ? 'bg-primary-600 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
        >
          Trang Dịch Vụ ({servicesData.length})
        </button>
        <button
          onClick={() => setActiveTab('GUIDES')}
          className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${activeTab === 'GUIDES'
              ? 'bg-primary-600 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
        >
          Trang Hướng Dẫn ({guidesData.length})
        </button>
        <button
          onClick={() => setActiveTab('POLICIES')}
          className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${activeTab === 'POLICIES'
              ? 'bg-primary-600 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
        >
          Trang Chính Sách ({policiesData.length})
        </button>
      </div>

      {/* Main Table View */}
      {activeTab === 'BLOG' ? (
        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm bài viết theo tiêu đề..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-primary-500 font-medium"
              />
            </div>
            <span className="text-xs text-slate-500 font-medium">Tổng cộng {filteredBlogPosts.length} bài viết</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <th className="pb-3">Bài Viết</th>
                  <th className="pb-3">Danh Mục</th>
                  <th className="pb-3">Thời Gian Đọc</th>
                  <th className="pb-3 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredBlogPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-10 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200 relative">
                          <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 truncate max-w-md">{post.title}</div>
                          <div className="text-[10px] text-slate-400 font-mono">/blog/{post.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 font-bold text-primary-700">{post.category}</td>
                    <td className="py-3.5 text-slate-500">{post.readTime}</td>
                    <td className="py-3.5 text-right space-x-2">
                      <button
                        onClick={() => window.open(`/vi/blog/${post.slug}`, '_blank')}
                        className="p-1.5 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                        title="Xem bài viết"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(post)}
                        className="p-1.5 text-slate-400 hover:text-primary-600 transition-colors cursor-pointer"
                        title="Sửa"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteBlogPost(post.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <th className="pb-3">Tiêu Đề Trang</th>
                  <th className="pb-3">Mã Danh Mục</th>
                  <th className="pb-3">Đường Dẫn Slug</th>
                  <th className="pb-3">Trạng Thái</th>
                  <th className="pb-3 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {(activeTab === 'SERVICES' ? servicesData : activeTab === 'GUIDES' ? guidesData : policiesData).map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 font-bold text-slate-900">{item.title}</td>
                    <td className="py-3.5 font-mono text-slate-600">{item.category}</td>
                    <td className="py-3.5 font-mono text-primary-600">/{item.slug}</td>
                    <td className="py-3.5">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3.5 text-right space-x-2">
                      <button className="p-1.5 text-slate-400 hover:text-primary-600 transition-colors cursor-pointer">
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: THÊM / SỬA BÀI VIẾT BLOG */}
      {showModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">
                {editingPostId ? 'Chỉnh Sửa Bài Viết Blog' : 'Thêm Bài Viết Blog Mới'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBlogPost} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tiêu Đề Bài Viết *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Kinh Nghiệm Nhập Hàng..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:border-primary-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Danh Mục Blog</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:border-primary-500 cursor-pointer"
                  >
                    <option value="Kinh Nghiệm 1688">Kinh Nghiệm 1688</option>
                    <option value="Xuất Nhập Khẩu">Xuất Nhập Khẩu</option>
                    <option value="Mẹo Đặt Hàng">Mẹo Đặt Hàng</option>
                    <option value="Vận Chuyển">Vận Chuyển</option>
                    <option value="Hướng Dẫn Cước">Hướng Dẫn Cước</option>
                    <option value="Thanh Toán Hộ">Thanh Toán Hộ</option>
                    <option value="Gợi Ý Nguồn Hàng">Gợi Ý Nguồn Hàng</option>
                    <option value="Cảnh Báo Rủi Ro">Cảnh Báo Rủi Ro</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Thời Gian Đọc Ước Tính</label>
                  <input
                    type="text"
                    value={form.readTime}
                    onChange={(e) => setForm({ ...form, readTime: e.target.value })}
                    placeholder="6 phút đọc"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Link Ảnh Bìa (Cover Image URL)</label>
                <input
                  type="text"
                  value={form.coverImage}
                  onChange={(e) => setForm({ ...form, coverImage: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tóm Tắt Ngắn (Summary) *</label>
                <textarea
                  rows={2}
                  required
                  value={form.summary}
                  onChange={(e) => setForm({ ...form, summary: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-primary-500 resize-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Thẻ Hashtag (phân cách bằng dấu phẩy)</label>
                <input
                  type="text"
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  placeholder="1688, Logistics, Nhập Hàng"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nội Dung Chi Tiết (Chi tiết bài viết Markdown/Text) *</label>
                <textarea
                  rows={6}
                  required
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder="### 1. Tiêu đề mục&#10;Nội dung chi tiết bài viết..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:outline-none focus:border-primary-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Lưu Bài Viết</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
