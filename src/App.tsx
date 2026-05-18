/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ShoppingCart, Package, User, FileText, LogOut } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import Home from './pages/Home';
import Cart from './pages/Cart';
import Success from './pages/Success';
import Invoices from './pages/Invoices';
import InvoiceDetail from './pages/InvoiceDetail';
import ProductDetail from './pages/ProductDetail';
import AuthParams from './pages/Auth';
import { useCart } from './lib/CartContext';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const { items } = useCart();
  const cartCount = items.reduce((sum, item) => sum + item.amount, 0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <Router>
      <div className="min-h-screen bg-[#F9F7F2] text-[#2D2D2A] flex flex-col font-sans">
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className="bg-[#F0EDE4] border-b border-[#E2DED0] sticky top-0 z-10 w-full"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center min-h-16 py-3 gap-4">
              <div className="flex">
                <Link to="/" className="flex items-center gap-2 text-xl font-serif italic text-[#5C6347]">
                  <Package className="h-6 w-6 text-[#5C6347]" />
                  My Mini-E Commerce
                </Link>
              </div>
              <div className="flex items-center gap-3 sm:gap-6 flex-wrap justify-end">
                <Link to="/cart" className="relative text-[#8C887D] hover:text-[#5C6347] flex items-center gap-1 transition-colors">
                  <ShoppingCart className="h-5 w-5" />
                  <span className="text-[10px] uppercase tracking-[0.2em] font-bold">Cart</span>
                  {cartCount > 0 && (
                    <span className="absolute -top-3 -right-3 min-w-5 h-5 px-1 rounded-full bg-[#5C6347] text-[#F9F7F2] text-[10px] font-bold grid place-items-center">
                      {cartCount}
                    </span>
                  )}
                </Link>
                {session ? (
                  <>
                    <Link to="/invoices" className="text-[#8C887D] hover:text-[#5C6347] flex items-center gap-1 transition-colors">
                      <FileText className="h-5 w-5" />
                      <span className="text-[10px] uppercase tracking-[0.2em] font-bold">Invoices</span>
                    </Link>
                    <button onClick={handleLogout} className="text-[#8C887D] hover:text-[#5C6347] flex items-center gap-1 transition-colors">
                      <LogOut className="h-5 w-5" />
                      <span className="text-[10px] uppercase tracking-[0.2em] font-bold">Logout</span>
                    </button>
                  </>
                ) : (
                  <Link to="/auth" className="text-[#8C887D] hover:text-[#5C6347] flex items-center gap-1 transition-colors">
                    <User className="h-5 w-5" />
                    <span className="text-[10px] uppercase tracking-[0.2em] font-bold">Sign In</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </motion.header>

        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart session={session} />} />
            <Route path="/success" element={<Success />} />
            <Route path="/invoices" element={<Invoices session={session} />} />
            <Route path="/invoices/:id" element={<InvoiceDetail session={session} />} />
            <Route path="/auth" element={<AuthParams />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
