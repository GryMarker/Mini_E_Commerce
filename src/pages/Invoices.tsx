import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Receipt } from 'lucide-react';
import { fadeUpItem, pageTransition, staggerContainer } from '../lib/animations';

export default function Invoices({ session }: { session: any }) {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInvoices() {
      if (!session) return;
      try {
        const response = await fetch(`/api/invoices?customerId=${session.user.id}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        const data = await response.json();
        if (Array.isArray(data)) {
          setInvoices(data);
        } else if (data.error) {
          console.error(data.error);
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    fetchInvoices();
  }, [session]);

  if (!session) {
    return <div className="text-center py-20">Please sign in to view your invoices.</div>;
  }

  if (loading) {
    return <div className="text-center py-20">Loading invoices...</div>;
  }

  if (invoices.length === 0) {
    return (
      <motion.div {...pageTransition} className="flex flex-col items-center justify-center py-24 text-center bg-[#FFFFFF] rounded-[40px] border border-[#E2DED0] shadow-sm">
        <div className="w-20 h-20 bg-[#F9F7F2] rounded-full flex items-center justify-center mb-6">
          <Receipt className="w-10 h-10 text-[#D9D4C7]" />
        </div>
        <h2 className="text-3xl font-serif italic text-[#43423E] mb-2">No invoices found</h2>
        <p className="text-[#8C887D] mb-8">You haven't made any purchases yet.</p>
      </motion.div>
    );
  }

  return (
    <motion.div {...pageTransition} className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-serif italic text-[#43423E] mb-10">Your Invoices</h1>
      
      <div className="bg-[#FFFFFF] rounded-[40px] border border-[#E2DED0] overflow-hidden shadow-sm">
        <motion.ul variants={staggerContainer} initial="hidden" animate="show" className="divide-y divide-[#E2DED0]">
          {invoices.map((invoice) => (
            <motion.li key={invoice.id} variants={fadeUpItem} className="hover:bg-[#F9F7F2] transition-colors">
              <Link to={`/invoices/${invoice.id}`} className="block p-8">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                  <div className="flex items-center gap-4 mb-2">
                    <span className="font-serif text-xl italic text-[#43423E]">Invoice #{invoice.id.split('-')[0]}</span>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest
                      ${invoice.payment_status === 'paid' ? 'bg-[#E2DED0] text-[#5C6347]' : 'bg-[#E6E2D8] text-[#7A7568]'}`}>
                      {invoice.payment_status}
                    </span>
                  </div>
                  <p className="text-sm text-[#8C887D]">Date: {new Date(invoice.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-3xl font-serif text-[#43423E]">${invoice.amount_total?.toFixed(2)}</p>
                  <p className="mt-1 text-xs text-[#8C887D]">View details</p>
                </div>
              </div>
              </Link>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </motion.div>
  );
}
