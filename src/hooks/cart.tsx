import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const productsAsyncStorage = await AsyncStorage.getItem(
        '@GoMarketplace:products',
      );
      if (productsAsyncStorage) {
        setProducts(JSON.parse(productsAsyncStorage));
      }
    }
    // AsyncStorage.removeItem('products');
    loadProducts();
  }, []);

  const addToCart = useCallback(
    async (product: Omit<Product, 'quantity'>) => {
      const productsUpdated = [...products];
      const findProduct = products.find(item => {
        return item.id === product.id;
      });
      if (findProduct) {
        findProduct.quantity += 1;
      } else {
        const newProductOnCard = {
          id: product.id,
          title: product.title,
          image_url: product.image_url,
          price: product.price,
          quantity: 1,
        };
        productsUpdated.push(newProductOnCard);
      }
      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(productsUpdated),
      );
      setProducts(productsUpdated);
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const productsUpdated = [...products];
      const findProduct = productsUpdated.find(item => {
        return item.id === id;
      });
      if (findProduct) {
        findProduct.quantity += 1;
        await AsyncStorage.setItem(
          '@GoMarketplace:products',
          JSON.stringify(productsUpdated),
        );
        setProducts(productsUpdated);
      }
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const productsUpdated = [...products];
      const findProduct = products.find(item => {
        return item.id === id;
      });
      if (findProduct) {
        findProduct.quantity -= 1;
        if (findProduct.quantity > 0) {
          await AsyncStorage.setItem(
            'products',
            JSON.stringify(productsUpdated),
          );
          setProducts(productsUpdated);
        } else {
          const productsAfterRemotion = products.filter(item => item.id !== id);
          setProducts(productsAfterRemotion);
        }
      }
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
