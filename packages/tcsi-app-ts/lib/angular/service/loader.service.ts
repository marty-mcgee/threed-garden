import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class LoaderService {

    public loaderStatusChange = new Subject<boolean>();
    public popupStatusChange = new Subject<any>();

    constructor() {
    }

    showLoader() {
        this.loaderStatusChange.next(true);
    }

    hideLoader() {
        this.loaderStatusChange.next(false);
    }

    showPopup(message) {
        this.popupStatusChange.next(message);
    }

    showErrorPopup(error) {
        this.popupStatusChange.next(error);
    }

    hidePopup() {
        this.popupStatusChange.next(false);
    }
}
