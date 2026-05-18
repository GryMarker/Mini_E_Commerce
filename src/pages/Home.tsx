import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import { useCart } from '../lib/CartContext';
import { fadeUpItem, pageTransition, scaleIn, staggerContainer } from '../lib/animations';
import {
  Eye,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Star,
  X,
} from 'lucide-react';

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

const fallbackProducts: Product[] = [
  {
    id: '1',
    name: 'Premium Wireless Headphones',
    price: 299,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=600&auto=format&fit=crop',
    stock: 25,
    category: 'Audio',
    rating: 4.8,
    sold: 1280,
    badge: 'Top Rated',
    description: 'Noise-isolating wireless headphones with long battery life.',
  },
  {
    id: '2',
    name: 'Mechanical Keyboard',
    price: 149,
    image: 'https://images.unsplash.com/photo-1595225476474-87563907a212?q=80&w=600&auto=format&fit=crop',
    stock: 30,
    category: 'Workspace',
    rating: 4.7,
    sold: 860,
    badge: 'Hot',
    description: 'Tactile keyboard for focused typing and gaming setups.',
  },
  {
    id: '3',
    name: 'Ergonomic Mouse',
    price: 79,
    image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?q=80&w=600&auto=format&fit=crop',
    stock: 40,
    category: 'Workspace',
    rating: 4.6,
    sold: 710,
    badge: 'Best Value',
    description: 'Comfortable daily mouse with precise tracking.',
  },
];

const sortLabels = {
  recommended: 'Recommended',
  priceAsc: 'Price: Low to High',
  priceDesc: 'Price: High to Low',
  rating: 'Highest Rated',
  sold: 'Most Sold',
};

type SortKey = keyof typeof sortLabels;

function normalizeProduct(product: Product): Product {
  return {
    ...product,
    price: Number(product.price),
    stock: Number(product.stock ?? 0),
    rating: Number(product.rating ?? 4.6),
    sold: Number(product.sold ?? 0),
    category: product.category || 'Featured',
    description: product.description || 'Ready to ship from the marketplace catalog.',
  };
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState<SortKey>('recommended');
  const [maxPrice, setMaxPrice] = useState(500);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { addToCart } = useCart();

  useEffect(() => {
    async function fetchProducts() {
      const { data, error } = await supabase.from('products').select('*').order('name');
      if (error || !data || data.length === 0) {
        if (error) console.warn('Could not fetch products, using fallback catalog.');
        setProducts(fallbackProducts.map(normalizeProduct));
      } else {
        setProducts((data as Product[]).map(normalizeProduct));
      }
      setLoading(false);
    }
    fetchProducts();
  }, []);

  const categories = useMemo(() => {
    const names = [...new Set(products.map((product) => product.category || 'Featured'))].sort();
    return ['All', ...names];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return products
      .filter((product) => {
        const matchesQuery = [product.name, product.category, product.badge, product.description]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(normalizedQuery));
        const matchesCategory = category === 'All' || product.category === category;
        const matchesPrice = product.price <= maxPrice;
        return matchesQuery && matchesCategory && matchesPrice;
      })
      .sort((a, b) => {
        if (sort === 'priceAsc') return a.price - b.price;
        if (sort === 'priceDesc') return b.price - a.price;
        if (sort === 'rating') return (b.rating || 0) - (a.rating || 0);
        if (sort === 'sold') return (b.sold || 0) - (a.sold || 0);
        return Number(Boolean(b.badge)) - Number(Boolean(a.badge)) || (b.sold || 0) - (a.sold || 0);
      });
  }, [category, maxPrice, products, query, sort]);

  const handleAdd = (product: Product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      category: product.category,
    });
  };

  if (loading) return <div className="text-center py-20">Loading products...</div>;

  return (
    <motion.div {...pageTransition} className="space-y-8">
      <motion.section
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] items-stretch"
      >
        <motion.div variants={fadeUpItem} className="bg-[#FFFFFF] border border-[#E2DED0] rounded-3xl p-6 sm:p-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F0EDE4] text-[#5C6347] text-xs font-bold uppercase tracking-[0.18em]">
            <Sparkles className="w-4 h-4" />
            Marketplace Picks
          </div>
          <h1 className="mt-5 text-4xl sm:text-5xl font-serif italic text-[#43423E]">
            My Mini-E Commerce
          </h1>
          <p className="mt-3 text-[#7A7568] max-w-2xl">
            Browse practical tech gear with fast search, clear filters, and secure Stripe checkout.
          </p>
        </motion.div>

        <motion.div variants={fadeUpItem} className="bg-[#5C6347] text-[#F9F7F2] rounded-3xl p-6 sm:p-8 flex flex-col justify-between">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#E2DED0]">Today&apos;s catalog</p>
          <div className="mt-8 grid grid-cols-3 gap-4">
            <div>
              <p className="text-3xl font-serif">{products.length}</p>
              <p className="text-xs text-[#E2DED0]">Items</p>
            </div>
            <div>
              <p className="text-3xl font-serif">{categories.length - 1}</p>
              <p className="text-xs text-[#E2DED0]">Categories</p>
            </div>
            <div>
              <p className="text-3xl font-serif">{filteredProducts.length}</p>
              <p className="text-xs text-[#E2DED0]">Results</p>
            </div>
          </div>
        </motion.div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: 0.08, ease: 'easeOut' }}
        className="bg-[#FFFFFF] border border-[#E2DED0] rounded-3xl p-4 sm:p-5 space-y-5"
      >
        <div className="grid gap-3 lg:grid-cols-[1fr_220px_180px]">
          <label className="relative block">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8C887D]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search headphones, keyboard, monitor..."
              className="w-full h-12 pl-12 pr-4 bg-[#F9F7F2] border border-[#E2DED0] rounded-2xl outline-none focus:ring-2 focus:ring-[#5C6347] text-[#43423E]"
            />
          </label>

          <label className="relative block">
            <SlidersHorizontal className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8C887D]" />
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortKey)}
              className="w-full h-12 pl-12 pr-4 bg-[#F9F7F2] border border-[#E2DED0] rounded-2xl outline-none focus:ring-2 focus:ring-[#5C6347] text-[#43423E]"
            >
              {Object.entries(sortLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <div className="h-12 px-4 bg-[#F9F7F2] border border-[#E2DED0] rounded-2xl flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-[0.15em] text-[#8C887D]">Max</span>
            <input
              type="range"
              min="50"
              max="500"
              step="25"
              value={maxPrice}
              onChange={(event) => setMaxPrice(Number(event.target.value))}
              className="w-full accent-[#5C6347]"
            />
            <span className="text-sm font-bold text-[#5C6347]">${maxPrice}</span>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map((name) => (
            <button
              key={name}
              onClick={() => setCategory(name)}
              className={`shrink-0 px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                category === name
                  ? 'bg-[#5C6347] border-[#5C6347] text-[#F9F7F2]'
                  : 'bg-[#F9F7F2] border-[#E2DED0] text-[#7A7568] hover:border-[#5C6347]'
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      </motion.section>

      <div className="flex items-center justify-between">
        <p className="text-sm text-[#7A7568]">
          Showing <span className="font-bold text-[#43423E]">{filteredProducts.length}</span> of {products.length} products
        </p>
        {(query || category !== 'All' || maxPrice !== 500) && (
          <button
            onClick={() => {
              setQuery('');
              setCategory('All');
              setMaxPrice(500);
            }}
            className="text-sm font-medium text-[#5C6347] hover:text-[#43423E]"
          >
            Clear filters
          </button>
        )}
      </div>

      {filteredProducts.length === 0 ? (
        <div className="text-center py-20 bg-[#FFFFFF] border border-[#E2DED0] rounded-3xl">
          <ShoppingBag className="w-10 h-10 mx-auto text-[#D9D4C7]" />
          <h2 className="mt-4 text-2xl font-serif italic text-[#43423E]">No matching products</h2>
          <p className="mt-2 text-[#8C887D]">Try a broader search or remove a filter.</p>
        </div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5"
        >
          {filteredProducts.map((product) => (
            <motion.article
              key={product.id}
              variants={fadeUpItem}
              whileHover={{ y: -4 }}
              className="bg-[#FFFFFF] group rounded-2xl overflow-hidden border border-[#E2DED0] transition-all hover:-translate-y-1 hover:shadow-md flex flex-col"
            >
              <div className="aspect-square bg-[#E6E2D8] overflow-hidden relative">
                {product.badge && (
                  <span className="absolute left-3 top-3 z-[1] px-2.5 py-1 rounded-full bg-[#F9F7F2] text-[#5C6347] text-[10px] font-bold uppercase tracking-[0.12em]">
                    {product.badge}
                  </span>
                )}
                <button
                  onClick={() => setSelectedProduct(product)}
                  className="absolute right-3 top-3 z-[1] w-9 h-9 rounded-full bg-[#F9F7F2] text-[#5C6347] grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label={`Quick view ${product.name}`}
                >
                  <Eye className="w-4 h-4" />
                </button>
                <Link to={`/products/${product.id}`} aria-label={`View ${product.name}`}>
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </Link>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#8C887D] font-bold">
                  {product.category}
                </p>
                <Link
                  to={`/products/${product.id}`}
                  className="mt-2 min-h-12 text-base sm:text-lg font-serif italic text-[#43423E] leading-tight hover:text-[#5C6347]"
                >
                  {product.name}
                </Link>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="inline-flex items-center gap-1 text-[#7A7568]">
                    <Star className="w-4 h-4 fill-[#D8A047] text-[#D8A047]" />
                    {product.rating?.toFixed(1)}
                  </span>
                  <span className="text-[#8C887D]">{product.sold?.toLocaleString()} sold</span>
                </div>
                <div className="mt-4 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-2xl font-serif text-[#5C6347]">${product.price}</p>
                    <p className="text-xs text-[#8C887D]">{product.stock} in stock</p>
                  </div>
                  <motion.button
                    onClick={() => handleAdd(product)}
                    disabled={!product.stock}
                    whileTap={{ scale: 0.94 }}
                    className="w-11 h-11 shrink-0 rounded-2xl bg-[#5C6347] text-[#F9F7F2] grid place-items-center hover:bg-[#4a5039] transition-colors disabled:opacity-40"
                    aria-label={`Add ${product.name} to cart`}
                  >
                    <ShoppingBag className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>
            </motion.article>
          ))}
        </motion.div>
      )}

      <AnimatePresence>
      {selectedProduct && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/40 px-4 py-6 flex items-center justify-center"
        >
          <motion.div {...scaleIn} className="bg-[#FFFFFF] max-w-3xl w-full rounded-3xl overflow-hidden shadow-xl border border-[#E2DED0]">
            <div className="grid md:grid-cols-2">
              <div className="aspect-square md:aspect-auto bg-[#E6E2D8]">
                <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-cover" />
              </div>
              <div className="p-6 flex flex-col">
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="self-end w-10 h-10 rounded-full bg-[#F9F7F2] text-[#5C6347] grid place-items-center"
                  aria-label="Close quick view"
                >
                  <X className="w-5 h-5" />
                </button>
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#8C887D] font-bold">
                  {selectedProduct.category}
                </p>
                <h2 className="mt-2 text-3xl font-serif italic text-[#43423E]">{selectedProduct.name}</h2>
                <p className="mt-4 text-[#7A7568] leading-relaxed">{selectedProduct.description}</p>
                <div className="mt-5 flex items-center gap-4 text-sm text-[#7A7568]">
                  <span className="inline-flex items-center gap-1">
                    <Star className="w-4 h-4 fill-[#D8A047] text-[#D8A047]" />
                    {selectedProduct.rating?.toFixed(1)} rating
                  </span>
                  <span>{selectedProduct.sold?.toLocaleString()} sold</span>
                  <span>{selectedProduct.stock} left</span>
                </div>
                <div className="mt-auto pt-8 flex items-center justify-between gap-4">
                  <p className="text-4xl font-serif text-[#5C6347]">${selectedProduct.price}</p>
                  <button
                    onClick={() => {
                      handleAdd(selectedProduct);
                      setSelectedProduct(null);
                    }}
                    className="px-6 py-4 rounded-2xl bg-[#5C6347] text-[#F9F7F2] font-medium hover:bg-[#4a5039] transition-colors"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </motion.div>
  );
}
