import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {environment} from '../../environments/environment';
import {LoaderService} from '../service/loader.service';
import {ApiService} from '../service/api.service';
import {Router} from '@angular/router';
import {AuthService} from '../service/auth.service';
import {Subscription} from 'rxjs';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {

  showLogin = false;
  showRegister = false;
  showOtp = false;
  showSetPassword = false;
  showForgotPassword = false;
  showForgotSetPassword = false;
  registerForm: FormGroup;
  loginForm: FormGroup;
  otpForm: FormGroup;
  setPasswordForm: FormGroup;
  forgotPasswordForm: FormGroup;
  forgotSetPasswordForm: FormGroup;
  validMobile = false;
  validEmail = false;
  validOtp = false;
  validpassword = false;
  email = '';
  showError = '';
  serverError = '';
  serverSuccess = '';
  isLoggedIn = false;
  isAdmin = false;
  removeClosePopup = true;
  setForgotPassword = false;
  private loggedInSubscription: Subscription;
  showMobileMenu = false;
  showText = false;
  showTextConfirm = false;

  constructor(private formBuilder: FormBuilder,
              private loader: LoaderService,
              private apiService: ApiService,
              private authService: AuthService,
              private router: Router,
              private cd: ChangeDetectorRef
  ) {
    this.loader.showLoader();
    this.apiService.post('api/auth/validate-token', {}, {}, this.authService.getLocalStorage('token'))
      .subscribe((response: any) => {
        console.log('response', response);
        this.loader.hideLoader();
        this.isLoggedIn = true;
        this.setUserRole(response.roles);
        // this.authService.setLocalStorage('token', response.accessToken);
        this.authService.setLocalStorage('userData', JSON.stringify(response.user_details));
      }, error => {
        this.loader.hideLoader();
        this.router.navigate(['/']);
        this.authService.clearLocalStorage();
        this.isLoggedIn = false;
        // console.log('error', error);
        // this.serverErrorHandling(error);
      });
  }

  ngOnInit() {
    this.clearErrorMessage();
    this.loggedInSubscription = this.authService.loggedInStatusChange.subscribe((status: boolean) => {
      this.isLoggedIn = status;
      this.cd.detectChanges();
      console.log('this.isLoggedIn => ', this.isLoggedIn);
    });

    this.registerForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.pattern(environment.nameRegex)]],
      email: ['', [Validators.required, Validators.pattern(environment.emailRegex)]],
      mobile: ['', [Validators.pattern(environment.mobileRegex)]],
    });

    this.loginForm = this.formBuilder.group({
      email: ['shashank@appectual.com', [Validators.required, Validators.pattern(environment.emailRegex)]],
      password: ['12345678', [Validators.required]]
    });

    this.otpForm = this.formBuilder.group({
      otp: ['', [Validators.required, Validators.pattern(environment.otpRegex)]]
    });

    this.setPasswordForm = this.formBuilder.group({
      password: ['', [Validators.required, Validators.pattern(environment.passwordRegex)]],
      c_password: ['', [Validators.required]]
    });

    this.forgotPasswordForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.pattern(environment.emailRegex)]]
    });

    this.forgotSetPasswordForm = this.formBuilder.group({
      password: ['', [Validators.required, Validators.pattern(environment.passwordRegex)]],
      c_password: ['', [Validators.required]]
    });
  }

  submitRegister() {
    this.clearErrorMessage();
    if (this.registerForm.invalid) {
      Object.keys(this.registerForm.controls).forEach(key => {
        this.registerForm.get(key).markAsDirty();
        this.validEmail = true;
        this.validMobile = true;
      });
      return;
    }

    this.loader.showLoader();
    const params = {
      name: this.registerForm.controls.name.value,
      mobile: this.registerForm.controls.mobile.value,
      email: this.registerForm.controls.email.value,
    };

    this.apiService.post('api/auth/register', params)
      .subscribe((response: any) => {
        // console.log('response', response);
        this.loader.hideLoader();
        this.email = this.registerForm.controls.email.value;
        this.serverSuccess = response.message;
        this.otpForm.patchValue({
          otp: response.otp,
        });
        this.openOtpModal();
      }, error => {
        this.loader.hideLoader();
        // console.log('error', error);
        this.serverErrorHandling(error);
      });
  }

  setUserRole(roles) {
    if (roles.length > 0) {
      if (roles[0] === 'ROLE_ADMIN') {
        this.isAdmin = true;
      }
      if (roles[0] === 'ROLE_USER') {
        this.isAdmin = false;
      }
    }
  }

  submitLogin() {
    if (this.loginForm.invalid) {
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key).markAsDirty();
        this.validEmail = true;
      });
      return;
    }

    this.loader.showLoader();
    const params = {
      email: this.loginForm.controls.email.value,
      password: this.loginForm.controls.password.value,
    };
    // console.log(params);
    this.apiService.post('api/auth/login', params)
      .subscribe((response: any) => {
        console.log('response', response);
        this.loader.hideLoader();
        this.isLoggedIn = true;
        this.setUserRole(response.roles);
        this.serverSuccess = response.message;
        this.authService.setLocalStorage('token', response.accessToken);
        this.authService.setLocalStorage('userData', JSON.stringify(response.user_details));
        this.closeLoginModal();
      }, error => {
        this.loader.hideLoader();
        // console.log('error', error);
        this.serverErrorHandling(error);
      });
  }

  verifyOtp() {
    this.clearErrorMessage();
    if (this.otpForm.invalid) {
      Object.keys(this.otpForm.controls).forEach(key => {
        this.otpForm.get(key).markAsDirty();
        this.validOtp = true;
      });
      return;
    }

    this.loader.showLoader();
    const params = {
      otp: this.otpForm.controls.otp.value,
      email: this.email,
    };
    // console.log(params);

    this.apiService.post('api/auth/verify-otp', params)
      .subscribe((response: any) => {
        // console.log('response', response);
        this.loader.hideLoader();
        this.serverSuccess = response.message;
        this.authService.setLocalStorage('token', response.accessToken);
        this.authService.setLocalStorage('userData', JSON.stringify(response.user_details));
        this.email = '';
        this.isLoggedIn = true;
        this.removeClosePopup = false;
        if (this.setForgotPassword) {
          this.openForgotSetPasswordModal();
        } else {
          this.openSetPasswordModal();
        }
      }, error => {
        this.loader.hideLoader();
        // console.log('error', error);
        this.serverErrorHandling(error);
      });
  }

  resendOtp() {
    this.clearErrorMessage();
    this.loader.showLoader();
    const params = {
      email: this.email
    };
    // console.log(params);

    this.apiService.post('api/auth/send-otp', params)
      .subscribe((response: any) => {
        // console.log('response', response);
        this.loader.hideLoader();
        this.serverSuccess = response.message;
      }, error => {
        this.loader.hideLoader();
        // console.log('error', error);
        this.serverErrorHandling(error);
      });
  }

  submitPassword() {
    this.clearErrorMessage();
    if (this.setPasswordForm.invalid) {
      Object.keys(this.setPasswordForm.controls).forEach(key => {
        this.setPasswordForm.get(key).markAsDirty();
        this.validpassword = true;
      });
      return;
    } else {
      if (this.setPasswordForm.controls.password.value !== this.setPasswordForm.controls.c_password.value) {
        this.serverError = 'password and confirm password does not match';
        this.serverSuccess = '';
        return;
      } else {
        this.loader.showLoader();
        const params = {
          // email: this.email,
          password: this.setPasswordForm.controls.password.value,
          confirm_password: this.setPasswordForm.controls.c_password.value,
        };
        console.log(params);
        /*this.loader.hideLoader();
        this.closeLoginModal();*/

        this.apiService.post('api/users/password', params, {}, this.authService.getLocalStorage('token'))
          .subscribe((response: any) => {
            console.log('response', response);
            this.isLoggedIn = true;
            // this.setUserRole(response.roles);
            this.loader.hideLoader();
            this.serverSuccess = response.message;
            this.closeLoginModal();
          }, error => {
            this.loader.hideLoader();
            // console.log('error', error);
            this.serverErrorHandling(error);
          });
      }
    }
  }

  submitForgotPassword() {
    if (this.forgotPasswordForm.invalid) {
      Object.keys(this.forgotPasswordForm.controls).forEach(key => {
        this.forgotPasswordForm.get(key).markAsDirty();
        this.validEmail = true;
      });
      return;
    }

    this.loader.showLoader();
    const params = {
      email: this.forgotPasswordForm.controls.email.value
    };
    console.log(params);

    /*//go to otp page*/
    this.apiService.post('api/auth/forgot-password', params)
      .subscribe((response: any) => {
        console.log('response', response);
        this.loader.hideLoader();
        this.email = this.forgotPasswordForm.controls.email.value;
        this.otpForm.patchValue({
          otp: response.otp,
        });
        // this.openForgotSetPasswordModal();
        this.openOtpModal();
        this.serverSuccess = response.message;
      }, error => {
        this.loader.hideLoader();
        // console.log('error', error);
        this.serverErrorHandling(error);
      });
  }

  submitSetForgotPassword() {
    if (this.forgotSetPasswordForm.invalid) {
      Object.keys(this.forgotSetPasswordForm.controls).forEach(key => {
        this.forgotSetPasswordForm.get(key).markAsDirty();
        this.validEmail = true;
      });
      return;
    }

    if (this.forgotSetPasswordForm.controls.password.value !== this.forgotSetPasswordForm.controls.c_password.value) {
      this.serverError = 'password and confirm password does not match';
      this.serverSuccess = '';
      return;
    } else {
      this.loader.showLoader();
      const params = {
        password: this.forgotSetPasswordForm.controls.password.value,
        confirm_password: this.forgotSetPasswordForm.controls.c_password.value
      };
      console.log(params);
      this.loader.hideLoader();
      this.apiService.post('api/users/password', params, {}, this.authService.getLocalStorage('token'))
        .subscribe((response: any) => {
          console.log('response', response);
          this.loader.hideLoader();
          this.serverSuccess = response.message;
          this.closeForgotPasswordModal();
        }, error => {
          this.loader.hideLoader();
          // console.log('error', error);
          this.serverErrorHandling(error);
        });
    }
  }

  logout() {
    this.apiService.post('api/auth/logout', {}, {}, this.authService.getLocalStorage('token'))
      .subscribe((response: any) => {
        console.log('response', response);
        this.loader.hideLoader();
        this.isLoggedIn = false;
        this.router.navigate(['']);
        this.authService.removeLocalStorage('token');
        this.authService.removeLocalStorage('userData');
      }, error => {
        this.loader.hideLoader();
        // console.log('error', error);
        this.serverErrorHandling(error);
      });
  }

  openLoginModal() {
    this.clearErrorMessage();
    this.closeForgotPasswordModal();
    this.setForgotPassword = false;
    this.showLogin = true;
    this.showRegister = false;
    this.showOtp = false;
    this.showSetPassword = false;
    this.showText = false;
    this.showTextConfirm = false;
  }

  openRegisterModal() {
    this.showLogin = false;
    this.showRegister = true;
    this.showOtp = false;
    this.showSetPassword = false;
    this.showText = false;
    this.showTextConfirm = false;
  }

  openOtpModal() {
    this.closeForgotPasswordModal();
    this.showLogin = false;
    this.showRegister = false;
    this.showOtp = true;
    this.showSetPassword = false;
    this.showText = false;
    this.showTextConfirm = false;
  }

  openSetPasswordModal() {
    this.showLogin = false;
    this.showRegister = false;
    this.showOtp = false;
    this.showSetPassword = true;
    this.showText = false;
  }

  closeLoginModal() {
    this.showLogin = false;
    this.showRegister = false;
    this.showOtp = false;
    this.showSetPassword = false;
    this.removeClosePopup = true;
    this.showText = false;
  }

  openForgotPasswordModal() {
    this.closeLoginModal();
    this.setForgotPassword = true;
    this.showForgotPassword = true;
    this.showForgotSetPassword = false;
    this.showText = false;
    this.showTextConfirm = false;
  }

  openForgotSetPasswordModal() {
    this.closeLoginModal();
    this.removeClosePopup = false;
    this.showForgotPassword = false;
    this.showForgotSetPassword = true;
  }

  closeForgotPasswordModal() {
    this.showForgotPassword = false;
    this.showForgotSetPassword = false;
    this.removeClosePopup = true;
    this.showText = false;
    this.showTextConfirm = false;
  }

  clearErrorMessage() {
    this.serverError = '';
    this.serverSuccess = '';
  }

  serverErrorHandling(error) {
    const errorData = error.error;
    if (error.status === 400 || error.status === 401 || error.status === 404 || error.status === 422) {
      this.serverError = errorData.message;
    }
  }

  openMobileMenu() {
    console.log('openMobileMenu called');
    this.showMobileMenu = true;
  }

  closeMobileMenu() {
    console.log('closeMobileMenu called');
    this.showMobileMenu = false;
  }

  showHidePass() {
    this.showText = !this.showText;
  }

  showHidePassConfirm() {
    this.showTextConfirm = !this.showTextConfirm;
  }
}
