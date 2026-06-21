import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../../services/order.service';
import { Order } from '../../../models/order.model';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-order-list',
  standalone: true,
  templateUrl: './order-list.component.html',
  styleUrls: ['./order-list.component.css'],
  imports: [
    CommonModule,
    RouterLink,
    FormsModule
  ]
})
export class OrderListComponent implements OnInit {
  orders: Order[] = [];
  isLoading: boolean = true;
  selectedStatus: string = 'ALL';
  errorMessage: string = '';
  statuses: string[] = ['ALL', 'PENDING', 'CONFIRMED', 'PREPARING', 'DELIVERED', 'CANCELLED'];
  private initialLoad: boolean = true;

  constructor(private orderService: OrderService) {}

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    
    if (this.initialLoad) {
      this.isLoading = true;
      this.initialLoad = false;
    }
    this.errorMessage = '';

    console.log('Loading orders...');
    this.orderService.getUserOrders().subscribe({
      next: (orders) => {
        console.log('Orders received:', orders);
        this.orders = orders || [];
        this.isLoading = false;
        console.log('Orders loaded, isLoading set to false');
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error loading orders:', err);
        this.isLoading = false;
        if (err.status === 0) {
          this.errorMessage = 'Cannot connect to server. Please check your connection.';
        } else if (err.status === 401 || err.status === 403) {
          this.errorMessage = 'Please login to view your orders.';
        } else {
          this.errorMessage = err.message || 'Failed to load orders. Please try again.';
        }
        this.orders = [];
        console.log('Error occurred, isLoading set to false');
      }
    });
  }

  getFilteredOrders(): Order[] {
    if (this.selectedStatus === 'ALL') {
      return this.orders;
    }
    return this.orders.filter(order => order.status === this.selectedStatus);
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'PENDING': '#fbbf24',
      'CONFIRMED': '#60a5fa',
      'PREPARING': '#fb923c',
      'DELIVERED': '#34d399',
      'CANCELLED': '#f87171'
    };
    return colors[status] || '#9ca3af';
  }

  getStatusLabel(status: string): string {
    return status.charAt(0) + status.slice(1).toLowerCase();
  }

  getStatusIcon(status: string): string {
    const icons: { [key: string]: string } = {
      'PENDING': '⏳',
      'CONFIRMED': '✅',
      'PREPARING': '👨‍🍳',
      'DELIVERED': '🚚',
      'CANCELLED': '❌'
    };
    return icons[status] || '📦';
  }

  formatDate(date: Date | string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  trackOrder(orderId: number) {
    alert(`Tracking order #${orderId}`);
  }

  retryLoading() {
    this.initialLoad = true;
    this.loadOrders();
  }
}