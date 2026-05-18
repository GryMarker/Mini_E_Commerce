import { useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useCart } from '../lib/CartContext';
import { CheckCircle2 } from 'lucide-react';
import { pageTransition } from '../lib/animations';

export default function Success() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { clearCart } = useCart();

  useEffect(() => {
    if (sessionId) {
      clearCart();
    }
  }, [sessionId]);

  return (
    <motion.div {...pageTransition} className="flex flex-col items-center justify-center py-24 text-center max-w-lg mx-auto bg-[#FFFFFF] rounded-[40px] border border-[#E2DED0] shadow-sm mt-8 px-10">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.12, duration: 0.28, ease: 'easeOut' }}
        className="w-24 h-24 bg-[#EBE7DF] rounded-full flex items-center justify-center mb-8 border border-[#D9D4C7]"
      >
        <CheckCircle2 className="w-10 h-10 text-[#5C6347]" />
      </motion.div>
      <h1 className="text-5xl font-serif italic text-[#43423E] mb-4">Payment Successful</h1>
      <p className="text-lg text-[#8C887D] mb-10 leading-relaxed">
        Thank you for your purchase. Your order has been confirmed and the invoice has been generated.
      </p>
      <div className="flex gap-4 w-full justify-center">
        <Link to="/" className="px-8 py-4 bg-[#E2DED0] text-[#5C6347] rounded-2xl font-medium hover:bg-[#D9D4C7] transition-colors flex-1">
          Back Home
        </Link>
        <Link to="/invoices" className="px-8 py-4 bg-[#5C6347] text-[#F9F7F2] rounded-2xl font-medium hover:bg-[#4a5039] transition-colors flex-1">
          View Invoices
        </Link>
      </div>
    </motion.div>
  );
}
