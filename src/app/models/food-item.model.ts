export interface FoodItem {
  id?: number;
  name: string;
  category: string;
  price: number;
  description: string;
  imageUrl?: string;
  isAvailable?: boolean;
  preparationTime?: number;
}
