import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { FoodService } from '../../../services/food.service';
import { OrderService } from '../../../services/order.service';
import { FoodItem } from '../../../models/food-item.model';
import { Order } from '../../../models/order.model';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  templateUrl: './admin-panel.component.html',
  styleUrls: ['./admin-panel.component.css'],
  imports: [
    CommonModule,
    RouterLink
  ]
})
export class AdminPanelComponent implements OnInit {
  activeTab: 'dashboard' | 'food' | 'orders' | 'users' = 'dashboard';

  totalOrders: number = 0;
  totalFoodItems: number = 0;
  pendingOrders: number = 0;
  totalRevenue: number = 0;

  recentOrders: Order[] = [];
  foodItems: FoodItem[] = [];

  isLoading: boolean = true;
  isAdmin: boolean = false;

  constructor(
    private authService: AuthService,
    private foodService: FoodService,
    private orderService: OrderService,
    private router: Router
  ) {}

  ngOnInit() {
    this.checkAdminAccess();
    this.loadDashboardData();
  }

  checkAdminAccess() {
    this.isAdmin = this.authService.hasRole('ADMIN');
    if (!this.isAdmin) {
      this.router.navigate(['/food']);
    }
  }

  loadDashboardData() {
    this.isLoading = true;

    this.foodService.getAllFoodItems().subscribe({
      next: (items) => {
        this.foodItems = items;
        this.totalFoodItems = items.length;
        this.loadOrders();
      },
      error: (err) => {
        console.error('Error loading food items:', err);
        this.isLoading = false;
      }
    });
  }

  loadOrders() {
    this.orderService.getAllOrders().subscribe({
      next: (orders) => {
        this.recentOrders = orders.slice(0, 5);
        this.totalOrders = orders.length;
        this.pendingOrders = orders.filter(o => o.status === 'PENDING').length;
        this.totalRevenue = orders
          .filter(o => o.status === 'DELIVERED')
          .reduce((sum, o) => sum + o.totalAmount, 0);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading orders:', err);
        this.isLoading = false;
      }
    });
  }

  switchTab(tab: 'dashboard' | 'food' | 'orders' | 'users') {
    this.activeTab = tab;
    if (tab === 'food') {
      this.loadFoodItems();
    } else if (tab === 'orders') {
      this.loadAllOrders();
    }
  }

  loadFoodItems() {
    this.foodService.getAllFoodItems().subscribe({
      next: (items) => {
        this.foodItems = items;
      },
      error: (err) => console.error('Error loading food:', err)
    });
  }

  loadAllOrders() {
    this.orderService.getAllOrders().subscribe({
      next: (orders) => {
        this.recentOrders = orders;
      },
      error: (err) => console.error('Error loading orders:', err)
    });
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'PENDING': '#ffd93d',
      'CONFIRMED': '#6bcfff',
      'PREPARING': '#ff9f43',
      'DELIVERED': '#51cf66',
      'CANCELLED': '#ff6b6b'
    };
    return colors[status] || '#666';
  }

  getStatusLabel(status: string): string {
    return status.charAt(0) + status.slice(1).toLowerCase();
  }

  formatCurrency(amount: number): string {
    return '$' + (amount?.toFixed(2) || '0.00');
  }

  getOrderStatusCount(status: string): number {
    return this.recentOrders.filter(o => o.status === status).length;
  }
}
