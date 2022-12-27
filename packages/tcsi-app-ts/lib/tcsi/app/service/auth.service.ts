import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  isLoggedIn = false;
  public loggedInStatusChange = new Subject<boolean>();

  constructor() {
  }

  setAuthDetails() {
    // return true;
  }

  getAuthDetails() {
    return true;
  }

  setIsLoggedIn(value) {
    this.loggedInStatusChange.next(value);
  }

  getIsLoggedIn() {
    console.log('token => ', this.getLocalStorage('token'));
    if (localStorage.getItem('token')) {
      return true;
    } else {
      return false;
    }
  }

  setLocalStorage(key, value) {
    localStorage.setItem(key, value);
  }

  getLocalStorage(key) {
    return localStorage.getItem(key);
  }

  removeLocalStorage(key) {
    return localStorage.removeItem(key);
  }

  clearLocalStorage() {
    return localStorage.clear();
  }
}
