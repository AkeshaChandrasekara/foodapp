import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
import { CartService } from './services/cart.service';
import { NotificationComponent } from './components/shared/notification/notification.component';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],

  imports: [
    CommonModule,
    RouterModule,
    RouterOutlet,
    NotificationComponent
  ]
})
export class AppComponent implements OnInit {
  isLoggedIn = false;
  isAdmin = false;
  username = '';
  cartItemCount = 0;
  menuOpen = false;

  constructor(
    private authService: AuthService,
    private cartService: CartService
  ) {}

  ngOnInit() {
    this.authService.refreshUser();

    this.authService.currentUser$.subscribe(user => {
      this.isLoggedIn = !!user;
      this.isAdmin = user?.role === 'ADMIN';
      this.username = user?.username || '';
    });

    this.cartService.cart$.subscribe(cart => {
      this.cartItemCount = cart?.items?.length || 0;
    });
  }

  logout() {
    this.authService.logout();
    this.menuOpen = false;
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }
}
