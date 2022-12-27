import {ChangeDetectorRef, Component, OnInit, ViewChild, ElementRef, ViewChildren, QueryList} from '@angular/core';
import {Router} from '@angular/router';
import {LoaderService} from '../service/loader.service';
import {ApiService} from '../service/api.service';
import {AuthService} from '../service/auth.service';
import {CommonService} from '../service/common.service';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {environment} from '../../environments/environment';

@Component({
  selector: 'app-add-story-group',
  templateUrl: './add-story-group.component.html',
  styleUrls: ['./add-story-group.component.scss']
})
export class AddStoryGroupComponent implements OnInit {
  // hiding info box
  visible = false;
  showCountViewModal = false;
  showDuplicateModal = false;
  showDeleteStoryGroupModal = false;
  showAddStory = false;
  showEditDiv = false;
  storyGroupData = [];
  chapters = [];
  title = '';
  id = 1;
  deleteStoryGroupId = 0;
  updateId = 0;
  selectedStoryGroupId = 0;
  selectedStoryId = 0;
  activeKeyExplorer = true;
  selectedImage = null;
  addStoryForm: FormGroup;
  showImageModal = false;
  @ViewChildren('widgetsContent') widgetsContent: QueryList<ElementRef>;

  constructor(private router: Router,
              private loader: LoaderService,
              private apiService: ApiService,
              private cd: ChangeDetectorRef,
              private common: CommonService,
              private formBuilder: FormBuilder,
              private authService: AuthService) {
    this.getStoryGroup();
  }


  ngOnInit() {
    if (this.authService.getIsLoggedIn()) {

    }

    this.addStoryForm = this.formBuilder.group({
      story_group_id: ['', [Validators.required]],
      // file: ['', [Validators.required]],
      title: ['', [Validators.required]],
      description: [''],
      status: [false]
    });
  }

  getStoryGroup() {
    this.loader.showLoader();
    this.apiService.get('api/story-groups', {}, {}, this.authService.getLocalStorage('token'))
      .subscribe((response: any) => {
        console.log('response  api/story-groups', response.story_groups);
        // this.storyGroupData.push(response.story_groups);
        this.storyGroupData = response.story_groups;
        this.cd.detectChanges();
        this.loader.hideLoader();
        // console.log('this.storyGroupData => ', this.storyGroupData);
      }, error => {
        this.loader.hideLoader();
        this.serverErrorHandling(error);
      });
  }

  /*onclick toggling both*/
  onclick() {
    this.visible = !this.visible;
  }

  addStoryBtn() {
    // console.log('test');
    this.title = '';
    this.showAddStory = true;
    // this.storyGroupData = [{title: 'test'}];
  }

  submitTitle(event) {
    console.log('title', event.target.value);
    if (event.target.value !== '') {
      const titleVal = event.target.value;
      this.loader.showLoader();
      this.apiService.post('api/story-groups', {title: titleVal}, {}, this.authService.getLocalStorage('token'))
        .subscribe((response: any) => {
          // console.log('response', response);
          const lastGroup = response.group;
          this.showAddStory = false;
          this.storyGroupData.push(lastGroup);
          // console.log(this.storyGroupData);
          this.loader.hideLoader();
          // this.serverSuccess = response.message;
          this.loader.showPopup({type: 'success', message: response.message});
          this.cd.detectChanges();
        }, error => {
          this.loader.hideLoader();
          this.serverErrorHandling(error);
        });
    } else {
      this.loader.showPopup({type: 'error', message: 'Please enter title.'});
      // console.log('please submit title');
    }
  }

  submitEditTitle(event) {
    // console.log('title', event.target.value);
    if (event.target.value !== '') {
      const titleVal = event.target.value;
      this.loader.showLoader();
      this.apiService.patch('api/story-groups/' + this.updateId, {title: titleVal}, {}, this.authService.getLocalStorage('token'))
        .subscribe((response: any) => {
          console.log('response', response);
          this.loader.hideLoader();
          const existing = this.storyGroupData.find(x => x.id === this.updateId);
          if (existing) {
            existing.title = titleVal;
          }
          this.updateId = 0;
          /*PENDING => insert last insert id*/
          // this.storyGroupData.push({id: this.id, title: titleVal});
        }, error => {
          this.loader.hideLoader();
          this.serverErrorHandling(error);
        });
    } else {
      // console.log('please submit title');
      this.loader.showPopup({type: 'error', message: 'Please enter title.'});
    }
  }

  addStory(storyGroupId) {
    // console.log('title', storyGroupId);
    // this.common.setNavigationData({id: storyGroupId});
    // this.router.navigate(['add-story']);
  }

  editStory(data, story) {
    // console.log(story);
    if (this.selectedStoryId === story.id) {
      this.selectedStoryId = 0;
      this.chapters = [];
      this.showEditDiv = false;
      return false;
    } else {
      this.chapters = [];
      this.loader.showLoader();
      this.apiService.get('api/chapters/' + story.id, {}, {}, this.authService.getLocalStorage('token'))
        .subscribe((response: any) => {
          console.log('response  api/chapters/', response);
          // this.storyGroupData.push(response.story_groups);
          this.chapters = response.chapters;
          this.editDivData(data, story);
          // this.selectedStory = storyId;
          this.loader.hideLoader();
          // console.log('this.storyGroupData => ', this.storyGroupData);
        }, error => {
          this.loader.hideLoader();
          this.serverErrorHandling(error);
        });
    }

  }

  editChapter(chapterId) {
  }

  deleteChapter(chapterId) {
  }

  editDivData(data, story) {
    this.showEditDiv = true;
    this.selectedStoryGroupId = data.id;
    this.selectedStoryId = story.id;
    this.addStoryForm.patchValue({
      story_group_id: data.id,
      title: story.title,
      description: story.description,
      status: story.status,
    });
    this.activeKeyExplorer = story.key_explorer;
    this.selectedImage = this.replaceUrl(story.story_image);
  }

  deleteStoryGroup() {
    if (this.deleteStoryGroupId !== 0) {
      this.loader.showLoader();
      this.apiService.delete('api/story-groups/' + this.deleteStoryGroupId, {}, {}, this.authService.getLocalStorage('token'))
        .subscribe((response: any) => {
          const existingStory = this.storyGroupData.findIndex(x => x.id === this.deleteStoryGroupId);
          if (this.storyGroupData[existingStory]) {
            // console.log('existingStory => ', response.story, existingStory);
            this.storyGroupData.splice(existingStory, 1);
          }
          this.selectedStoryGroupId = 0;
          this.deleteStoryGroupId = 0;
          this.selectedStoryId = 0;
          this.showEditDiv = false;
          this.chapters = [];
          this.closeDeleteStoryGroupModal();
          this.loader.showPopup({type: 'success', message: response.message});
          this.loader.hideLoader();
        }, error => {
          this.loader.hideLoader();
          this.serverErrorHandling(error);
          // console.log('error', error);
        });
    }
  }

  openEdit(updateId) {
    console.log('updateId => ', updateId);
    this.updateId = updateId;
  }

  openCountViewModal() {
    console.log('openCountViewModal called');
    this.showCountViewModal = true;
  }

  closeCountViewModal() {
    console.log('closeCountViewModal called');
    this.showCountViewModal = false;
  }

  openDuplicateModal() {
    console.log('openDuplicateModal called');
    this.showDuplicateModal = true;
  }

  closeDuplicateModal() {
    console.log('closeDuplicateModal called');
    this.showDuplicateModal = false;
  }

  openImageModal() {
    // console.log('openImageModal called');
    this.showImageModal = true;
  }

  closeImageModal() {
    // console.log('closeImageModal called');
    this.showImageModal = false;
  }

  openDeleteStoryGroupModal(storyGroupId) {
    // console.log('openDeleteStoryGroupModal called');
    this.deleteStoryGroupId = storyGroupId;
    this.showDeleteStoryGroupModal = true;
  }

  closeDeleteStoryGroupModal() {
    // console.log('closeDeleteStoryGroupModal called');
    this.deleteStoryGroupId = 0;
    this.showDeleteStoryGroupModal = false;
  }

  replaceUrl(image) {
    return image.replace('undefined', 'https://beacon-development.com:8000');
  }

  serverErrorHandling(error) {
    // const errorData = error.error;
    if (error.status === 404) {
      this.router.navigate(['/page-not-found']);
    }
  }

  scrollLeft(i) {
    this.widgetsContent.toArray()[i].nativeElement.scrollLeft -= environment.scrollLeft;
  }

  scrollRight(i) {
    this.widgetsContent.toArray()[i].nativeElement.scrollLeft += environment.scrollRight;
  }

  secondsToTime(e) {
    if (e === '' || e === null) {
      return '';
    } else {
      const h = Math.floor(e / 3600).toString(); //.padStart(2, '0')
      const m = Math.floor(e % 3600 / 60).toString(); //.padStart(2, '0')
      const s = Math.floor(e % 60).toString(); //.padStart(2, '0')
      // return h + ' hr ' + m + ' min ' + s + ' seconds';
      return h == '0' && m == '0' ? s + ' sec ' : h == '0' ? m + ' min ' : h + ' hr ' + m + ' min ';
    }
  }
}
