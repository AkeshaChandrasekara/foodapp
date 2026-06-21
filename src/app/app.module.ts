// src/app/app.module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { LoginComponent } from './components/auth/login/login.component';
import { RegisterComponent } from './components/auth/register/register.component';
import { FoodListComponent } from './components/food/food-list/food-list.component';
import { FoodDetailComponent } from './components/food/food-detail/food-detail.component';
import { CartComponent } from './components/cart/cart.component';
import { OrderListComponent } from './components/orders/order-list/order-list.component';
import { AdminPanelComponent } from './components/admin/admin-panel/admin-panel.component';

@NgModule({

  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    LoginComponent,
    RegisterComponent,
    FoodListComponent,
    FoodDetailComponent,
    CartComponent,
    OrderListComponent,
    AdminPanelComponent
  ],
  providers: []
})
export class AppModule { }
