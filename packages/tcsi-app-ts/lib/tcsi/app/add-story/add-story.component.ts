import {ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild, ViewChildren, QueryList} from '@angular/core';
import {AuthService} from '../service/auth.service';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {CommonService} from '../service/common.service';
import {Router} from '@angular/router';
import {LoaderService} from '../service/loader.service';
import {ApiService} from '../service/api.service';
import {DomSanitizer} from '@angular/platform-browser';
import {environment} from '../../environments/environment';

@Component({
  selector: 'app-add-story',
  templateUrl: './add-story.component.html',
  styleUrls: ['./add-story.component.scss']
})
export class AddStoryComponent implements OnInit {
  addStoryForm: FormGroup;
  duplicateStoryForm: FormGroup;
  selectedStoryGroup = 0;
  visible = false;
  showCountViewModal = false;
  showDuplicateModal = false;
  showDeleteCapModal = false;
  showDeleteStoryModal = false;
  showEditDiv = false;
  activeKeyExplorer = true;
  storyGroupData = [];
  @ViewChild('fileUpload', {static: false}) fileUpload: ElementRef;
  files = [];
  selectedStoryGroupId = 0;
  selectedStoryId = 0;
  deleteChapterId = 0;
  deleteStoryId = 0;
  selectedImage = null;
  showImageModal = false;
  chapters = [];
  @ViewChildren('widgetsContent') widgetsContent: QueryList<ElementRef>;

  constructor(private router: Router,
              private formBuilder: FormBuilder,
              private loader: LoaderService,
              private apiService: ApiService,
              private cd: ChangeDetectorRef,
              private common: CommonService,
              private sanitize: DomSanitizer,
              private authService: AuthService) {
    if (this.authService.getIsLoggedIn()) {

    }
    if (this.common.getNavigationData() !== null) {
      this.selectedStoryGroup = this.common.getNavigationData();
    }
    this.getStoryGroup();
  }

  ngOnInit() {
    this.addStoryForm = this.formBuilder.group({
      story_group_id: ['', [Validators.required]],
      // file: ['', [Validators.required]],
      title: ['', [Validators.required]],
      description: [''],
      status: [false]
    });

    this.duplicateStoryForm = this.formBuilder.group({
      story_group_id: ['', [Validators.required]],
    });
  }

  fileSelection(event: any) {
    this.files = [];
    const fileUpload = this.fileUpload.nativeElement;
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onload = e => this.selectedImage = reader.result;
      reader.readAsDataURL(file);
    }
    // tslint:disable-next-line:prefer-for-of
    for (let index = 0; index < fileUpload.files.length; index++) {
      const file = fileUpload.files[index];
      this.files.push({data: file, inProgress: false, progress: 0});
    }
  }

  saveStory() {
    if (this.addStoryForm.invalid) {
      const errorArray = [];
      Object.keys(this.addStoryForm.controls).forEach(key => {
        this.addStoryForm.get(key).markAsDirty();
        if (this.addStoryForm.get(key).errors !== null) {
          if (this.addStoryForm.get(key)) {
            errorArray.push({key, error: this.addStoryForm.get(key).errors});
          }
        }
      });
      if (errorArray.length > 0) {
        this.loader.showPopup({type: 'frontend_error_array', message: errorArray});
      }
      return;
    }

    // this.fileUpload.nativeElement.value = '';
    this.loader.showLoader();
    const formData = new FormData();
    /*this.files.forEach(file => {
      formData.append('file', file.data);
    });*/
    if (this.files.length > 0) {
      formData.append('story_image', this.files[0].data);
      console.log(this.files[0].data);
    }
    const params = {
      // story_group_id: this.addStoryForm.controls.story_group_id.value,
      title: this.addStoryForm.controls.title.value,
      key_explorer: this.activeKeyExplorer ? 1 : 0,
      description: this.addStoryForm.controls.description.value,
      status: this.addStoryForm.controls.status.value,
    };

    // tslint:disable-next-line:forin
    for (const key in params) {
      formData.append(key, params[key]);
    }

    console.log(params);

    if (this.selectedStoryId === 0) {
      /*INSERT NEW STORY*/
      formData.append('story_group_id', this.addStoryForm.controls.story_group_id.value);
      this.apiService.post('api/stories', formData, {}, this.authService.getLocalStorage('token'))
        .subscribe((response: any) => {
          // console.log('response', response);
          const existing = this.storyGroupData.find(x => x.id === this.selectedStoryGroupId);
          // console.log('existing =>', existing, this.storyGroupData, this.selectedStoryGroupId);
          if (existing) {
            existing.stories.push(response.story);
            this.selectedStoryId = response.story.id;
            // console.log('existing new =>', response.story, this.storyGroupData);
          }
          this.fileUpload.nativeElement.value = '';
          this.files = [];
          this.loader.showPopup({type: 'success', message: response.message});
          this.loader.hideLoader();
        }, error => {
          this.loader.hideLoader();
          this.serverErrorHandling(error);
          // console.log('error', error);
        });
    } else {
      /*UPDATE EXISTING STORY*/
      this.apiService.patch('api/stories/' + this.selectedStoryId, formData, {}, this.authService.getLocalStorage('token'))
        .subscribe((response: any) => {
          const existing = this.storyGroupData.filter(function(val, key) {
            // console.log('existing check => ', val, key);
            if (val.id === this.selectedStoryGroupId) {
              // console.log('existing data => ', val, key);
              const existingStory = this.storyGroupData[key].stories.findIndex(x => x.id === this.selectedStoryId);
              if (this.storyGroupData[key].stories[existingStory]) {
                // console.log('existingStory => ', response.story, existingStory);
                this.storyGroupData[key].stories[existingStory] = response.story;
              }
            }
          }, this);
          this.fileUpload.nativeElement.value = '';
          this.files = [];
          this.loader.showPopup({type: 'success', message: response.message});
          // console.log(this.storyGroupData);
          this.loader.hideLoader();
        }, error => {
          this.loader.hideLoader();
          this.serverErrorHandling(error);
          // console.log('error', error);
        });
    }
  }

  submitDuplicate() {
    if (this.duplicateStoryForm.invalid) {
      const errorArray = [];
      Object.keys(this.duplicateStoryForm.controls).forEach(key => {
        this.duplicateStoryForm.get(key).markAsDirty();
        if (this.duplicateStoryForm.get(key).errors !== null) {
          if (this.duplicateStoryForm.get(key)) {
            errorArray.push({key, error: this.duplicateStoryForm.get(key).errors});
          }
        }
      });
      if (errorArray.length > 0) {
        this.loader.showPopup({type: 'frontend_error_array', message: errorArray});
      }
      return;
    }

    // this.fileUpload.nativeElement.value = '';
    this.loader.showLoader();
    const storyGroupId = Number(this.duplicateStoryForm.controls.story_group_id.value);
    const params = {
      story_group_id: storyGroupId,
      story_id: this.duplicateStoryForm.controls.story_group_id.value,
    };

    console.log(params, this.selectedStoryId);
    this.loader.hideLoader();

    this.apiService.post('api/stories/duplicate/' + this.selectedStoryId, params, {}, this.authService.getLocalStorage('token'))
      .subscribe((response: any) => {
        // console.log('response', response);
        const existing = this.storyGroupData.find(x => x.id === storyGroupId);
        console.log('existing => ', existing, this.storyGroupData, storyGroupId);
        if (existing) {
          existing.stories.push(response.story);
          this.selectedStoryId = response.story.id;
          // console.log('existing new =>', response.story, this.storyGroupData);
        }
        this.fileUpload.nativeElement.value = '';
        this.files = [];
        this.closeDuplicateModal();
        this.loader.showPopup({type: 'success', message: response.message});
        this.loader.hideLoader();
      }, error => {
        this.loader.hideLoader();
        this.serverErrorHandling(error);
        // console.log('error', error);
      });
  }

  getStoryGroup() {
    // console.log('response', response);
    this.loader.showLoader();
    this.apiService.get('api/story-groups', {with_stories: true}, {}, this.authService.getLocalStorage('token'))
      .subscribe((response: any) => {
        // console.log('response  api/story-groups', response.story_groups);
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

  changeStoryGroup(event) {
    this.addStory(event.target.value);
  }

  addStory(id) {
    // console.log('storyChangeId => ', id);
    // this.fileUpload.nativeElement.value = '';
    this.addStoryForm.patchValue({
      story_group_id: id,
      title: '',
      description: '',
      status: true,
    });
    this.activeKeyExplorer = true;
    this.selectedStoryGroupId = id;
    this.selectedStoryId = 0;
    this.selectedImage = null;
    this.showEditDiv = true;
  }

  changeKeyExplorer() {
    this.activeKeyExplorer = !this.activeKeyExplorer;
    // console.log(this.activeKeyExplorer);
  }

  editStory(data, story) {
    // console.log(story);
    if (this.selectedStoryId === story.id) {
      this.addStory(data.id);
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

  deleteChapter() {
    if (this.deleteChapterId !== 0) {
      this.loader.showLoader();
      this.apiService.delete('api/chapters/' + this.deleteChapterId, {}, {}, this.authService.getLocalStorage('token'))
        .subscribe((response: any) => {
          const deleteStory = this.chapters.findIndex(x => x.id === this.deleteChapterId);
          this.chapters.splice(deleteStory, 1);
          this.showDeleteCapModal = false;
          this.deleteChapterId = 0;
          this.loader.showPopup({type: 'success', message: response.message});
          this.loader.hideLoader();
        }, error => {
          this.loader.hideLoader();
          this.serverErrorHandling(error);
          // console.log('error', error);
        });
    }
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
    // this.selectedStory = storyId;
  }

  openCountViewModal() {
    console.log('openCountViewModal called');
    this.showCountViewModal = true;
  }

  closeCountViewModal() {
    console.log('closeCountViewModal called');
    this.showCountViewModal = false;
  }

  openDeleteCapModal(chapterId) {
    console.log('openDeleteCapModal called');
    this.deleteChapterId = chapterId;
    this.showDeleteCapModal = true;
  }

  closeDeleteCapModal() {
    console.log('closeDeleteCapModal called');
    this.showDeleteCapModal = false;
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

  openDeleteStoryModal() {
    // console.log('openDeleteStoryModal called');
    this.showDeleteStoryModal = true;
  }

  closeDeleteStoryModal() {
    // console.log('closeDeleteStoryModal called');
    this.showDeleteStoryModal = false;
  }

  /*ngOnDestroy() {
    console.log('onDestroy called');
    this.common.clearNavigationData();
  }*/

  replaceUrl(image) {
    return image.replace('undefined', 'https://beacon-development.com:8000');
  }

  serverErrorHandling(error) {
    // const errorData = error.error;
    if (error.status === 404) {
      this.router.navigate(['/page-not-found']);
    }
  }

  noDuplicate() {

  }

  deleteStory() {
    if (this.selectedStoryId !== 0) {
      this.loader.showLoader();
      this.apiService.delete('api/stories/' + this.selectedStoryId, {}, {}, this.authService.getLocalStorage('token'))
        .subscribe((response: any) => {
          this.storyGroupData.filter(function(val, key) {
            // console.log('existing check => ', val, key);
            if (val.id === this.selectedStoryGroupId) {
              // console.log('existing data => ', val, key);
              const existingStory = this.storyGroupData[key].stories.findIndex(x => x.id === this.selectedStoryId);
              if (this.storyGroupData[key].stories[existingStory]) {
                // console.log('existingStory => ', response.story, existingStory);
                this.storyGroupData[key].stories.splice(existingStory, 1);
              }
            }
          }, this);
          this.addStory(this.selectedStoryGroupId);
          this.closeDeleteStoryModal();
          this.loader.showPopup({type: 'success', message: response.message});
          this.selectedStoryId = 0;
          this.loader.hideLoader();
        }, error => {
          this.loader.hideLoader();
          this.serverErrorHandling(error);
          // console.log('error', error);
        });
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
      console.log(h, m, s);
      return h == '0' && m == '0' ? s + ' sec ' : h == '0' ? m + ' min ' : h + ' hr ' + m + ' min ';
    }
  }
}
