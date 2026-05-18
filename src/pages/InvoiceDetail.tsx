import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, CreditCard, Package, Receipt } from 'lucide-react';
import { fadeUpItem, pageTransition, staggerContainer } from '../lib/animations';

type InvoiceProduct = {
  id: string;
  name: string;
  price: number;
  image?: string;
  category?: string;
  description?: string;
};

type Invoice = {
  id: string;
  stripe_session_id: string;
  products: string;
  amount_total: number;
  payment_status: string;
  created_at: string;
  product_items: InvoiceProduct[];
};

export default function InvoiceDetail({ session }: { session: any }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInvoice() {
      if (!session) return;
      try {
        const response = await fetch(`/api/invoices/${id}`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Could not load invoice');
        setInvoice(data);
      } catch (err: any) {
        setError(err.message);
      }
      setLoading(false);
    }
    fetchInvoice();
  }, [id, session]);

  if (!session) return <div className="text-center py-20">Please sign in to view this invoice.</div>;
  if (loading) return <div className="text-center py-20">Loading invoice...</div>;

  if (error || !invoice) {
    return (
      <div className="text-center py-20">
        <p className="text-[#8A4B3C]">{error || 'Invoice not found.'}</p>
        <button onClick={() => navigate('/invoices')} className="mt-6 text-[#5C6347] font-medium">
          Back to invoices
        </button>
      </div>
    );
  }

  return (
    <motion.div {...pageTransition} className="max-w-5xl mx-auto space-y-6">
      <Link to="/invoices" className="inline-flex items-center gap-2 text-sm font-medium text-[#5C6347]">
        <ArrowLeft className="w-4 h-4" />
        Back to invoices
      </Link>

      <section className="bg-[#FFFFFF] border border-[#E2DED0] rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F0EDE4] text-[#5C6347] text-xs font-bold uppercase tracking-[0.18em]">
              <Receipt className="w-4 h-4" />
              Invoice Detail
            </div>
            <h1 className="mt-4 text-4xl font-serif italic text-[#43423E]">Invoice #{invoice.id.split('-')[0]}</h1>
            <p className="mt-2 text-[#8C887D]">{new Date(invoice.created_at).toLocaleString()}</p>
          </div>
          <div className="sm:text-right">
            <span className="inline-flex px-3 py-1 rounded-full bg-[#E2DED0] text-[#5C6347] text-[10px] font-bold uppercase tracking-widest">
              {invoice.payment_status}
            </span>
            <p className="mt-3 text-5xl font-serif text-[#5C6347]">${Number(invoice.amount_total || 0).toFixed(2)}</p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="bg-[#F9F7F2] border border-[#E2DED0] rounded-2xl p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-[#8C887D] font-bold">Stripe Session</p>
            <p className="mt-2 break-all text-sm text-[#43423E]">{invoice.stripe_session_id}</p>
          </div>
          <div className="bg-[#F9F7F2] border border-[#E2DED0] rounded-2xl p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-[#8C887D] font-bold">Payment Method</p>
            <p className="mt-2 inline-flex items-center gap-2 text-sm text-[#43423E]">
              <CreditCard className="w-4 h-4 text-[#5C6347]" />
              Stripe Checkout
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[#FFFFFF] border border-[#E2DED0] rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-[#E2DED0] flex items-center gap-2">
          <Package className="w-5 h-5 text-[#5C6347]" />
          <h2 className="text-2xl font-serif italic text-[#43423E]">Purchased Items</h2>
        </div>
        <motion.ul variants={staggerContainer} initial="hidden" animate="show" className="divide-y divide-[#E2DED0]">
          {invoice.product_items.length > 0 ? (
            invoice.product_items.map((product) => (
              <motion.li key={product.id} variants={fadeUpItem} className="p-5 sm:p-6 flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-[#E6E2D8] overflow-hidden shrink-0">
                  {product.image && <img src={product.image} alt={product.name} className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-[#8C887D] font-bold">
                    {product.category || 'Product'}
                  </p>
                  <Link to={`/products/${product.id}`} className="mt-1 block text-xl font-serif italic text-[#43423E] hover:text-[#5C6347]">
                    {product.name}
                  </Link>
                  <p className="mt-1 text-sm text-[#8C887D] line-clamp-2">{product.description}</p>
                </div>
                <p className="text-2xl font-serif text-[#5C6347]">${Number(product.price).toFixed(2)}</p>
              </motion.li>
            ))
          ) : (
            <li className="p-6 text-[#8C887D]">Product details are unavailable for this invoice.</li>
          )}
        </motion.ul>
      </section>
    </motion.div>
  );
}
