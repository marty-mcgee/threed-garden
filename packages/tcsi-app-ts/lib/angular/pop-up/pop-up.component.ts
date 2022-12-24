import {Component, Input, OnInit} from '@angular/core';

@Component({
  selector: 'app-pop-up',
  templateUrl: './pop-up.component.html',
  styleUrls: ['./pop-up.component.scss']
})
export class PopUpComponent implements OnInit {
  @Input() popupData = {type: '', message: ''};

  constructor() {
  }

  ngOnInit() {
  }

  closeDiv() {
    this.popupData = {type: '', message: ''};
  }

}

