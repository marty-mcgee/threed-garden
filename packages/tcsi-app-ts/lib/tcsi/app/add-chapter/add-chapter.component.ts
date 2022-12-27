import {ChangeDetectorRef, Component, ElementRef, OnInit, QueryList, ViewChild, ViewChildren} from '@angular/core';
import {Router} from '@angular/router';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {LoaderService} from '../service/loader.service';
import {ApiService} from '../service/api.service';
import {CommonService} from '../service/common.service';
import {DomSanitizer} from '@angular/platform-browser';
import {AuthService} from '../service/auth.service';
import {environment} from '../../environments/environment';

@Component({
  selector: 'app-add-chapter',
  templateUrl: './add-chapter.component.html',
  styleUrls: ['./add-chapter.component.scss']
})
export class AddChapterComponent implements OnInit {
  showSuccessfulModal = false;
  duplicateChapterForm: FormGroup;
  visible = false;
  showCountViewModal = false;
  showDuplicateModal = false;
  showDeleteCapModal = false;
  addChapterForm: FormGroup;
  selectedStoryGroup = 0;
  showEditDiv = false;
  activeKeyExplorer = true;
  storyGroupData = [];
  storyListData = [];
  storyData = [];
  @ViewChild('fileUpload', {static: false}) fileUpload: ElementRef;
  files = [];
  selectedStoryGroupId = 0;
  selectedStoryId = 0;
  selectedChapterId = 0;
  deleteChapterId = 0;
  selectedImage = null;
  showImageModal = false;
  chapters = [];
  @ViewChildren('widgetsContent') widgetsContent: QueryList<ElementRef>;
  getCloseGenSequenceNavData = null;

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
    /*if (this.common.getNavigationData() !== null) {
      this.selectedStoryGroup = this.common.getNavigationData();
    }*/
    this.getStoryGroup();
    if (this.common.getCloseGenSequenceNavData() !== null) {
      console.log('getCloseGenSequenceNavData', this.common.getCloseGenSequenceNavData());
      this.getCloseGenSequenceNavData = this.common.getCloseGenSequenceNavData();
    }
  }

  ngOnInit() {
    this.addChapterForm = this.formBuilder.group({
      story_id: ['', [Validators.required]],
      title: ['', [Validators.required]],
      description: [''],
      // audio_length: [''],
      status: [false]
    });

    this.duplicateChapterForm = this.formBuilder.group({
      story_group_id: ['', [Validators.required]],
      story_id: ['', [Validators.required]],
    });
  }

  getStoryGroup() {
    // console.log('response', response);
    this.loader.showLoader();
    this.apiService.get('api/story-groups', {with_stories: true}, {}, this.authService.getLocalStorage('token'))
      .subscribe((response: any) => {
        console.log('response  api/story-groups', response.story_groups);
        // this.storyGroupData.push(response.story_groups);
        this.storyGroupData = response.story_groups;

        if (this.getCloseGenSequenceNavData !== null) {
          const findIndex = this.storyGroupData.findIndex(x => x.id === this.getCloseGenSequenceNavData.story_group_id);
          if (this.storyGroupData[findIndex]) {
            console.log('findIndex => ', this.storyGroupData[findIndex]);
            this.editStory(this.getCloseGenSequenceNavData.story_id, this.storyGroupData[findIndex]);
          }
        }

        this.cd.detectChanges();
        this.loader.hideLoader();
        // console.log('this.storyGroupData => ', this.storyGroupData);
      }, error => {
        this.loader.hideLoader();
        this.serverErrorHandling(error);
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

  saveChapter() {
    if (this.addChapterForm.invalid) {
      const errorArray = [];
      Object.keys(this.addChapterForm.controls).forEach(key => {
        this.addChapterForm.get(key).markAsDirty();
        if (this.addChapterForm.get(key).errors !== null) {
          if (this.addChapterForm.get(key)) {
            errorArray.push({key, error: this.addChapterForm.get(key).errors});
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
      formData.append('chapter_image', this.files[0].data);
      console.log(this.files[0].data);
    }
    const params = {
      // story_group_id: this.addChapterForm.controls.story_group_id.value,
      title: this.addChapterForm.controls.title.value,
      key_explorer: this.activeKeyExplorer ? 1 : 0,
      description: this.addChapterForm.controls.description.value,
      status: this.addChapterForm.controls.status.value,
    };

    // tslint:disable-next-line:forin
    for (const key in params) {
      formData.append(key, params[key]);
    }

    console.log(params);

    if (this.selectedChapterId === 0) {
      /*INSERT NEW STORY*/
      formData.append('story_id', this.addChapterForm.controls.story_id.value);
      this.apiService.post('api/chapters', formData, {}, this.authService.getLocalStorage('token'))
        .subscribe((response: any) => {
          // console.log('response', response);
          this.chapters.push(response.chapter);
          this.selectedChapterId = response.chapter.id;
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
      this.apiService.patch('api/chapters/' + this.selectedChapterId, formData, {}, this.authService.getLocalStorage('token'))
        .subscribe((response: any) => {
          const existingStory = this.chapters.findIndex(x => x.id === this.selectedChapterId);
          if (this.chapters[existingStory]) {
            // console.log('existingStory => ', response.story, existingStory);
            this.chapters[existingStory] = response.chapter;
          }
          this.selectedChapterId = response.chapter.id;
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
    if (this.duplicateChapterForm.invalid) {
      const errorArray = [];
      Object.keys(this.duplicateChapterForm.controls).forEach(key => {
        this.duplicateChapterForm.get(key).markAsDirty();
        if (this.duplicateChapterForm.get(key).errors !== null) {
          if (this.duplicateChapterForm.get(key)) {
            errorArray.push({key, error: this.duplicateChapterForm.get(key).errors});
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
    const storyGroupId = Number(this.duplicateChapterForm.controls.story_group_id.value);
    const storyId = Number(this.duplicateChapterForm.controls.story_id.value);

    const params = {
      story_group_id: storyGroupId,
      story_id: storyId,
    };

    console.log(params, this.selectedStoryId, this.selectedStoryGroupId);
    this.apiService.post('api/chapters/duplicate/' + this.selectedChapterId, params, {}, this.authService.getLocalStorage('token'))
      .subscribe((response: any) => {
        // console.log('response', response);
        if (this.selectedStoryId === storyId) {
          this.chapters.push(response.chapter);
        }
        this.fileUpload.nativeElement.value = '';
        this.files = [];
        this.loader.showPopup({type: 'success', message: response.message});
        this.closeDuplicateModal();
        this.loader.hideLoader();
      }, error => {
        this.loader.hideLoader();
        this.serverErrorHandling(error);
        // console.log('error', error);
      });
  }

  getStoryList(event) {
    if (event.target.value === '') {
      this.storyListData = [];
      return false;
    } else {
      const params = {
        story_group_id: event.target.value,
        skip: 0,
        take: 100
      };
      this.loader.showLoader();
      this.apiService.post('api/library/stories', params, {},
        this.authService.getLocalStorage('token'))
        .subscribe((response: any) => {
          // console.log('response', response);
          this.storyListData = response.stories;
          this.loader.hideLoader();
        }, error => {
          this.loader.hideLoader();
          this.serverErrorHandling(error);
          // console.log('error', error);
        });
    }
  }

  addChapter(groupData, flag = true, updateStory = true) {
    console.log('addChapter flags => ', groupData, flag, updateStory);
    if (flag) {
      this.chapters = [];
    }
    this.addChapterForm.patchValue({
      story_id: '',
      title: '',
      description: '',
      status: true,
    });
    this.files = [];
    this.selectedImage = null;
    this.activeKeyExplorer = true;
    this.showEditDiv = true;
    this.selectedChapterId = 0;
    if (updateStory) {
      console.log('groupData.stories => ', groupData.stories);
      this.selectedStoryId = 0;
      this.selectedStoryGroupId = groupData.id;
      this.storyData = groupData.stories;
    }
    // this.selectedStoryId = storyId;
  }

  filterStory(groupId) {
    console.log(groupId, this.storyGroupData);
  }

  changeStory(event) {
    if (event.target.value === '') {
      // console.log('changeStory if called => ', event.target.value);
      this.selectedStoryId = 0;
    } else {
      // this.selectedStoryId = event.target.value; //dont update this.selectedStoryId here
      // console.log('changeStory else called => ', event.target.value);
      this.editStory(event.target.value, [], false);
    }
  }

  deleteChapter() {
    if (this.deleteChapterId !== 0) {
      this.loader.showLoader();
      this.apiService.delete('api/chapters/' + this.deleteChapterId, {}, {}, this.authService.getLocalStorage('token'))
        .subscribe((response: any) => {
          const deleteStory = this.chapters.findIndex(x => x.id === this.deleteChapterId);
          this.chapters.splice(deleteStory, 1);
          this.showDeleteCapModal = false;
          this.loader.showPopup({type: 'success', message: response.message});
          this.deleteChapterId = 0;
          this.loader.hideLoader();
        }, error => {
          this.loader.hideLoader();
          this.serverErrorHandling(error);
          // console.log('error', error);
        });
    }
  }

  openImageModal() {
    // console.log('openImageModal called');
    this.showImageModal = true;
  }

  closeImageModal() {
    // console.log('closeImageModal called');
    this.showImageModal = false;
  }

  editChapter(chapterData) {
    this.showEditDiv = true;
    // this.selectedStoryGroupId = chapterData.id;
    this.selectedChapterId = chapterData.id;
    this.selectedStoryId = chapterData.story_id;
    this.addChapterForm.patchValue({
      story_id: chapterData.story_id,
      title: chapterData.title,
      description: chapterData.description,
      status: chapterData.status,
    });
    this.activeKeyExplorer = chapterData.key_explorer;
    this.selectedImage = this.replaceUrl(chapterData.chapter_image);
  }

  editSequence(cd) {
    this.common.setgenerateSequenceNavData({'storyId': cd.story_id, 'chapterId': cd.id});
    this.router.navigate(['generate-sequence/' + this.selectedStoryGroupId]);
  }

  replaceUrl(image) {
    return image.replace('undefined', 'https://beacon-development.com:8000');
  }

  editStory(storyId, data, updateStory = true) {
    console.log(storyId, data, updateStory);
    if (this.selectedStoryId === storyId) {
      // console.log('editStory if called', this.selectedStoryId, storyId);
      this.addChapter(data);
      return false;
    } else {
      // console.log('editStory else called');
      this.chapters = [];
      this.loader.showLoader();
      this.apiService.get('api/chapters/' + storyId, {}, {}, this.authService.getLocalStorage('token'))
        .subscribe((response: any) => {
          console.log('response  api/chapters/', response);
          this.chapters = response.chapters;
          // this.storyGroupData.push(response.story_groups);
          this.addChapter(data, false, updateStory);
          // this.selectedStoryGroupId = data.id;
          this.selectedStoryId = storyId;
          this.addChapterForm.patchValue({
            story_id: storyId,
          });
          // this.editDivData(data, story);
          // this.selectedStory = storyId;
          this.loader.hideLoader();
          // console.log('this.storyGroupData => ', this.storyGroupData);
        }, error => {
          this.loader.hideLoader();
          this.serverErrorHandling(error);
        });
    }
  }

  openSuccessfulModal() {
    console.log('openSuccessfulModal called');
    this.showSuccessfulModal = true;
  }

  closeSuccessfulModal() {
    console.log('closeSuccessfulModal called');
    this.showSuccessfulModal = false;
  }

  changeKeyExplorer() {
    this.activeKeyExplorer = !this.activeKeyExplorer;
    // console.log(this.activeKeyExplorer);
  }

  onclick() {
    this.visible = !this.visible;
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
    this.deleteChapterId = 0;
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

  serverErrorHandling(error) {
    // const errorData = error.error;
    if (error.status === 404) {
      this.router.navigate(['/page-not-found']);
    }
  }

  noDuplicate() {

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
