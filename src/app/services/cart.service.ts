import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { tap, catchError, shareReplay } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Cart } from '../models/cart.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private apiUrl = environment.apiUrl;
  private cartSubject = new BehaviorSubject<Cart | null>(null);
  public cart$ = this.cartSubject.asObservable();
  private lastCartData: Cart | null = null;
  private isLoading = false;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  private handleError(error: HttpErrorResponse) {
    console.error('CartService Error:', error.status, error.statusText);
    return throwError(() => error);
  }

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    });
  }

  getCart(): Observable<Cart> {
    
    if (this.lastCartData) {
      console.log('CartService - Returning cached cart data');
    
      this.cartSubject.next(this.lastCartData);
      
      this.refreshCartInBackground();
      return of(this.lastCartData);
    }

    console.log('CartService - Getting cart from API');
    return this.http.get<Cart>(`${this.apiUrl}/cart`, { headers: this.getHeaders() })
      .pipe(
        tap(cart => {
          console.log('CartService - Cart received:', cart);
          this.lastCartData = cart;
          this.cartSubject.next(cart);
        }),
        shareReplay(1),
        catchError(this.handleError)
      );
  }

  private refreshCartInBackground() {
    if (this.isLoading) return;
    this.isLoading = true;

    this.http.get<Cart>(`${this.apiUrl}/cart`, { headers: this.getHeaders() })
      .subscribe({
        next: (cart) => {
          this.lastCartData = cart;
          this.cartSubject.next(cart);
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
        }
      });
  }

  addToCart(foodItemId: number, quantity: number): Observable<Cart> {
    console.log('CartService - addToCart called:', { foodItemId, quantity });
    const url = `${this.apiUrl}/cart/add/${foodItemId}?quantity=${quantity}`;

    return this.http.post<Cart>(url, {}, { headers: this.getHeaders() })
      .pipe(
        tap(cart => {
          console.log('CartService - addToCart response:', cart);
          this.lastCartData = cart;
          this.cartSubject.next(cart);
        }),
        catchError(this.handleError)
      );
  }

  removeFromCart(cartItemId: number): Observable<Cart> {
    return this.http.delete<Cart>(`${this.apiUrl}/cart/remove/${cartItemId}`, { headers: this.getHeaders() })
      .pipe(
        tap(cart => {
          this.lastCartData = cart;
          this.cartSubject.next(cart);
        }),
        catchError(this.handleError)
      );
  }

  updateCartItem(cartItemId: number, quantity: number): Observable<Cart> {
    return this.http.put<Cart>(`${this.apiUrl}/cart/update/${cartItemId}?quantity=${quantity}`, {}, { headers: this.getHeaders() })
      .pipe(
        tap(cart => {
          this.lastCartData = cart;
          this.cartSubject.next(cart);
        }),
        catchError(this.handleError)
      );
  }

  clearCart(): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/cart/clear`, { headers: this.getHeaders() })
      .pipe(
        tap(() => {
          this.lastCartData = null;
          this.cartSubject.next(null);
        }),
        catchError(this.handleError)
      );
  }

  refreshCart(): void {
    this.lastCartData = null;
    this.getCart().subscribe();
  }

  clearCache(): void {
    this.lastCartData = null;
    this.cartSubject.next(null);
  }
}
