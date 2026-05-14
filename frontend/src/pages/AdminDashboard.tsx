import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router-dom';
import { Package, ShoppingBag, Plus, Edit2, Trash2, X, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import Swal from 'sweetalert2';
import ImageUploader from '../component/common/ImageUploader';

interface Product {
  id: string; name: string; name_th?: string; description: string; description_th?: string;
  price: number; stock: number; category: string; images: string[]; is_best_seller: boolean; is_active: boolean; views: number;
}
interface Order {
  id: string; created_at: string; total: number; status: string; payment_status: string;
  profiles: { full_name: string }; items: any[];
}

const CATEGORIES = ['All', 'Rhinoceros', 'Stag', 'Flower'];
const PAGE_SIZES = [5, 10, 20, 50];
const STATUS_OPTIONS = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

const AdminDashboard = () => {
  const { t, i18n } = useTranslation();
  const { user, loading, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');

  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [isEditingProduct, setIsEditingProduct] = useState<Product | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [productForm, setProductForm] = useState<Partial<Product>>({});
  const [productImages, setProductImages] = useState<string[]>([]);

  // Filters
  const [search, setSearch] = useState('');
  const [catTab, setCatTab] = useState('All');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterMinPrice, setFilterMinPrice] = useState('');
  const [filterMaxPrice, setFilterMaxPrice] = useState('');
  const [sortCol, setSortCol] = useState<string>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);

  const fetchProducts = useCallback(async () => {
    try {
      const data = await api.get<{ products: Product[] }>('/products?limit=999');
      setProducts(data.products || []);
    } catch (err: any) { Swal.fire('Error', err.message, 'error'); }
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const data = await api.get<{ orders: Order[] }>('/orders/admin/all');
      setOrders(data.orders || []);
    } catch (err: any) { Swal.fire('Error', err.message, 'error'); }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      if (activeTab === 'products') fetchProducts();
      if (activeTab === 'orders') fetchOrders();
    }
  }, [isAdmin, activeTab, fetchProducts, fetchOrders]);

  if (loading) return null;
  if (!user || !isAdmin) return <Navigate to="/" replace />;

  // ---- Filtering & sorting ----
  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    const name = i18n.language?.startsWith('th') && p.name_th ? p.name_th : p.name;
    const matchSearch = !q || name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) ||
      String(p.price).includes(q) || (p.is_active ? 'active' : 'inactive').includes(q);
    const matchCat = catTab === 'All' || p.category === catTab;
    const matchStatus = !filterStatus || (filterStatus === 'active' ? p.is_active : !p.is_active);
    const matchMin = !filterMinPrice || p.price >= Number(filterMinPrice);
    const matchMax = !filterMaxPrice || p.price <= Number(filterMaxPrice);
    return matchSearch && matchCat && matchStatus && matchMin && matchMax;
  }).sort((a, b) => {
    let av: any = a[sortCol as keyof Product];
    let bv: any = b[sortCol as keyof Product];
    if (sortCol === 'name') {
      av = i18n.language?.startsWith('th') && a.name_th ? a.name_th : a.name;
      bv = i18n.language?.startsWith('th') && b.name_th ? b.name_th : b.name;
    }
    if (av < bv) return sortDir === 'asc' ? -1 : 1;
    if (av > bv) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleSort = (col: string) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };
  const SortIcon = ({ col }: { col: string }) => (
    <span className="ml-1 text-xs opacity-50">{sortCol === col ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}</span>
  );

  const openAdd = () => {
    setProductForm({ category: 'Rhinoceros', is_best_seller: false, is_active: true });
    setProductImages([]);
    setIsAddingProduct(true);
  };

  const openEdit = (p: Product) => {
    setIsEditingProduct(p);
    setProductForm(p);
    setProductImages(p.images || []);
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...productForm, images: productImages };
      if (isEditingProduct) {
        await api.patch(`/products/${isEditingProduct.id}`, payload);
        Swal.fire({ icon: 'success', title: 'Product updated!', timer: 1200, showConfirmButton: false });
      } else {
        await api.post('/products', payload);
        Swal.fire({ icon: 'success', title: 'Product added!', timer: 1200, showConfirmButton: false });
      }
      setIsEditingProduct(null); setIsAddingProduct(false); setProductForm({}); setProductImages([]);
      fetchProducts();
    } catch (err: any) { Swal.fire('Error', err.message, 'error'); }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({ title: 'Deactivate?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#f97316' });
    if (result.isConfirmed) {
      try { await api.delete(`/products/${id}`); fetchProducts(); } catch (err: any) { Swal.fire('Error', err.message, 'error'); }
    }
  };

  const handleOrderStatus = async (id: string, status: string) => {
    try { await api.patch(`/orders/${id}/status`, { status }); fetchOrders(); } catch (err: any) { Swal.fire('Error', err.message, 'error'); }
  };

  const isForm = isAddingProduct || !!isEditingProduct;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 border-l-8 border-orange pl-4 mb-8">Admin Dashboard</h1>

      {/* Main Tabs */}
      <div className="flex space-x-2 mb-8 border-b border-gray-200 dark:border-gray-700">
        {(['products', 'orders'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm rounded-t-xl transition-colors ${activeTab === tab ? 'bg-orange text-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
            {tab === 'products' ? <Package className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
            {t(tab)}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow border border-gray-100 dark:border-gray-700 p-6 min-h-[500px]">

        {/* ===== PRODUCTS TAB ===== */}
        {activeTab === 'products' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {isForm ? (
              /* ---- Product Form ---- */
              <div className="max-w-2xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold dark:text-gray-100">{isEditingProduct ? 'Edit Product' : 'Add Product'}</h2>
                  <button onClick={() => { setIsAddingProduct(false); setIsEditingProduct(null); }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <form onSubmit={handleProductSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Name (EN) *</label>
                      <input required type="text" value={productForm.name || ''} onChange={e => setProductForm(f => ({ ...f, name: e.target.value }))}
                        className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange/50 outline-none dark:bg-gray-700 dark:text-gray-100" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Name (TH)</label>
                      <input type="text" value={productForm.name_th || ''} onChange={e => setProductForm(f => ({ ...f, name_th: e.target.value }))}
                        className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange/50 outline-none dark:bg-gray-700 dark:text-gray-100" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Description (EN) *</label>
                      <textarea required value={productForm.description || ''} onChange={e => setProductForm(f => ({ ...f, description: e.target.value }))}
                        className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 min-h-[80px] focus:ring-2 focus:ring-orange/50 outline-none dark:bg-gray-700 dark:text-gray-100" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Description (TH)</label>
                      <textarea value={productForm.description_th || ''} onChange={e => setProductForm(f => ({ ...f, description_th: e.target.value }))}
                        className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 min-h-[80px] focus:ring-2 focus:ring-orange/50 outline-none dark:bg-gray-700 dark:text-gray-100" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Price (฿) *</label>
                      <input required type="number" min="0" value={productForm.price || ''} onChange={e => setProductForm(f => ({ ...f, price: Number(e.target.value) }))}
                        className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange/50 outline-none dark:bg-gray-700 dark:text-gray-100" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Stock *</label>
                      <input required type="number" min="0" value={productForm.stock ?? 0} onChange={e => setProductForm(f => ({ ...f, stock: Number(e.target.value) }))}
                        className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange/50 outline-none dark:bg-gray-700 dark:text-gray-100" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Category</label>
                      <select value={productForm.category || 'Rhinoceros'} onChange={e => setProductForm(f => ({ ...f, category: e.target.value }))}
                        className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 outline-none dark:bg-gray-700 dark:text-gray-100">
                        {['Rhinoceros', 'Stag', 'Flower'].map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="flex items-center gap-6 mt-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={!!productForm.is_best_seller} onChange={e => setProductForm(f => ({ ...f, is_best_seller: e.target.checked }))} className="accent-orange w-4 h-4" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Best Seller</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={productForm.is_active ?? true} onChange={e => setProductForm(f => ({ ...f, is_active: e.target.checked }))} className="accent-orange w-4 h-4" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Active</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Images (URL or Upload)</label>
                    <ImageUploader images={productImages} onChange={setProductImages} />
                  </div>

                  <button type="submit" className="w-full mt-4 py-3 bg-orange text-white font-bold rounded-xl hover:bg-orange-600 transition-colors shadow-md">
                    {isEditingProduct ? 'Update Product' : 'Save Product'}
                  </button>
                </form>
              </div>
            ) : (
              /* ---- Product List ---- */
              <>
                {/* Category tabs */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {CATEGORIES.map(cat => (
                    <button key={cat} onClick={() => { setCatTab(cat); setPage(1); }}
                      className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all ${catTab === cat ? 'bg-orange text-white border-orange' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-orange hover:text-orange'}`}>
                      {cat}
                    </button>
                  ))}
                  <button onClick={openAdd} className="ml-auto flex items-center gap-1.5 px-4 py-1.5 bg-orange text-white font-bold rounded-full hover:bg-orange-600 transition-colors text-sm">
                    <Plus className="w-4 h-4" /> Add Product
                  </button>
                </div>

                {/* Search + filters */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" placeholder="Search name, category, price, status..." value={search}
                      onChange={e => { setSearch(e.target.value); setPage(1); }}
                      className="w-full pl-9 py-2 text-sm border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange/50 outline-none dark:bg-gray-700 dark:text-gray-100" />
                  </div>
                  <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
                    className="text-sm border dark:border-gray-600 rounded-lg px-3 py-2 outline-none dark:bg-gray-700 dark:text-gray-100">
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                  <input type="number" placeholder="Min ฿" value={filterMinPrice} onChange={e => { setFilterMinPrice(e.target.value); setPage(1); }}
                    className="w-24 text-sm border dark:border-gray-600 rounded-lg px-3 py-2 outline-none dark:bg-gray-700 dark:text-gray-100" />
                  <input type="number" placeholder="Max ฿" value={filterMaxPrice} onChange={e => { setFilterMaxPrice(e.target.value); setPage(1); }}
                    className="w-24 text-sm border dark:border-gray-600 rounded-lg px-3 py-2 outline-none dark:bg-gray-700 dark:text-gray-100" />
                  <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                    className="text-sm border dark:border-gray-600 rounded-lg px-3 py-2 outline-none dark:bg-gray-700 dark:text-gray-100">
                    {PAGE_SIZES.map(s => <option key={s} value={s}>{s} / page</option>)}
                  </select>
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-700">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                      <tr>
                        <th className="p-3 w-16 text-gray-500 dark:text-gray-400">Image</th>
                        <th className="p-3 text-gray-500 dark:text-gray-400 cursor-pointer hover:text-orange" onClick={() => handleSort('name')}>
                          Product <SortIcon col="name" />
                        </th>
                        <th className="p-3 text-gray-500 dark:text-gray-400 cursor-pointer hover:text-orange" onClick={() => handleSort('category')}>
                          Category <SortIcon col="category" />
                        </th>
                        <th className="p-3 text-gray-500 dark:text-gray-400 cursor-pointer hover:text-orange" onClick={() => handleSort('price')}>
                          Price <SortIcon col="price" />
                        </th>
                        <th className="p-3 text-gray-500 dark:text-gray-400 cursor-pointer hover:text-orange" onClick={() => handleSort('stock')}>
                          Stock <SortIcon col="stock" />
                        </th>
                        <th className="p-3 text-gray-500 dark:text-gray-400 cursor-pointer hover:text-orange" onClick={() => handleSort('is_active')}>
                          Status <SortIcon col="is_active" />
                        </th>
                        <th className="p-3 text-gray-500 dark:text-gray-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginated.map(p => (
                        <tr key={p.id} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-700/30">
                          <td className="p-3">
                            {p.images?.[0] ? (
                              <img src={p.images[0]} alt={p.name} className="w-12 h-12 object-cover rounded-lg" />
                            ) : (
                              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center text-xl">🪲</div>
                            )}
                          </td>
                          <td className="p-3">
                            <div className="font-semibold text-gray-800 dark:text-gray-200">
                              {i18n.language?.startsWith('th') && p.name_th ? p.name_th : p.name}
                            </div>
                            {p.is_best_seller && <span className="text-xs text-orange font-semibold">⭐ Best Seller</span>}
                          </td>
                          <td className="p-3 text-gray-600 dark:text-gray-400">{p.category}</td>
                          <td className="p-3 text-gray-600 dark:text-gray-400 font-semibold">฿{p.price.toLocaleString()}</td>
                          <td className="p-3 text-gray-600 dark:text-gray-400">{p.stock}</td>
                          <td className="p-3">
                            <span className={`px-2 py-1 text-xs rounded-full font-semibold ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {p.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="p-3 flex gap-1">
                            <button onClick={() => openEdit(p)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(p.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {paginated.length === 0 && (
                        <tr><td colSpan={7} className="p-8 text-center text-gray-400">No products found</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4 text-sm text-gray-500 dark:text-gray-400">
                  <span>Showing {Math.min((page - 1) * pageSize + 1, filtered.length)}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1).map((n, i, arr) => (
                      <React.Fragment key={n}>
                        {i > 0 && arr[i - 1] !== n - 1 && <span className="px-1">…</span>}
                        <button onClick={() => setPage(n)}
                          className={`w-8 h-8 rounded-lg font-semibold ${page === n ? 'bg-orange text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                          {n}
                        </button>
                      </React.Fragment>
                    ))}
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* ===== ORDERS TAB ===== */}
        {activeTab === 'orders' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-700">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="p-4 text-gray-500 dark:text-gray-400">ID / Date</th>
                    <th className="p-4 text-gray-500 dark:text-gray-400">Customer</th>
                    <th className="p-4 text-gray-500 dark:text-gray-400">Total</th>
                    <th className="p-4 text-gray-500 dark:text-gray-400">Payment</th>
                    <th className="p-4 text-gray-500 dark:text-gray-400">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50/50">
                      <td className="p-4">
                        <div className="font-mono text-xs text-gray-800 dark:text-gray-200">{o.id.slice(0, 8)}...</div>
                        <div className="text-xs text-gray-400">{new Date(o.created_at).toLocaleDateString()}</div>
                      </td>
                      <td className="p-4 text-gray-600 dark:text-gray-400">{o.profiles?.full_name || 'Unknown'}</td>
                      <td className="p-4 font-bold text-orange">฿{o.total?.toLocaleString()}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 text-xs rounded-full font-semibold ${o.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {o.payment_status?.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4">
                        <select value={o.status} onChange={e => handleOrderStatus(o.id, e.target.value)}
                          className="border dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-800 outline-none focus:ring-1 focus:ring-orange dark:text-gray-200">
                          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr><td colSpan={5} className="p-8 text-center text-gray-400">No orders found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
