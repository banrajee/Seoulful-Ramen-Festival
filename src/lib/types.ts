export type ItemStatus = "available" | "out_of_stock" | "hidden";
export type FoodType = "veg" | "non_veg";

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  category_id: string;
  image_url: string | null;
  spice_level?: number;
  food_type?: FoodType | null;
  status: ItemStatus;
  sort_order: number;
};

