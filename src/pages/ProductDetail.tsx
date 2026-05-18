import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, ShoppingBag, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useCart } from '../lib/CartContext';
import { pageTransition } from '../lib/animations';

type Product = {
  id: string;
  name: string;
  price: number;
  image?: string;
  stock?: number;
  category?: string;
  rating?: number;
  sold?: number;
  badge?: string;
  description?: string;
};

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProduct() {
      const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
      if (error) {
        setError(error.message);
      } else {
        setProduct({
          ...data,
          price: Number(data.price),
          stock: Number(data.stock ?? 0),
          rating: Number(data.rating ?? 4.6),
          sold: Number(data.sold ?? 0),
        });
      }
      setLoading(false);
    }
    fetchProduct();
  }, [id]);

  if (loading) return <div className="text-center py-20">Loading product...</div>;

  if (error || !product) {
    return (
      <div className="text-center py-20">
        <p className="text-[#8A4B3C]">{error || 'Product not found.'}</p>
        <button onClick={() => navigate('/')} className="mt-6 text-[#5C6347] font-medium">
          Back to products
        </button>
      </div>
    );
  }

  return (
    <motion.div {...pageTransition} className="space-y-6">
      <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-[#5C6347]">
        <ArrowLeft className="w-4 h-4" />
        Back to products
      </Link>

      <section className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] bg-[#FFFFFF] border border-[#E2DED0] rounded-3xl overflow-hidden">
        <div className="bg-[#E6E2D8] min-h-[360px]">
          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
        </div>

        <div className="p-6 sm:p-8 flex flex-col">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[10px] uppercase tracking-[0.18em] text-[#8C887D] font-bold">
              {product.category || 'Product'}
            </span>
            {product.badge && (
              <span className="px-3 py-1 rounded-full bg-[#F0EDE4] text-[#5C6347] text-[10px] font-bold uppercase tracking-[0.12em]">
                {product.badge}
              </span>
            )}
          </div>

          <h1 className="mt-4 text-4xl sm:text-5xl font-serif italic text-[#43423E]">{product.name}</h1>
          <p className="mt-4 text-[#7A7568] leading-relaxed">{product.description}</p>

          <div className="mt-6 grid grid-cols-3 gap-4 border-y border-[#E2DED0] py-5">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-[#8C887D] font-bold">Rating</p>
              <p className="mt-1 inline-flex items-center gap-1 text-[#43423E] font-bold">
                <Star className="w-4 h-4 fill-[#D8A047] text-[#D8A047]" />
                {product.rating?.toFixed(1)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-[#8C887D] font-bold">Sold</p>
              <p className="mt-1 text-[#43423E] font-bold">{product.sold?.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-[#8C887D] font-bold">Stock</p>
              <p className="mt-1 text-[#43423E] font-bold">{product.stock}</p>
            </div>
          </div>

          <div className="mt-auto pt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
            <p className="text-5xl font-serif text-[#5C6347]">${product.price}</p>
            <motion.button
              onClick={() =>
                addToCart({
                  id: product.id,
                  name: product.name,
                  price: product.price,
                  image: product.image,
                  category: product.category,
                })
              }
              disabled={!product.stock}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-[#5C6347] text-[#F9F7F2] font-medium hover:bg-[#4a5039] transition-colors disabled:opacity-40"
            >
              <ShoppingBag className="w-5 h-5" />
              Add to Cart
            </motion.button>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
