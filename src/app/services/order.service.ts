import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of, BehaviorSubject } from 'rxjs';
import { catchError, tap, shareReplay } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Order } from '../models/order.model';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = environment.apiUrl;
  private ordersCache: Order[] | null = null;
  private ordersSubject = new BehaviorSubject<Order[]>([]);
  public orders$ = this.ordersSubject.asObservable();

  constructor(private http: HttpClient) { }

  private handleError(error: HttpErrorResponse) {
    console.error('OrderService Error:', error);
    let errorMessage = 'An error occurred';

    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else {
      if (error.status === 0) {
        errorMessage = 'Cannot connect to server. Please check your connection.';
      } else if (error.status === 404) {
        errorMessage = 'No orders found.';
      } else if (error.status === 401 || error.status === 403) {
        errorMessage = 'Please login to view your orders.';
      } else {
        errorMessage = error.message || 'Failed to load orders.';
      }
    }

    return throwError(() => new Error(errorMessage));
  }

  createOrder(deliveryAddress: string, phoneNumber: string): Observable<Order> {
    return this.http.post<Order>(
      `${this.apiUrl}/orders?deliveryAddress=${deliveryAddress}&phoneNumber=${phoneNumber}`,
      {}
    ).pipe(
      catchError(this.handleError)
    );
  }

  getUserOrders(): Observable<Order[]> {
    // Return cached data if available
    if (this.ordersCache && this.ordersCache.length > 0) {
      console.log('OrderService - Returning cached orders:', this.ordersCache.length);
      return of(this.ordersCache);
    }

    console.log('OrderService - Fetching user orders from API...');
    return this.http.get<Order[]>(`${this.apiUrl}/orders`)
      .pipe(
        tap(orders => {
          console.log('OrderService - Orders received from API:', orders.length);
          this.ordersCache = orders;
          this.ordersSubject.next(orders);
        }),
        shareReplay(1),
        catchError(this.handleError)
      );
  }

  getOrderById(id: number): Observable<Order> {
    return this.http.get<Order>(`${this.apiUrl}/orders/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Admin methods
  getAllOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/admin/orders`)
      .pipe(
        catchError(this.handleError)
      );
  }

  updateOrderStatus(orderId: number, status: string): Observable<Order> {
    return this.http.put<Order>(`${this.apiUrl}/admin/orders/${orderId}/status`, { status })
      .pipe(
        catchError(this.handleError)
      );
  }

  clearCache(): void {
    this.ordersCache = null;
    this.ordersSubject.next([]);
  }
}
