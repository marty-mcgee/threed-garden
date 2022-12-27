import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {environment} from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(public http: HttpClient) {
  }

  get(endpoint: string, params?: any, reqOpts?: any, authHeader: string = null) {
    if (!reqOpts) {
      reqOpts = {
        params: new HttpParams()
      };
    }

    let headers = new HttpHeaders().set('Accept', 'application/json');
    if (authHeader) {
      headers = new HttpHeaders().set('Accept', 'application/json')
        .append('Authorization', 'Bearer ' + authHeader);
    }
    reqOpts.headers = headers;
    // Support easy query params for GET requests
    if (params) {
      reqOpts.params = new HttpParams();
      // tslint:disable-next-line:forin
      for (const k in params) {
        reqOpts.params.set(k, params[k]);
      }
    }
    console.log(reqOpts);
    return this.http.get(environment.url + '/' + endpoint, reqOpts);
  }

  post(endpoint: string, body?: any, reqOpts: any = {}, authHeader: string = null) {
    console.log(environment.url + '/' + endpoint, body, reqOpts, authHeader);
    let headers = new HttpHeaders().set('Accept', 'application/json');
    if (authHeader) {
      headers = new HttpHeaders().set('Accept', 'application/json')
        .append('Authorization', 'Bearer ' + authHeader);
    }

    reqOpts.headers = headers;

    return this.http.post(environment.url + '/' + endpoint, body, reqOpts);
  }

  patch(endpoint: string, body?: any, reqOpts: any = {}, authHeader: string = null) {
    console.log(environment.url + '/' + endpoint, body, reqOpts, authHeader);
    let headers = new HttpHeaders().set('Accept', 'application/json');
    if (authHeader) {
      headers = new HttpHeaders().set('Accept', 'application/json')
        .append('Authorization', 'Bearer ' + authHeader);
    }

    reqOpts.headers = headers;

    return this.http.patch(environment.url + '/' + endpoint, body, reqOpts);
  }

    delete(endpoint: string, body?: any, reqOpts: any = {}, authHeader: string = null) {
        console.log(environment.url + '/' + endpoint, body, reqOpts, authHeader);
        let headers = new HttpHeaders().set('Accept', 'application/json');
        if (authHeader) {
            headers = new HttpHeaders().set('Accept', 'application/json')
                .append('Authorization', 'Bearer ' + authHeader);
        }

        reqOpts.headers = headers;

        return this.http.delete(environment.url + '/' + endpoint, reqOpts);
    }
}
