import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FoodService } from '../../../services/food.service';
import { CartService } from '../../../services/cart.service';
import { AuthService } from '../../../services/auth.service';
import { FoodItem } from '../../../models/food-item.model';
import { HttpErrorResponse } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-food-detail',
  standalone: true,
  templateUrl: './food-detail.component.html',
  styleUrls: ['./food-detail.component.css'],
  imports: [
    CommonModule,
    RouterLink
  ]
})
export class FoodDetailComponent implements OnInit {
  foodItem: FoodItem | null = null;
  quantity: number = 1;
  isLoading: boolean = true;
  isLoggedIn: boolean = false;
  errorMessage: string = '';
  private subscription: Subscription | null = null;

  defaultImage: string = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22300%22%20viewBox%3D%220%200%20400%20300%22%3E%3Crect%20width%3D%22400%22%20height%3D%22300%22%20fill%3D%22%23f8f9fa%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22120%22%20font-family%3D%22Arial%22%20font-size%3D%2260%22%20text-anchor%3D%22middle%22%3E%F0%9F%8D%95%3C%2Ftext%3E%3Ctext%20x%3D%22200%22%20y%3D%22180%22%20font-family%3D%22Arial%22%20font-size%3D%2216%22%20fill%3D%22%23999%22%20text-anchor%3D%22middle%22%3EFood%20Item%3C%2Ftext%3E%3C%2Fsvg%3E';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private foodService: FoodService,
    private cartService: CartService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.isLoggedIn = !!user;
    });

    const id = this.route.snapshot.paramMap.get('id');
    console.log('Food Detail - ID from route:', id);

    if (id && !isNaN(Number(id))) {
      
      const cachedItem = this.foodService.getCachedFoodItem(Number(id));
      if (cachedItem) {
        console.log('Using cached food item:', cachedItem);
        this.foodItem = cachedItem;
        this.isLoading = false;
        this.loadFoodItem(Number(id), true);
      } else {
        this.loadFoodItem(Number(id), false);
      }
    } else {
      this.isLoading = false;
      this.errorMessage = 'Invalid food item ID';
      console.error('Invalid ID:', id);
    }
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  loadFoodItem(id: number, fromCache: boolean = false) {
    if (!fromCache) {
      this.isLoading = true;
    }
    this.errorMessage = '';

    console.log('Calling getFoodItemById with ID:', id);

    this.subscription = this.foodService.getFoodItemById(id).subscribe({
      next: (item) => {
        console.log('Food item received from API:', item);
        if (item && item.id) {
          this.foodItem = item;
          this.isLoading = false;
          // Cache the item
          this.foodService.cacheFoodItem(item);
          console.log('Food item loaded successfully:', this.foodItem);
        } else {
          this.isLoading = false;
          this.errorMessage = 'Food item data is empty';
          console.warn('Received empty food item:', item);
        }
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error loading food item - Full error:', err);
        this.isLoading = false;

        if (err.status === 404) {
          this.errorMessage = 'Food item not found. It may have been removed.';
        } else if (err.status === 0) {
          this.errorMessage = 'Cannot connect to server. Please check if backend is running on port 8080.';
        } else if (err.status === 403) {
          this.errorMessage = 'Access denied. Please login first.';
        } else {
          this.errorMessage = err.error?.message || 'Failed to load food item. Please try again.';
        }

        console.log('Error message set:', this.errorMessage);
      }
    });
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = this.defaultImage;
    img.onerror = null;
  }

  increaseQuantity() {
    this.quantity++;
  }

  decreaseQuantity() {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  addToCart() {
    if (!this.isLoggedIn) {
      this.notificationService.showWarning('Please login to add items to cart');
      this.router.navigate(['/login']);
      return;
    }

    if (this.foodItem && this.foodItem.isAvailable) {
      this.cartService.addToCart(this.foodItem.id!, this.quantity).subscribe({
        next: () => {
          this.notificationService.showSuccess(`${this.quantity} ${this.foodItem?.name} added to cart!`);
        },
        error: (err) => {
          console.error('Error adding to cart:', err);
          this.notificationService.showError('Failed to add item to cart');
        }
      });
    }
  }

  goBack() {
    this.router.navigate(['/food']);
  }

  retryLoading() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && !isNaN(Number(id))) {
      this.loadFoodItem(Number(id), false);
    }
  }
}
