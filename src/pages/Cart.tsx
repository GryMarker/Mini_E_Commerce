import { useCart } from '../lib/CartContext';
import { motion } from 'motion/react';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fadeUpItem, pageTransition, staggerContainer } from '../lib/animations';

export default function Cart({ session }: { session: any }) {
  const { items, removeFromCart, updateQuantity } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const navigate = useNavigate();

  const total = items.reduce((sum, item) => sum + item.price * item.amount, 0);

  const handleCheckout = async () => {
    if (!session) {
      navigate('/auth');
      return;
    }
    setIsCheckingOut(true);
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          items: items.map((item) => ({ id: item.id, amount: item.amount })),
        }),
      });

      const sessionData = await response.json();
      if (sessionData.error) throw new Error(sessionData.error);
      if (!sessionData.url) {
        throw new Error('Checkout session URL was not returned.');
      }
      window.location.href = sessionData.url;
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error occurred during checkout');
    }
    setIsCheckingOut(false);
  };

  if (items.length === 0) {
    return (
      <motion.div {...pageTransition} className="flex flex-col items-center justify-center py-24 text-center bg-[#FFFFFF] rounded-[40px] border border-[#E2DED0] shadow-sm">
        <div className="w-20 h-20 bg-[#F9F7F2] rounded-full flex items-center justify-center mb-6">
          <ShoppingBag className="w-10 h-10 text-[#D9D4C7]" />
        </div>
        <h2 className="text-3xl font-serif italic text-[#43423E] mb-2">Your cart is empty</h2>
        <p className="text-[#8C887D] mb-8">Looks like you haven't added any items yet.</p>
        <a href="/" className="bg-[#5C6347] text-[#F9F7F2] px-8 py-4 rounded-2xl font-medium hover:bg-[#4a5039] transition-colors">
          Start Shopping
        </a>
      </motion.div>
    );
  }

  return (
    <motion.div {...pageTransition} className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-serif italic text-[#43423E] mb-8">Shopping Cart</h1>
      
      <div className="bg-[#FFFFFF] rounded-[40px] border border-[#E2DED0] overflow-hidden shadow-sm">
        <motion.ul variants={staggerContainer} initial="hidden" animate="show" className="divide-y divide-[#E2DED0]">
          {items.map((item) => (
            <motion.li key={item.id} variants={fadeUpItem} className="p-5 sm:p-8 flex flex-col sm:flex-row sm:items-center gap-5">
              <div className="flex items-center gap-4 flex-1">
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-[#E6E2D8] shrink-0">
                  {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-cover" />}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-[#8C887D] font-bold">{item.category || 'Product'}</p>
                  <h3 className="font-serif italic text-2xl text-[#43423E]">{item.name}</h3>
                  <div className="mt-2 flex items-center gap-4 text-sm text-[#8C887D]">
                    <span className="font-medium">${item.price} each</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-5">
                <div className="flex items-center bg-[#F9F7F2] border border-[#E2DED0] rounded-2xl h-11">
                  <motion.button
                    onClick={() => item.amount === 1 ? removeFromCart(item.id) : updateQuantity(item.id, item.amount - 1)}
                    whileTap={{ scale: 0.9 }}
                    className="w-10 h-full grid place-items-center text-[#5C6347]"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-4 h-4" />
                  </motion.button>
                  <span className="w-10 text-center font-bold text-[#43423E]">{item.amount}</span>
                  <motion.button
                    onClick={() => updateQuantity(item.id, item.amount + 1)}
                    whileTap={{ scale: 0.9 }}
                    className="w-10 h-full grid place-items-center text-[#5C6347]"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-4 h-4" />
                  </motion.button>
                </div>
                <span className="font-serif text-2xl text-[#5C6347]">${item.price * item.amount}</span>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="text-[#D9D4C7] hover:text-[#5C6347] transition-colors p-2"
                  aria-label="Remove item"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </motion.li>
          ))}
        </motion.ul>
        
        <div className="bg-[#F0EDE4] p-8 sm:p-10 border-t border-[#E2DED0]">
          <div className="flex justify-between items-center mb-8">
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#8C887D] font-bold">Subtotal</span>
            <span className="text-3xl font-serif text-[#43423E]">${total.toFixed(2)}</span>
          </div>
          
          <motion.button
            onClick={handleCheckout}
            disabled={isCheckingOut}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-center bg-[#5C6347] text-[#F9F7F2] px-6 py-4 rounded-2xl font-medium hover:bg-[#4a5039] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg"
          >
            {isCheckingOut ? 'Processing...' : 'Proceed to Checkout'}
          </motion.button>
          {!session && (
            <p className="text-[10px] uppercase tracking-[0.2em] text-center text-[#8C887D] font-bold mt-4">Checkout will take you to sign in first.</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
