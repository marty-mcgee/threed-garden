import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';

@Component({
  selector: 'app-thank-you',
  templateUrl: './thank-you.component.html',
  styleUrls: ['./thank-you.component.scss']
})
export class ThankYouComponent implements OnInit {
  couponCode: null;
  discount: null;

  constructor(private router: Router) {
    /*const data = this.router.getCurrentNavigation().extras.state;
    console.log('data => ', data);
    if (!data) {
      this.router.navigate(['/page-not-found']);
    }
    this.couponCode = data.couponCode;
    this.discount = data.discount;
    console.log(this.router.getCurrentNavigation().extras.state, this.couponCode, this.discount);*/
  }

  ngOnInit() {
  }

  goBack() {
    this.router.navigate(['/']);
  }
}
