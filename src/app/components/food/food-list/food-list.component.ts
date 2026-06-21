import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FoodService } from '../../../services/food.service';
import { CartService } from '../../../services/cart.service';
import { AuthService } from '../../../services/auth.service';
import { FoodItem } from '../../../models/food-item.model';
import { Subscription } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-food-list',
  standalone: true,
  templateUrl: './food-list.component.html',
  styleUrls: ['./food-list.component.css'],
  imports: [
    CommonModule,
    RouterLink,
    FormsModule
  ]
})
export class FoodListComponent implements OnInit, OnDestroy {
  foodItems: FoodItem[] = [];
  filteredItems: FoodItem[] = [];
  categories: string[] = ['All', 'Pizza', 'Burger', 'Pasta', 'Salad', 'Dessert', 'Drinks'];
  selectedCategory: string = 'All';
  searchQuery: string = '';
  isLoggedIn: boolean = false;
  isLoading: boolean = true;
  errorMessage: string = '';
  private subscriptions: Subscription[] = [];

  defaultImage = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22300%22%20viewBox%3D%220%200%20400%20300%22%3E%3Crect%20width%3D%22400%22%20height%3D%22300%22%20fill%3D%22%23f8f9fa%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22120%22%20font-family%3D%22Arial%22%20font-size%3D%2260%22%20text-anchor%3D%22middle%22%3E%F0%9F%8D%95%3C%2Ftext%3E%3Ctext%20x%3D%22200%22%20y%3D%22180%22%20font-family%3D%22Arial%22%20font-size%3D%2216%22%20fill%3D%22%23999%22%20text-anchor%3D%22middle%22%3EFood%20Item%3C%2Ftext%3E%3C%2Fsvg%3E';

  constructor(
    private foodService: FoodService,
    private cartService: CartService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    
    this.checkLoginStatus();

    this.loadFoodItems();

    const authSub = this.authService.currentUser$.subscribe(user => {
      this.isLoggedIn = !!user;
      console.log('FoodList - User login status updated:', this.isLoggedIn);
      if (user) {
        console.log('FoodList - Logged in as:', user.username);
      }
    });
    this.subscriptions.push(authSub);
  }

  checkLoginStatus() {
    // Check both from service and directly from localStorage
    this.isLoggedIn = this.authService.isLoggedIn();
    const token = this.authService.getToken();
    console.log('FoodList - Initial login status:', this.isLoggedIn);
    console.log('FoodList - Token exists:', !!token);

    if (token && !this.authService.getCurrentUser()) {
      console.log('FoodList - Token exists but no user, refreshing user data');
      this.authService.refreshUser();
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadFoodItems() {
    this.isLoading = true;
    this.errorMessage = '';
    const sub = this.foodService.getAvailableFoodItems().subscribe({
      next: (items) => {
        this.foodItems = items;
        this.filteredItems = items;
        this.isLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error loading food items:', err);
        this.isLoading = false;
        if (err.status === 0) {
          this.errorMessage = 'Cannot connect to server. Please check if backend is running.';
        } else {
          this.errorMessage = 'Failed to load menu. Please try again.';
        }
      }
    });
    this.subscriptions.push(sub);
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = this.defaultImage;
    img.onerror = null;
  }

  filterByCategory(category: string) {
    this.selectedCategory = category;
    this.applyFilters();
  }

  applyFilters() {
    let items = this.foodItems;

    if (this.selectedCategory !== 'All') {
      items = items.filter(item => item.category === this.selectedCategory);
    }

    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      items = items.filter(item =>
        item.name.toLowerCase().includes(query) ||
        (item.description && item.description.toLowerCase().includes(query)) ||
        item.category.toLowerCase().includes(query)
      );
    }

    this.filteredItems = items;
  }

  searchFood() {
    this.applyFilters();
  }

  clearSearch() {
    this.searchQuery = '';
    this.applyFilters();
  }

  addToCart(foodItem: FoodItem) {
    console.log('addToCart called for:', foodItem.name);
    console.log('isLoggedIn:', this.isLoggedIn);

    const isLoggedIn = this.authService.isLoggedIn();
    if (!isLoggedIn) {
       this.notificationService.showWarning('Please login to add items to cart');
      return;
      this.isLoggedIn = false;
      return;
    }

    if (!foodItem.isAvailable) {
      this.notificationService.showError('This item is currently unavailable');
      return;
      return;
    }

    console.log('Adding to cart - ID:', foodItem.id, 'Quantity: 1');

    const sub = this.cartService.addToCart(foodItem.id!, 1).subscribe({
      next: (response) => {
        console.log('Add to cart response:', response);
        this.notificationService.showSuccess(`${foodItem.name} added to cart successfully!`);
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error adding to cart:', err);

        let errorMsg = 'Failed to add item to cart. ';

        if (err.status === 0) {
          errorMsg += 'Cannot connect to server. Please check if backend is running.';
        } else if (err.status === 401 || err.status === 403) {
          errorMsg += 'Session expired. Please login again.';
          this.authService.logout();
          this.isLoggedIn = false;
          setTimeout(() => {
            window.location.href = '/login';
          }, 1500);
        } else if (err.status === 404) {
          errorMsg += 'Food item not found.';
        } else if (err.status === 400) {
          errorMsg += 'Invalid request. Please try again.';
        } else {
          errorMsg += err.error?.message || 'Please try again later.';
        }

        this.notificationService.showError(errorMsg);
      }
    });
    this.subscriptions.push(sub);
  }
}
