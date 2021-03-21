import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      // checando se o produto esta no localstorage
      const productInCart = cart.find(product => product.id === productId);

      if (productInCart) {
        // pegando o estoque do produto que eu to consultando na api
        const { data: stock } = await api.get(`/stock/${productId}`);

        // se o produto do localstorage estiver com quantidade menor que o produto no estoque
        if (productInCart.amount < stock.amount) {
          // aumenta a quantidade do produto no carrinho
          productInCart.amount++;

          setCart([...cart]);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart]));
        } else {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }
      } else {
        // pegando os dados do produto
        const { data: product } = await api.get(`/products/${productId}`);
        // pegando o estoque do produto
        const { data: stock } = await api.get(`/stock/${productId}`);

        if (stock.amount < 1) {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        } else {
          product.amount = 1;

          setCart([...cart, product])
          localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, product]))
        }
      }
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // checando se o produto esta no localstorage
      const productInCart = cart.find(product => product.id === productId);

      if (productInCart) {
        // filtrando a lista de produtos, deixando o produto passado por parametro de fora
        const filteringProducts = cart.filter(product => product.id !== productId);

        setCart(filteringProducts);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(filteringProducts));
      } else {
        toast.error('Erro na remoção do produto');
        return;
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const productInCart = cart.find(product => product.id === productId);

      if (amount <= 0) {
        return;
      }

      if (productInCart) {
        const { data: stock } = await api.get(`/stock/${productId}`);

        if (amount <= stock.amount) {
          productInCart.amount = amount;

          setCart([...cart]);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart]));
        } else {
          toast.error('Quantidade solicitada fora de estoque');
        }
      } else {
        toast.error('Erro na alteração de quantidade do produto');
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
