import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { tap, shareReplay } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { FoodItem } from '../models/food-item.model';

@Injectable({
  providedIn: 'root'
})
export class FoodService {
  private apiUrl = environment.apiUrl;
  private foodCache = new Map<number, FoodItem>();
  private foodListCache: FoodItem[] | null = null;
  private foodListSubject = new BehaviorSubject<FoodItem[]>([]);
  public foodList$ = this.foodListSubject.asObservable();

  constructor(private http: HttpClient) { }

  getAllFoodItems(): Observable<FoodItem[]> {
   
    if (this.foodListCache) {
      return of(this.foodListCache);
    }

    return this.http.get<FoodItem[]>(`${this.apiUrl}/food`)
      .pipe(
        tap(items => {
          this.foodListCache = items;
          this.foodListSubject.next(items);
          // Cache individual items
          items.forEach(item => {
            if (item.id) {
              this.foodCache.set(item.id, item);
            }
          });
        }),
        shareReplay(1)
      );
  }

  getAvailableFoodItems(): Observable<FoodItem[]> {

    if (this.foodListCache) {
      const available = this.foodListCache.filter(item => item.isAvailable);
      return of(available);
    }

    return this.http.get<FoodItem[]>(`${this.apiUrl}/food/available`)
      .pipe(
        tap(items => {
          this.foodListCache = items;
          this.foodListSubject.next(items);
          items.forEach(item => {
            if (item.id) {
              this.foodCache.set(item.id, item);
            }
          });
        }),
        shareReplay(1)
      );
  }

  getFoodItemsByCategory(category: string): Observable<FoodItem[]> {
    return this.http.get<FoodItem[]>(`${this.apiUrl}/food/category/${category}`);
  }

  searchFoodItems(query: string): Observable<FoodItem[]> {
    return this.http.get<FoodItem[]>(`${this.apiUrl}/food/search?query=${query}`);
  }

  getFoodItemById(id: number): Observable<FoodItem> {
    
    if (this.foodCache.has(id)) {
      console.log('FoodService - Returning cached food item:', id);
      return of(this.foodCache.get(id)!);
    }

    console.log('FoodService - Fetching food item from API:', id);
    return this.http.get<FoodItem>(`${this.apiUrl}/food/${id}`)
      .pipe(
        tap(item => {
          if (item && item.id) {
            this.foodCache.set(item.id, item);
          }
        }),
        shareReplay(1)
      );
  }

  cacheFoodItem(item: FoodItem): void {
    if (item && item.id) {
      this.foodCache.set(item.id, item);
    
      if (this.foodListCache) {
        const existing = this.foodListCache.findIndex(i => i.id === item.id);
        if (existing !== -1) {
          this.foodListCache[existing] = item;
        } else {
          this.foodListCache.push(item);
        }
        this.foodListSubject.next(this.foodListCache);
      }
    }
  }

  getCachedFoodItem(id: number): FoodItem | null {
    return this.foodCache.get(id) || null;
  }

  clearCache(): void {
    this.foodCache.clear();
    this.foodListCache = null;
  }

 
  createFoodItem(foodItem: FoodItem): Observable<FoodItem> {
    return this.http.post<FoodItem>(`${this.apiUrl}/admin/food`, foodItem)
      .pipe(
        tap(item => {
          if (item && item.id) {
            this.foodCache.set(item.id, item);
          }
        })
      );
  }

  updateFoodItem(id: number, foodItem: FoodItem): Observable<FoodItem> {
    return this.http.put<FoodItem>(`${this.apiUrl}/admin/food/${id}`, foodItem)
      .pipe(
        tap(item => {
          if (item && item.id) {
            this.foodCache.set(item.id, item);
            
            if (this.foodListCache) {
              const index = this.foodListCache.findIndex(i => i.id === item.id);
              if (index !== -1) {
                this.foodListCache[index] = item;
                this.foodListSubject.next(this.foodListCache);
              }
            }
          }
        })
      );
  }

  deleteFoodItem(id: number): Observable<void> {
    this.foodCache.delete(id);
    if (this.foodListCache) {
      this.foodListCache = this.foodListCache.filter(item => item.id !== id);
      this.foodListSubject.next(this.foodListCache);
    }
    return this.http.delete<void>(`${this.apiUrl}/admin/food/${id}`);
  }
}
