import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CartService } from '../../services/cart.service';
import { OrderService } from '../../services/order.service';
import { AuthService } from '../../services/auth.service';
import { Cart } from '../../models/cart.model';
import { HttpErrorResponse } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { NotificationService } from '../../services/notification.service';
@Component({
  selector: 'app-cart',
  standalone: true,
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css'],
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule
  ]
})
export class CartComponent implements OnInit, OnDestroy {
  cart: Cart | null = null;
  isLoading: boolean = true;
  isPlacingOrder: boolean = false;
  errorMessage: string = '';
  showCheckoutForm: boolean = false;
  checkoutForm: FormGroup;
  private subscription: Subscription | null = null;


  constructor(
    private fb: FormBuilder,
    private cartService: CartService,
    private orderService: OrderService,
    private authService: AuthService,
    public router: Router,
    private notificationService: NotificationService
  ) {
    this.checkoutForm = this.fb.group({
      deliveryAddress: ['', [Validators.required, Validators.minLength(5)]],
      phoneNumber: ['', [Validators.required, Validators.pattern('^[0-9]{10,15}$')]]
    });
  }

  ngOnInit() {

    const user = this.authService.getCurrentUser();
    if (!user) {
      this.notificationService.showWarning('Please login to view your cart');
      return;
    }

    if (user && user.address) {
      this.checkoutForm.patchValue({ deliveryAddress: user.address });
    }
    if (user && user.phoneNumber) {
      this.checkoutForm.patchValue({ phoneNumber: user.phoneNumber });
    }

    this.checkoutForm.valueChanges.subscribe(value => {
      console.log('Form value changed:', value);
    });

    this.cartService.cart$.subscribe(cart => {
      if (cart) {
        this.cart = cart;
        this.isLoading = false;
      }
    });

    this.loadCart();
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  loadCart() {
    if (!this.cart) {
      this.isLoading = true;
    }

    this.errorMessage = '';
    this.subscription = this.cartService.getCart().subscribe({
      next: (cart) => {
        this.cart = cart;
        this.isLoading = false;
        this.errorMessage = '';
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error loading cart:', err);
        this.isLoading = false;
        if (!this.cart) {
          this.cart = { id: 0, items: [], total: 0 };
        }
        if (err.status === 401 || err.status === 403) {
          this.notificationService.showWarning('Please login to view your cart');
        } else if (err.status === 0) {
          this.notificationService.showError('Cannot connect to server. Please check your connection.');
        } else {
          this.notificationService.showError('Failed to load cart. Please try again.');
        }
      }
    });
  }

  updateQuantity(cartItemId: number, quantity: number) {
    if (quantity <= 0) {
      this.removeItem(cartItemId);
    } else {
      if (this.cart) {
        const item = this.cart.items.find(i => i.id === cartItemId);
        if (item) {
          item.quantity = quantity;
          this.updateCartTotal();
        }
      }

      this.cartService.updateCartItem(cartItemId, quantity).subscribe({
        next: (cart) => {
          this.cart = cart;
          this.errorMessage = '';
        },
        error: (err) => {
          console.error('Error updating quantity:', err);
          this.loadCart();
          if (err.status === 401 || err.status === 403) {
            this.notificationService.showWarning('Session expired. Please login again.');
          }
        }
      });
    }
  }

  removeItem(cartItemId: number) {
    if (confirm('Remove this item from cart?')) {
      if (this.cart) {
        this.cart.items = this.cart.items.filter(i => i.id !== cartItemId);
        this.updateCartTotal();
      }

      this.cartService.removeFromCart(cartItemId).subscribe({
        next: (cart) => {
          this.cart = cart;
          this.errorMessage = '';
        },
        error: (err) => {
          console.error('Error removing item:', err);
          this.loadCart();
          if (err.status === 401 || err.status === 403) {
            this.notificationService.showWarning('Session expired. Please login again.');
          }
        }
      });
    }
  }

  clearCart() {
    if (confirm('Clear all items from cart?')) {
      if (this.cart) {
        this.cart.items = [];
        this.cart.total = 0;
      }

      this.cartService.clearCart().subscribe({
        next: () => {
          if (this.cart) {
            this.cart.items = [];
            this.cart.total = 0;
          }
          this.errorMessage = '';
        },
        error: (err) => {
          console.error('Error clearing cart:', err);
          this.loadCart();
          if (err.status === 401 || err.status === 403) {
            this.notificationService.showWarning('Session expired. Please login again.');
          }
        }
      });
    }
  }

  private updateCartTotal() {
    if (this.cart) {
      this.cart.total = this.cart.items.reduce(
        (sum, item) => sum + (item.price * item.quantity),
        0
      );
    }
  }

  // Show checkout form
  proceedToCheckout() {
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.notificationService.showWarning('Please login to place an order');
      return;
    }
    this.showCheckoutForm = true;
  }

  // Place order with form data
  placeOrder() {
    console.log('Place Order clicked');
    console.log('Form value:', this.checkoutForm.value);

    // Get form values
    const deliveryAddress = this.checkoutForm.get('deliveryAddress')?.value;
    const phoneNumber = this.checkoutForm.get('phoneNumber')?.value;

    console.log('Delivery Address:', deliveryAddress);
    console.log('Phone Number:', phoneNumber);

    // Check if fields are empty
    if (!deliveryAddress || deliveryAddress.trim() === '') {
      this.notificationService.showWarning('Please enter your delivery address.');
      this.checkoutForm.get('deliveryAddress')?.markAsTouched();
      return;
    }

    if (!phoneNumber || phoneNumber.trim() === '') {
      this.notificationService.showWarning('Please enter your phone number.');
      this.checkoutForm.get('phoneNumber')?.markAsTouched();
      return;
    }

    // Validate phone number format
    const phoneRegex = /^[0-9]{10,15}$/;
    if (!phoneRegex.test(phoneNumber)) {
      this.notificationService.showError('Please enter a valid phone number (10-15 digits).');
      this.checkoutForm.get('phoneNumber')?.markAsTouched();
      return;
    }

    // Validate address length
    if (deliveryAddress.length < 5) {
      this.notificationService.showError('Address must be at least 5 characters long.');
      this.checkoutForm.get('deliveryAddress')?.markAsTouched();
      return;
    }

    this.isPlacingOrder = true;
    this.orderService.createOrder(deliveryAddress, phoneNumber).subscribe({
      next: (order) => {
        this.isPlacingOrder = false;
        this.notificationService.showSuccess(' Order placed successfully! Your order #' + order.id);
        this.router.navigate(['/orders']);
      },
      error: (err) => {
        this.isPlacingOrder = false;
        console.error('Error creating order:', err);
        if (err.status === 401 || err.status === 403) {
          this.notificationService.showWarning('Please login again to place your order.');
          this.router.navigate(['/login']);
        } else {
          this.notificationService.showError('Failed to place order. Please try again.');
        }
      }
    });
  }

  // Cancel checkout and go back
  cancelCheckout() {
    this.showCheckoutForm = false;
    this.checkoutForm.reset();
    // Re-fill with user data if available
    const user = this.authService.getCurrentUser();
    if (user) {
      if (user.address) {
        this.checkoutForm.patchValue({ deliveryAddress: user.address });
      }
      if (user.phoneNumber) {
        this.checkoutForm.patchValue({ phoneNumber: user.phoneNumber });
      }
    }
  }

  getTotalItems(): number {
    return this.cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  }

  retryLoading() {
    this.loadCart();
  }
}
