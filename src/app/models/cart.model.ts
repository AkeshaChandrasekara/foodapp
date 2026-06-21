import { FoodItem } from './food-item.model';

export interface CartItem {
  id?: number;
  foodItem: FoodItem;
  quantity: number;
  price: number;
}

export interface Cart {
  id: number;
  items: CartItem[];
  total: number;
}
