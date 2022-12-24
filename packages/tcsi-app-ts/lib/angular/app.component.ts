import {Component} from '@angular/core';
import {Subscription} from 'rxjs';
import {LoaderService} from './service/loader.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent {
    title = 'storyweb';
    public showLoader = false;
    public showPopup = false;
    public popupData = [];
    private loaderSubscription: Subscription;
    private popupSubscription: Subscription;

    constructor(public loaderService: LoaderService,
    ) {

    }

    ngOnInit() {
        this.loaderSubscription = this.loaderService.loaderStatusChange.subscribe((loaderStatus: boolean) => {
            this.showLoader = loaderStatus;
        });
        this.loaderService.hideLoader();
        this.popupSubscription = this.loaderService.popupStatusChange.subscribe((data: any) => {
            this.popupData = data;
          console.log('popupSubscription => ', this.popupData, typeof this.popupData);
            setTimeout(() => {
                this.popupData = [];
            }, 50000);
        });
    }

    ngOnDestroy() {
        this.loaderSubscription.unsubscribe();
        this.popupSubscription.unsubscribe();
    }
}
