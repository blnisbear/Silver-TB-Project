import React, { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { Package, ShoppingBag, Plus, Edit2, Trash2, X, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import Swal from 'sweetalert2';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  images: string[];
  is_best_seller: boolean;
  is_active: boolean;
  views: number;
}

interface Order {
  id: string;
  created_at: string;
  user_id: string;
  total: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  payment_status: string;
  shipping_address: string;
  profiles: { full_name: string };
  items: any[];
}

const AdminDashboard = () => {
  const { user, loading, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');

  // Products State
  const [products, setProducts] = useState<Product[]>([]);
  const [isEditingProduct, setIsEditingProduct] = useState<Product | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [productForm, setProductForm] = useState<Partial<Product>>({});

  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);

  const fetchProducts = useCallback(async () => {
    try {
      // Using high limit for admin simple view
      const data = await api.get<{ products: Product[] }>('/products?limit=100');
      setProducts(data.products || []);
    } catch (err: any) {
      Swal.fire('Error', err.message, 'error');
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const data = await api.get<{ orders: Order[] }>('/orders/admin/all');
      setOrders(data.orders || []);
    } catch (err: any) {
      Swal.fire('Error', err.message, 'error');
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      if (activeTab === 'products') fetchProducts();
      if (activeTab === 'orders') fetchOrders();
    }
  }, [isAdmin, activeTab, fetchProducts, fetchOrders]);

  if (loading) return null;
  if (!user || !isAdmin) return <Navigate to="/" replace />;

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditingProduct) {
        await api.patch(`/products/${isEditingProduct.id}`, productForm);
        Swal.fire('Success', 'Product updated!', 'success');
      } else {
        await api.post('/products', productForm);
        Swal.fire('Success', 'Product added!', 'success');
      }
      setIsEditingProduct(null);
      setIsAddingProduct(false);
      setProductForm({});
      fetchProducts();
    } catch (err: any) {
      Swal.fire('Error', err.message, 'error');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "This will deactivate the product.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f97316',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, deactivate it!'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/products/${id}`);
        Swal.fire('Deactivated!', 'Product deactivated.', 'success');
        fetchProducts();
      } catch (err: any) {
        Swal.fire('Error', err.message, 'error');
      }
    }
  };

  const handleUpdateOrderStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/orders/${id}/status`, { status });
      Swal.fire({ title: 'Status updated', icon: 'success', timer: 1000, showConfirmButton: false });
      fetchOrders();
    } catch (err: any) {
      Swal.fire('Error', err.message, 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 border-l-8 border-orange pl-4">Admin Dashboard</h1>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 mb-8 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('products')}
          className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm rounded-t-xl transition-colors ${
            activeTab === 'products' ? 'bg-orange text-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          }`}
        >
          <Package className="w-5 h-5" /> Products
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm rounded-t-xl transition-colors ${
            activeTab === 'orders' ? 'bg-orange text-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          }`}
        >
          <ShoppingBag className="w-5 h-5" /> Orders
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl shadow border border-gray-100 p-6 min-h-[500px]">
        {activeTab === 'products' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {!isAddingProduct && !isEditingProduct ? (
              <>
                <div className="flex justify-end mb-4">
                  <button
                    onClick={() => { setProductForm({ category: 'Rhinoceros', is_best_seller: false, is_active: true }); setIsAddingProduct(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-orange text-white font-bold rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Add Product
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b-2 border-gray-100 bg-gray-50/50">
                        <th className="p-4 font-semibold text-gray-600">Product</th>
                        <th className="p-4 font-semibold text-gray-600">Category</th>
                        <th className="p-4 font-semibold text-gray-600">Price</th>
                        <th className="p-4 font-semibold text-gray-600">Stock</th>
                        <th className="p-4 font-semibold text-gray-600">Status</th>
                        <th className="p-4 font-semibold text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map(p => (
                        <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                          <td className="p-4">
                            <div className="font-semibold text-gray-800">{p.name}</div>
                            <div className="text-xs text-gray-400">{p.is_best_seller ? 'Best Seller' : ''}</div>
                          </td>
                          <td className="p-4 text-gray-600">{p.category}</td>
                          <td className="p-4 text-gray-600">฿{p.price.toLocaleString()}</td>
                          <td className="p-4 text-gray-600">{p.stock}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 text-xs rounded-full font-semibold ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {p.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="p-4 flex gap-2">
                            <button onClick={() => { setIsEditingProduct(p); setProductForm(p); }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteProduct(p.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {products.length === 0 && (
                        <tr><td colSpan={6} className="p-8 text-center text-gray-400">No products found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="max-w-2xl mx-auto border border-gray-100 rounded-xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">{isEditingProduct ? 'Edit Product' : 'Add Product'}</h2>
                  <button onClick={() => { setIsAddingProduct(false); setIsEditingProduct(null); }} className="p-2 hover:bg-gray-100 rounded-full">
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <form onSubmit={handleProductSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-1 text-gray-700">Name</label>
                      <input required type="text" value={productForm.name || ''} onChange={e => setProductForm({ ...productForm, name: e.target.value })} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange/50 outline-none" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-1 text-gray-700">Description</label>
                      <textarea required value={productForm.description || ''} onChange={e => setProductForm({ ...productForm, description: e.target.value })} className="w-full border rounded-lg px-3 py-2 min-h-[100px] focus:ring-2 focus:ring-orange/50 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700">Price (฿)</label>
                      <input required type="number" min="0" value={productForm.price || ''} onChange={e => setProductForm({ ...productForm, price: Number(e.target.value) })} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange/50 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700">Stock</label>
                      <input required type="number" min="0" value={productForm.stock || 0} onChange={e => setProductForm({ ...productForm, stock: Number(e.target.value) })} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange/50 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700">Category</label>
                      <select value={productForm.category || 'Rhinoceros'} onChange={e => setProductForm({ ...productForm, category: e.target.value })} className="w-full border rounded-lg px-3 py-2 outline-none">
                        <option value="Rhinoceros">Rhinoceros</option>
                        <option value="Stag">Stag</option>
                        <option value="Flower">Flower</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-4 mt-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={productForm.is_best_seller || false} onChange={e => setProductForm({ ...productForm, is_best_seller: e.target.checked })} className="accent-orange w-4 h-4" />
                        <span className="text-sm font-medium text-gray-700">Best Seller</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={productForm.is_active ?? true} onChange={e => setProductForm({ ...productForm, is_active: e.target.checked })} className="accent-orange w-4 h-4" />
                        <span className="text-sm font-medium text-gray-700">Active</span>
                      </label>
                    </div>
                    <div className="col-span-2">
                       <label className="block text-sm font-medium mb-1 text-gray-700">Image URL (Optional)</label>
                       <input type="text" placeholder="https://..." value={productForm.images?.[0] || ''} onChange={e => setProductForm({ ...productForm, images: e.target.value ? [e.target.value] : [] })} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange/50 outline-none" />
                    </div>
                  </div>
                  <button type="submit" className="w-full mt-6 py-3 bg-orange text-white font-bold rounded-xl hover:bg-orange-600 transition-colors shadow-md">
                    {isEditingProduct ? 'Update Product' : 'Save Product'}
                  </button>
                </form>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'orders' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-100 bg-gray-50/50">
                    <th className="p-4 font-semibold text-gray-600">ID / Date</th>
                    <th className="p-4 font-semibold text-gray-600">Customer</th>
                    <th className="p-4 font-semibold text-gray-600">Total</th>
                    <th className="p-4 font-semibold text-gray-600">Payment</th>
                    <th className="p-4 font-semibold text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                      <td className="p-4">
                        <div className="font-mono text-sm text-gray-800">{o.id.slice(0,8)}...</div>
                        <div className="text-xs text-gray-400">{new Date(o.created_at).toLocaleDateString()}</div>
                      </td>
                      <td className="p-4 text-gray-600 font-medium">{o.profiles?.full_name || 'Unknown'}</td>
                      <td className="p-4 text-gray-600 font-bold text-orange">฿{o.total.toLocaleString()}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 text-xs rounded-full font-semibold ${o.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {o.payment_status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4">
                        <select 
                          value={o.status}
                          onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                          className="border rounded px-2 py-1 text-sm bg-white outline-none focus:ring-1 focus:ring-orange"
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr><td colSpan={5} className="p-8 text-center text-gray-400">No orders found.</td></tr>
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
