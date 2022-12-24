import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CommonService {
  navigationData = null; /*navigation data for passing id from add story group to add story*/
  generateSequenceNavData = null; /*navigation data for passing id from add chapter to generate sequence*/
  editSequenceNavData = null; /*navigation data for passing id from generate sequence to edit sequence*/
  editCloseGenSeqNavData = null; /*navigation data on close btn from generate seq to chapter*/

  constructor() {
  }

  setNavigationData(value) {
    this.navigationData = value;
  }

  getNavigationData() {
    return this.navigationData;
  }

  clearNavigationData() {
    this.navigationData = null;
  }

  setgenerateSequenceNavData(value) {
    this.generateSequenceNavData = value;
  }

  getgenerateSequenceNavData() {
    return this.generateSequenceNavData;
  }

  cleargenerateSequenceNavData() {
    this.generateSequenceNavData = null;
  }

  setEditSequenceNavData(value) {
    this.editSequenceNavData = value;
  }

  getEditSequenceNavData() {
    return this.editSequenceNavData;
  }

  clearEditSequenceNavData() {
    this.editSequenceNavData = null;
  }

  setCloseGenSequenceNavData(value) {
    this.editCloseGenSeqNavData = value;
  }

  getCloseGenSequenceNavData() {
    return this.editCloseGenSeqNavData;
  }

  clearCloseGenSequenceNavData() {
    this.editCloseGenSeqNavData = null;
  }
}
