import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet, NavigationEnd, Router } from '@angular/router';
import { AuthService } from './services/auth.service';
import { CartService } from './services/cart.service';
import { NotificationComponent } from './components/shared/notification/notification.component';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';

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
export class AppComponent implements OnInit, OnDestroy {
  isLoggedIn = false;
  isAdmin = false;
  username = '';
  cartItemCount = 0;
  menuOpen = false;
  showNavbar = true;
  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private cartService: CartService,
    private router: Router
  ) {}

  ngOnInit() {
    this.authService.refreshUser();

    // Subscribe to auth changes
    this.subscriptions.push(
      this.authService.currentUser$.subscribe(user => {
        this.isLoggedIn = !!user;
        this.isAdmin = user?.role === 'ADMIN';
        this.username = user?.username || '';
        // Hide navbar for admin
        this.showNavbar = !this.isAdmin;
      })
    );

    // Subscribe to cart changes
    this.subscriptions.push(
      this.cartService.cart$.subscribe(cart => {
        this.cartItemCount = cart?.items?.length || 0;
      })
    );

    // Check route changes to hide navbar on admin page
    this.subscriptions.push(
      this.router.events.pipe(
        filter(event => event instanceof NavigationEnd)
      ).subscribe((event: NavigationEnd) => {
        const url = event.url;
        // Hide navbar on admin page
        if (url.includes('/admin')) {
          this.showNavbar = false;
        } else if (!this.isAdmin) {
          this.showNavbar = true;
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  logout() {
    this.authService.logout();
    this.menuOpen = false;
    this.router.navigate(['/login']);
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }
}
