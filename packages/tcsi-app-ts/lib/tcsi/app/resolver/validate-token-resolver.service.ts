import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, Resolve, RouterStateSnapshot} from '@angular/router';
import {ApiService} from '../service/api.service';
// import 'rxjs/Rx';
import {Observable, of} from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import {AuthService} from '../service/auth.service';

@Injectable()
export class ValidateTokenResolverService implements Resolve<any> {
  constructor(private apiService: ApiService,
              private authService: AuthService) {

  }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<{}> | Promise<{}> {
    return this.apiService.post('api/auth/validate-token', {}, {}, this.authService.getLocalStorage('token'))
      .pipe(
        map(response => (response)),
        catchError(error => {
          const message = `Retrieval error: ${error}`;
          console.error(message);
          return of({error});
        })
      );
  }
}
