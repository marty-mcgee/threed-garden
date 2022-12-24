import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-library',
  templateUrl: './library.component.html',
  styleUrls: ['./library.component.scss']
})
export class LibraryComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

 //hiding info box
 visible:boolean = false
 showCountViewModal = false;
 
 
 //onclick toggling both
 onclick()
 {
   this.visible = !this.visible
 }
 
 openCountViewModal() {
   console.log('openCountViewModal called');
   this.showCountViewModal = true;
 }
 
 closeCountViewModal() {
   console.log('closeCountViewModal called');
   this.showCountViewModal = false;
 }
 
 showDuplicateModal = false;
 
 openDuplicateModal() {
   console.log('openDuplicateModal called');
   this.showDuplicateModal = true;
 }
 
 closeDuplicateModal() {
   console.log('closeDuplicateModal called');
   this.showDuplicateModal = false;
 }
 

}
