
import { User } from './user.model';
import { FoodItem } from './food-item.model';

export interface OrderItem {
  id: number;
  foodItem: FoodItem;
  quantity: number;
  price: number;
}

export interface Order {
  id: number;
  user: User;
  orderDate: Date;
  totalAmount: number;
  deliveryAddress: string;
  phoneNumber: string;
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'DELIVERED' | 'CANCELLED';
  items: OrderItem[];
}
