import { AdminGuard } from './guard/admin.guard';
// src/app/app-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/auth/login/login.component';
import { RegisterComponent } from './components/auth/register/register.component';
import { FoodListComponent } from './components/food/food-list/food-list.component';
import { FoodDetailComponent } from './components/food/food-detail/food-detail.component';
import { CartComponent } from './components/cart/cart.component';
import { OrderListComponent } from './components/orders/order-list/order-list.component';
import { AdminPanelComponent } from './components/admin/admin-panel/admin-panel.component';
import { AuthGuard } from './guard/auth.guard';

const routes: Routes = [
  { path: '', redirectTo: '/food', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'food', component: FoodListComponent },
  { path: 'food/:id', component: FoodDetailComponent },
  { path: 'cart', component: CartComponent, canActivate: [AuthGuard] },
  { path: 'orders', component: OrderListComponent, canActivate: [AuthGuard] },
  { path: 'admin', component: AdminPanelComponent, canActivate: [AdminGuard] },
  { path: '**', redirectTo: '/food' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
