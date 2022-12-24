import {ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {FormArray, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {LoaderService} from '../service/loader.service';
import {ApiService} from '../service/api.service';
import {CommonService} from '../service/common.service';
import {DomSanitizer} from '@angular/platform-browser';
import {AuthService} from '../service/auth.service';
import {environment} from '../../environments/environment';
import {Location} from '@angular/common';

@Component({
  selector: 'app-generate-sequence',
  templateUrl: './generate-sequence.component.html',
  styleUrls: ['./generate-sequence.component.scss']
})
export class GenerateSequenceComponent implements OnInit {
  storyGroupId = 0;
  selectedStoryId = 0;
  selectedChapterId = 0;
  fileType = 1;
  storyData = [];
  selectedImage = null;
  selectedAudio = null;
  chapterData = [];
  chapterLength = '--:--';
  audioLength = 0;
  pageForm: FormGroup;
  audioFile = [];
  @ViewChild('fileUpload', {static: false}) fileUpload: ElementRef;
  duration = 0;
  @ViewChild('domAudio', {static: false}) audioOld: ElementRef;
  selectedAudioFile = null;
  fileView = null;
  sameAsPrevious = [];
  // public src: string = '';
  audioMute = false;
  public autoplay: boolean = false;
  public volume: number = 1.0; /* 1.0 is loudest */
  @ViewChild('audioElement', {static: false}) public _audioRef: ElementRef;
  private audio: HTMLMediaElement;
  config = environment.config;

  constructor(private router: Router,
              private route: ActivatedRoute,
              private formBuilder: FormBuilder,
              private loader: LoaderService,
              private apiService: ApiService,
              private cd: ChangeDetectorRef,
              private common: CommonService,
              private sanitize: DomSanitizer,
              private _location: Location,
              private authService: AuthService) {
    // console.log(this.route.snapshot.params.cid);
    this.storyGroupId = this.route.snapshot.params.cid;
    console.log('getgenerateSequenceNavData', this.common.getgenerateSequenceNavData());
    if (this.common.getgenerateSequenceNavData() !== null) {
      this.selectedStoryId = this.common.getgenerateSequenceNavData().storyId;
      this.selectedChapterId = this.common.getgenerateSequenceNavData().chapterId;
    } else {
      this.selectedStoryId = 0;
      this.selectedChapterId = 0;
      // this.selectedStoryId = 6;
      // this.selectedChapterId = 21;
    }

    this.getStory();
    this.pageForm = this.formBuilder.group({
      // test_field: ['', [Validators.required]],
      story_id: ['', [Validators.required]],
      chapter_id: ['', [Validators.required]],
      pages: this.formBuilder.array([]),
      // file: new FormControl('', [Validators.required]),
      // fileSource: new FormControl('', [Validators.required])
    });
  }

  public get paused(): boolean {
    if (this.audio) {
      return this.audio.paused;
    } else {
      return true;
    }
  }

  public pause(): void {
    if (this.audio) {
      this.audio.pause();
    }
  }

  public play(): void {
    if (this.audio) {
      if (this.audio.readyState >= 2) {
        this.audio.play();
      }
    }
  }

  public ngAfterAudioPlay() {
    // if (this.selectedAudioFile !== null) {
    this.pause();
    this.audio = this._audioRef.nativeElement;
    if (this.audio) {
      this.audio.volume = this.volume;
      this.audio.autoplay = this.autoplay;
    }
  }

  public mute(): void {
    if (this.audio.volume === 0.0) {
      this.audioMute = false;
      this.audio.volume = this.volume;
    } else {
      this.audioMute = true;
      this.audio.volume = 0.0;
    }
  }

  backward() {
    // console.log('backward => ', this.audio.currentTime);
    this.audio.currentTime = this.audio.currentTime - 5; //backword 5sec
  }

  forward() {
    // console.log('forward => ', this.audio.currentTime);
    this.audio.currentTime = this.audio.currentTime + 5; //forward 5sec
  }

  ngOnInit() {
    // this.pages().push(this.dataPage());
    // this.pages().push(this.dataPage());
  }

  getStory() {
    this.loader.showLoader();
    this.apiService.get('api/story-groups/' + this.storyGroupId + '/stories', {}, {}, this.authService.getLocalStorage('token'))
      .subscribe((response: any) => {
        console.log('response  api/story-groups', response);
        // this.storyGroupData.push(response.story_groups);
        this.storyData = response.stories;
        this.autoSetValue();
        this.cd.detectChanges();
        this.loader.hideLoader();
        // console.log('this.storyGroupData => ', this.storyGroupData);
      }, error => {
        this.loader.hideLoader();
        this.serverErrorHandling(error);
      });
  }

  autoSetValue() {
    // const storyId = this.storyData[0]['id'];
    const storyId = this.selectedStoryId;
    this.pageForm.patchValue({
      story_id: Number(storyId) === 0 ? '' : storyId
    });
    const findIndex = this.storyData.findIndex(x => x.id === Number(storyId));
    // console.log(this.storyData, findIndex);
    // this.selectedStoryId = storyId === '' ? 0 : storyId;
    this.selectedStoryId = storyId;
    if (this.storyData[findIndex]) {
      // console.log('chapters => ', this.storyData[findIndex]);
      this.chapterData = this.storyData[findIndex].chapters;
    } else {
      this.chapterData = [];
      this.chapterLength = '--:--';
      this.audioLength = 0;
    }

    // const chapterId = this.chapterData[2].id;
    const chapterId = this.selectedChapterId;
    this.pageForm.patchValue({
      chapter_id: Number(chapterId) === 0 ? '' : chapterId
    });

    // this.selectedChapterId = chapterId === '' ? 0 : chapterId;
    this.selectedChapterId = chapterId;
    const findIndex2 = this.chapterData.findIndex(x => x.id === Number(chapterId));
    if (this.chapterData[findIndex2]) {
      // console.log('chapters => ', this.chapterData[findIndex2]);
      this.chapterLength = this.secondsToTime(Number(this.chapterData[findIndex2].audio_length));
      this.audioLength = Number(this.chapterData[findIndex2].audio_length);
      // console.log(this.chapterLength, Number(this.chapterData[findIndex2].audio_length));
      this.selectedAudioFile = this.replaceUrl(this.chapterData[findIndex2].audio_file);
      this.ngAfterAudioPlay();
    } else {
      this.chapterLength = '--:--';
      this.audioLength = 0;
    }

    this.loader.showLoader();
    this.apiService.get('api/chapters/' + this.selectedChapterId + '/sequence', {}, {}, this.authService.getLocalStorage('token'))
      .subscribe((response: any) => {
        console.log('response  api/chapter seqence', response);
        // this.storyGroupData.push(response.story_groups);
        this.updateNewPage(response.sequence);
        this.cd.detectChanges();
        this.loader.hideLoader();
        // console.log('this.storyGroupData => ', this.storyGroupData);
      }, error => {
        this.loader.hideLoader();
        this.serverErrorHandling(error);
      });

    // this.addNewPage();
  }

  onChangeStory(event) {
    this.emptyPageData();
    const findIndex = this.storyData.findIndex(x => x.id === Number(event.target.value));
    // console.log(this.storyData, findIndex);
    this.selectedStoryId = event.target.value === '' ? 0 : event.target.value;
    if (this.storyData[findIndex]) {
      // console.log('chapters => ', this.storyData[findIndex]);
      this.chapterData = this.storyData[findIndex].chapters;
    } else {
      this.chapterData = [];
      this.chapterLength = '--:--';
      this.audioLength = 0;
      this.pageForm.patchValue({chapter_id: ''});
    }
  }

  emptyPageData() {
    this.sameAsPrevious = [];
    // @ts-ignore
    this.pageForm.controls['pages'].clear();
  }

  onChangeChapter(event) {
    this.emptyPageData();
    console.log(event.target.value);
    this.selectedChapterId = event.target.value === '' ? 0 : event.target.value;
    const findIndex = this.chapterData.findIndex(x => x.id === Number(event.target.value));
    console.log('chapters beforecheck => ', this.chapterData[findIndex]);
    if (this.chapterData[findIndex]) {
      console.log('chapters => ', this.chapterData[findIndex]);
      this.chapterLength = this.secondsToTime(Number(this.chapterData[findIndex].audio_length));
      this.audioLength = Number(this.chapterData[findIndex].audio_length);
      // console.log(this.chapterLength, Number(this.chapterData[findIndex].audio_length));
      this.selectedAudioFile = this.replaceUrl(this.chapterData[findIndex].audio_file);
      this.ngAfterAudioPlay();
    } else {
      this.selectedAudioFile = null;
      this.chapterLength = '--:--';
      this.audioLength = 0;
    }

    this.loader.showLoader();
    this.apiService.get('api/chapters/' + this.selectedChapterId + '/sequence', {}, {}, this.authService.getLocalStorage('token'))
      .subscribe((response: any) => {
        console.log('response  api/chapter seqence', response);
        // this.storyGroupData.push(response.story_groups);
        this.updateNewPage(response.sequence);
        this.cd.detectChanges();
        this.loader.hideLoader();
        // console.log('this.storyGroupData => ', this.storyGroupData);
      }, error => {
        this.loader.hideLoader();
        this.serverErrorHandling(error);
      });

  }

  pages(): FormArray {
    return this.pageForm.get('pages') as FormArray;
  }

  addNewPage() {
    if (this.audioLength > 0) {
      this.sameAsPrevious.push(this.sameAsPrevious.length + 1);
      // console.log(this.sameAsPrevious);
      this.pages().push(this.newPage());
    } else {
      this.loader.showPopup({type: 'error', message: 'Please upload audio file to add pages.'});
    }
  }

  newPage(): FormGroup {
    return this.formBuilder.group({
      page_id: '',
      page: this.sameAsPrevious.length,
      start_time: '',
      start_time_hh: ['', [Validators.required, Validators.pattern(environment.endTimeHH)]],
      start_time_mm: ['', [Validators.required, Validators.pattern(environment.endTimeMM)]],
      start_time_ss: ['', [Validators.required, Validators.pattern(environment.endTimeSS)]],
      end_time: '',
      file: '',
      file_source: '',
      file_type: '',
      file_view: null,
      embed_link: ['', [Validators.pattern(environment.httpsUrlRegex)]],
      img_same_as: '',
      description: '',
      desc_same_as: '',
      status: ['', [Validators.required]],
      file_deleted: false
    });
  }

  editPage(i) {
    console.log('editpage', i);
    let v = this.pageForm.value.pages[i];
    if (v) {
      console.log('pageId', v.page_id);
      if (v.page_id === '') {
        console.log('page id blank');
      } else {
        console.log('page id found');
        this.common.setgenerateSequenceNavData({pageData: v});
        this.router.navigate(['edit-sequence/' + v.page_id]);
      }
    } else {
      console.log('key not found');
    }
  }

  deletePage(i) {
    this.sameAsPrevious.pop();
    console.log('sameAsPrevious => ', this.sameAsPrevious);
    this.pages().removeAt(i);
  }

  removeFile(i) {
    const pagesArrays = this.pageForm.get('pages') as FormArray;
    pagesArrays.controls[i].patchValue({
      file_type: '',
      file: '',
      file_view: null,
      file_source: '',
      file_deleted: true
    });
    console.log('pagesArrays', pagesArrays);
  }

  onFileChange(event, i) {
    if (event.target.files.length > 0) {
      const file = event.target.files[0];
      /*to show file*/
      const reader = new FileReader();
      reader.readAsDataURL(file);
      let fileType = 1;
      if (file.type.indexOf('image') > -1) {
        fileType = 1;
      } else if (file.type.indexOf('video') > -1) {
        fileType = 2;
      }

      reader.onload = e => {
        const pagesArrays = this.pageForm.get('pages') as FormArray;
        pagesArrays.controls[i].patchValue({
          file_type: fileType,
          file_view: reader.result,
          file_source: file,
          file_deleted: false
        });
      };
      // reader.readAsDataURL(file);
    }
  }

  onPrevImageChange(event, i) {
    const e = event.target.value;
    console.log(e, i);
    if (e !== '') {
      const pagesArrays = this.pageForm.get('pages') as FormArray;
      pagesArrays.controls[i].patchValue({
        // file: pagesArrays.controls[Number(e - 1)].value.file,
        img_same_as: pagesArrays.controls[Number(e - 1)].value.page,
        file_type: pagesArrays.controls[Number(e - 1)].value.file_type,
        file_source: pagesArrays.controls[Number(e - 1)].value.file_source,
        file_view: pagesArrays.controls[Number(e - 1)].value.file_view,
        embed_link: pagesArrays.controls[Number(e - 1)].value.embed_link,
        file_deleted: false
      });
    } else {
      const pagesArrays = this.pageForm.get('pages') as FormArray;
      pagesArrays.controls[i].patchValue({
        // file: pagesArrays.controls[Number(e - 1)].value.file,
        img_same_as: null,
        file_type: '',
        file_source: '',
        file_view: null,
        embed_link: '',
        file_deleted: false
      });
    }
  }

  onPrevDescChange(event, i) {
    const e = event.target.value;
    // console.log(Number(e - 1), i);
    if (e !== '') {
      const pagesArrays = this.pageForm.get('pages') as FormArray;
      console.log('pagesArrays data => ', pagesArrays.controls[i].value.description, pagesArrays.controls[Number(e - 1)].value.page);
      pagesArrays.controls[i].patchValue({
        // desc_same_as: pagesArrays.controls[Number(e - 1)].value.page,
        description: pagesArrays.controls[Number(e - 1)].value.description,
      });
      console.log('pagesArrays', pagesArrays);
    }

  }

  validation() {
    if (this.pageForm.invalid) {
      const errorArray = [];
      // console.log('mail controls', this.pageForm.controls);
      Object.keys(this.pageForm.controls).forEach(key => {
        this.pageForm.get(key).markAsDirty();
        console.log('errors => ', this.pageForm.get(key));
        if (this.pageForm.get(key).errors !== null) {
          if (this.pageForm.get(key)) {
            errorArray.push({key, error: this.pageForm.get(key).errors});
          }
        }

        if (key === 'pages') {
          // const pa = this.pageForm.value.pages;
          // console.log('error pages => ', this.pageForm.get(key).controls);
          //for loop this.pageForm.get(key).controls
          // console.log('page controls => ', key, this.pageForm.get(key).controls[0]);
          // @ts-ignore
          const pagesControl = this.pageForm.get(key).controls;
          for (var j = 0; j < pagesControl.length; j++) {
            console.log('J => ', j, pagesControl[j].controls.embed_link.value, pagesControl[j].controls.file_source.value);
            if (pagesControl[j].controls.embed_link.value === '' && pagesControl[j].controls.file_source.value === '') {
              //errorArray.push({key: 'custom', error: 'custom', errorMessage: 'Image/video or embed link at page ' + j + ' is required'});
            }

            Object.keys(pagesControl[j].controls).forEach(k => {
              // console.log('error pages new => ', k, pagesControl[j].get(k));
              // console.log('errors => ', this.pageForm.get(key));
              pagesControl[j].get(k).markAsDirty();
              if (pagesControl[j].get(k).errors !== null) {
                if (pagesControl[j].get(k)) {
                  errorArray.push({key: k + ' at page ' + j + ' ', error: pagesControl[j].get(k).errors});
                }
              }
            });
          }

          /*Object.keys(this.pageForm.get(key).controls).forEach(k => {
            this.pageForm.get(key).get(k).markAsDirty();
            if (this.pageForm.get(key).get(k).errors !== null) {
              if (this.pageForm.get(key).get(k)) {
                errorArray.push({key, error: this.pageForm.get(key).get(k).errors});
              }
            }
          });*/
        }
      });
      // console.log(errorArray);
      if (errorArray.length > 0) {
        this.loader.showPopup({type: 'frontend_error_array', message: errorArray});
      }
      return;
    }
  }

  submitPagesForm() {
    this.loader.showLoader();
    console.log('form submit values', this.pageForm.value);
    // this.validation();

    // if (this.pageForm.invalid || this.pageForm.controls.pages.invalid) {
    const errorArray = [];
    // console.log('mail controls', this.pageForm.controls);
    Object.keys(this.pageForm.controls).forEach(key => {
      this.pageForm.get(key).markAsDirty();
      console.log('errors => ', this.pageForm.get(key));
      if (this.pageForm.get(key).errors !== null) {
        if (this.pageForm.get(key)) {
          errorArray.push({key, error: this.pageForm.get(key).errors});
        }
      }

      if (key === 'pages') {
        // const pa = this.pageForm.value.pages;
        // console.log('error pages => ', this.pageForm.get(key).controls);
        //for loop this.pageForm.get(key).controls
        // console.log('page controls => ', key, this.pageForm.get(key).controls[0]);
        // @ts-ignore
        const pagesControl = this.pageForm.get(key).controls;
        console.log('pagesControl', pagesControl);
        for (var j = 0; j < pagesControl.length; j++) {
          console.log('JJ => ', j, pagesControl[j].controls.embed_link.value, pagesControl[j].controls.file_source.value);
          console.log('JJJJ => ', j, pagesControl[j].controls.page_id.value, pagesControl[j].controls.file_deleted.value);
          if (pagesControl[j].controls.embed_link.value === '' && pagesControl[j].controls.file_source.value === '') {
            // console.log('J', j, pagesControl[j].controls.page_id.value, pagesControl[j].controls.file_deleted.value);
            if (pagesControl[j].controls.page_id.value !== '' && pagesControl[j].controls.file_deleted.value === true) {
              // errorArray.push({key: 'custom', error: 'custom', errorMessage: 'Image/video or embed link at page ' + j + ' is required'});
            } else if (pagesControl[j].controls.page_id.value === '') {
              // errorArray.push({key: 'custom', error: 'custom', errorMessage: 'Image/video or embed link at page ' + j + ' is required'});
            }
          }

          Object.keys(pagesControl[j].controls).forEach(k => {
            // console.log('error pages new => ', k, pagesControl[j].get(k));
            // console.log('errors => ', this.pageForm.get(key));
            pagesControl[j].get(k).markAsDirty();
            if (pagesControl[j].get(k).errors !== null) {
              if (pagesControl[j].get(k)) {
                errorArray.push({key: k + ' at page ' + j + ' ', error: pagesControl[j].get(k).errors});
              }
            }
          });
        }

        /*Object.keys(this.pageForm.get(key).controls).forEach(k => {
          this.pageForm.get(key).get(k).markAsDirty();
          if (this.pageForm.get(key).get(k).errors !== null) {
            if (this.pageForm.get(key).get(k)) {
              errorArray.push({key, error: this.pageForm.get(key).get(k).errors});
            }
          }
        });*/
      }
    });
    console.log(errorArray);
    if (errorArray.length > 0) {
      this.loader.hideLoader();
      this.loader.showPopup({type: 'frontend_error_array', message: errorArray});
    } else {
      const chapterId = this.pageForm.value.chapter_id;
      // this.loader.showLoader();
      const formData = new FormData();
      formData.append('story_id', this.pageForm.value.story_id);
      formData.append('chapter_id', chapterId);

      let pageForm = [];
      // let pageForm = this.pageForm.value.pages;
      for (var i = 0; i < this.pageForm.value.pages.length; i++) {
        const v = this.pageForm.value.pages[i];
        const vPrev = this.pageForm.value.pages[i - 1];
        const vNext = this.pageForm.value.pages[i + 1] ? this.pageForm.value.pages[i + 1] : 0;
        console.log(i, v, vPrev);
        // console.log('file_source => ', i, this.pageForm.value.pages[i].file_source);
        if (this.pageForm.value.pages[i].file_source !== '') {
          formData.append('files_' + (i + 1), this.pageForm.value.pages[i].file_source);
        }

        pageForm.push({
          page_id: v.page_id,
          page: i + 1,
          // start_time: i === 0 ? 0 : this.timeToSecondsArray(vPrev.start_time_hh, vPrev.start_time_mm, vPrev.start_time_ss),
          // end_time: this.timeToSecondsArray(v.start_time_hh, v.start_time_mm, v.start_time_ss),
          start_time: this.timeToSecondsArray(v.start_time_hh, v.start_time_mm, v.start_time_ss),
          end_time: vNext === 0 ? this.duration : this.timeToSecondsArray(vNext.start_time_hh, vNext.start_time_mm, vNext.start_time_ss),
          // file_source: v.file_source,
          file_type: v.file_type,
          embed_link: v.embed_link,
          img_same_as: v.img_same_as,
          description: v.description,
          desc_same_as: v.desc_same_as,
          status: Number(v.status),
          file_deleted: v.file_deleted
        });
      }
      console.log(pageForm);
      formData.append('pages_array', JSON.stringify(pageForm));

      this.apiService.post('api/chapters/' + chapterId + '/sequence', formData, {}, this.authService.getLocalStorage('token'))
        .subscribe((response: any) => {
          console.log('response', response);
          this.loader.showPopup({type: 'success', message: response.message});
          /*this.router.navigateByUrl('/page-not-found', {skipLocationChange: true}).then(() => {
            console.log('RELOAD CALLING');
            this.common.setgenerateSequenceNavData({'storyId': this.selectedStoryId, 'chapterId': this.selectedChapterId});
            this.router.navigate(['generate-sequence/' + this.storyGroupId]);
            this.cd.detectChanges();
          });*/
          this.pages().clear();
          this.autoSetValue();
          this.loader.hideLoader();
        }, error => {
          this.loader.hideLoader();
          this.serverErrorHandling(error);
          // console.log('error', error);
        });
    }
    // return;
    // }
  }


  /*FIle selection for chapter audio file*/
  audioFileSelection(event: any) {
    this.audioFile = [];
    const fileUpload = this.fileUpload.nativeElement;
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onload = e => this.selectedAudio = reader.result;
      reader.readAsDataURL(file);
      /*to find duration of the file*/
      const obUrl = URL.createObjectURL(file);
      this._audioRef.nativeElement.setAttribute('src', obUrl);
    }
    // tslint:disable-next-line:prefer-for-of
    for (let index = 0; index < fileUpload.files.length; index++) {
      const file = fileUpload.files[index];
      this.audioFile.push({data: file, inProgress: false, progress: 0});
    }
  }

  setDuration(loadEvent): void {
    this.duration = Math.round(loadEvent.currentTarget.duration);
    // console.log('duration => ', this.duration);
  }

  updateChapterAudio() {
    if (this.selectedChapterId === 0) {
      this.loader.showPopup({type: 'error', message: 'Please select chapter.'});
      return;
    } else if (this.audioFile.length === 0) {
      this.loader.showPopup({type: 'error', message: 'Please select audio file.'});
      return;
    }
    console.log('update audio file');
    this.loader.showLoader();
    const formData = new FormData();
    formData.append('has_audio', '1');
    formData.append('audio_file', this.audioFile[0].data);
    formData.append('audio_length', this.duration.toString());
    // console.log(this.audioFile[0].data);

    this.apiService.patch('api/chapters/' + this.selectedChapterId, formData, {}, this.authService.getLocalStorage('token'))
      .subscribe((response: any) => {
        this.getStory();
        this.fileUpload.nativeElement.value = '';
        this.audioFile = [];
        this.chapterLength = this.secondsToTime(Number(response.chapter.audio_length));
        this.audioLength = Number(response.chapter.audio_length);
        this.selectedAudioFile = this.replaceUrl(response.chapter.audio_file);
        this.ngAfterAudioPlay();
        this.loader.showPopup({type: 'success', message: response.message});
        this.cd.detectChanges();
        this.loader.hideLoader();
        console.log('chapterData => ', this.chapterData);
      }, error => {
        this.loader.hideLoader();
        this.serverErrorHandling(error);
        // console.log('error', error);
      });

  }

  close() {
    console.log('story id', this.selectedStoryId);
    if (this.selectedStoryId != 0) {
      this.common.setCloseGenSequenceNavData({'story_id': Number(this.selectedStoryId), 'story_group_id': Number(this.storyGroupId)});
    }
    this.router.navigate(['add-chapter']);
    // this._location.back();
  }

  serverErrorHandling(error) {
    // const errorData = error.error;
    if (error.status === 404) {
      this.router.navigate(['/page-not-found']);
    } else if (error.status === 422) {
      console.log(error.error.messsage);
      this.loader.showPopup({type: 'error422', message: error.error.message});
    }
  }

  secondsToTime(e) {
    const h = Math.floor(e / 3600).toString().padStart(2, '0');
    const m = Math.floor(e % 3600 / 60).toString().padStart(2, '0');
    const s = Math.floor(e % 60).toString().padStart(2, '0');

    return h + ':' + m + ':' + s;
    // return m + ':' + s;
  }

  secondsToTimeArray(e) {
    const h = Math.floor(e / 3600).toString().padStart(2, '0');
    const m = Math.floor(e % 3600 / 60).toString().padStart(2, '0');
    const s = Math.floor(e % 60).toString().padStart(2, '0');

    return [h, m, s];
    // return m + ':' + s;
  }

  timeToSecondsArray(h, m, s) {
    return (+h) * 60 * 60 + (m) * 60 + (+s);
  }

  replaceUrl(file) {
    return file;
    /*if (file.search('null') !== -1) {
      return null;
    }
    return file.replace('undefined', 'https://beacon-development.com:8000');*/
  }

  updateNewPage(data) {
    this.sameAsPrevious = [];
    for (var i = 0; i < data.length; i++) {
      this.sameAsPrevious.push(i + 1);
      const stt = this.secondsToTimeArray(data[i].start_time);
      this.pages().push(
        this.formBuilder.group({
          page_id: data[i].id,
          page: data[i].sequence,
          start_time: data[i].start_time,
          start_time_hh: stt[0],
          start_time_mm: stt[1],
          start_time_ss: stt[2],
          end_time: data[i].end_time,
          file_type: data[i].file_type,
          file: '',
          file_source: '',
          file_view: this.replaceUrl(data[i].file) !== '' ? this.replaceUrl(data[i].file) : null,
          embed_link: data[i].embed_link,
          img_same_as: data[i].img_same_as === null ? '' : data[i].img_same_as,
          description: data[i].description,
          desc_same_as: data[i].desc_same_as === null ? '' : data[i].desc_same_as,
          status: data[i].status === true ? '1' : '0',
          file_deleted: false
        })
      );
    }
  }
}
