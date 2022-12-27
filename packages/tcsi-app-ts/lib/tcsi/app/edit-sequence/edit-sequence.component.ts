import {ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {FormArray, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {LoaderService} from '../service/loader.service';
import {ApiService} from '../service/api.service';
import {CommonService} from '../service/common.service';
import {DomSanitizer} from '@angular/platform-browser';
import {Location} from '@angular/common';
import {AuthService} from '../service/auth.service';
import {environment} from '../../environments/environment';

@Component({
  selector: 'app-edit-sequence',
  templateUrl: './edit-sequence.component.html',
  styleUrls: ['./edit-sequence.component.scss']
})
export class EditSequenceComponent implements OnInit {
  pageId = 0;
  pageForm: FormGroup;

  //params for audio
  chapterLength = '--:--';
  audioLength = 0;
  audioMute = false;
  @ViewChild('audioElement', {static: false}) public _audioRef: ElementRef;
  public autoplay: boolean = false;
  public volume: number = 1.0; /* 1.0 is loudest */
  selectedAudioFile = null;
  duration = 0;
  pageData = [{
    'chapter': {
      'audio_file': '', 'id': '', 'title': '',
      'story': {'id': '', 'title': ''}
    },
    'start_time': '',
    'chapter_id': '',
    'description': ''
  }];
  previousSequences = [];
  selectedFileType = 0;
  selectedFile = null;
  private audio: HTMLMediaElement;
  config = environment.config;

  // pageData = [];

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
    this.pageId = this.route.snapshot.params.pid;
    console.log('pageId', this.pageId);

    this.pageForm = this.formBuilder.group({
      // page_id: [''],
      file: [''],
      embed_link: [''],
      description: ['', [Validators.required]],
      // time_in: ['', [Validators.required]],
      start_time_hh: ['', [Validators.required, Validators.pattern(environment.endTimeHH)]],
      start_time_mm: ['', [Validators.required, Validators.pattern(environment.endTimeMM)]],
      start_time_ss: ['', [Validators.required, Validators.pattern(environment.endTimeSS)]],
      img_same_as: null,
      desc_same_as: null,
      file_type: null,
      file_view: null,
      file_source: null,
      file_deleted: null,
    });
    this.getPageDetails();
  }

  ngOnInit() {
  }

  public get paused(): boolean {
    if (this.audio) {
      return this.audio.paused;
    } else {
      return true;
    }
  }

  getPageDetails() {
    this.loader.showLoader();
    this.apiService.get('api/chapters/sequence/' + this.pageId, {}, {}, this.authService.getLocalStorage('token'))
      .subscribe((response: any) => {
        console.log('response  api/story-groups', response);
        // this.storyGroupData.push(response.story_groups);
        this.pageData = response.chapter_sequence;
        this.previousSequences = response.previous_sequences;
        const stt = this.secondsToTimeArray(this.pageData['start_time']);
        this.pageForm.patchValue({
          img_same_as: this.pageData['img_same_as'] === null ? '' : this.pageData['img_same_as'],
          desc_same_as: this.pageData['desc_same_as'] === null ? '' : this.pageData['desc_same_as'],
          description: this.pageData['description'],
          start_time_hh: stt[0],
          start_time_mm: stt[1],
          start_time_ss: stt[2],
        });

        this.selectedAudioFile = this.pageData['chapter'].audio_file;
        this.ngAfterAudioPlay();
        this.selectedFileType = this.pageData['file_type'];
        this.selectedFile = this.pageData['file'];
        this.cd.detectChanges();
        this.loader.hideLoader();
        // console.log('this.storyGroupData => ', this.storyGroupData);
      }, error => {
        this.loader.hideLoader();
        this.serverErrorHandling(error);
      });
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

  setDuration(loadEvent): void {
    this.duration = Math.round(loadEvent.currentTarget.duration);
    // console.log('duration => ', this.duration);
  }

  backward() {
    // console.log('backward => ', this.audio.currentTime);
    this.audio.currentTime = this.audio.currentTime - 5; //backword 5sec
  }

  forward() {
    // console.log('forward => ', this.audio.currentTime);
    this.audio.currentTime = this.audio.currentTime + 5; //forward 5sec
  }

  onFileChange(event) {
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
        let fileView = reader.result;
        this.pageForm.patchValue({
          file_type: fileType,
          file_view: fileView,
          file_source: file,
          file_deleted: false
        });
        this.selectedFile = fileView;
        this.selectedFileType = fileType;
      };
    }
  }

  onPrevImageChange(event) {
    const e = event.target.value;
    console.log(e);
    if (e !== '') {
      const ci = this.previousSequences.findIndex(x => x.sequence == e);
      console.log('currentIndex => ', ci, this.previousSequences[ci]);

      this.selectedFileType = this.previousSequences[ci].file_type;
      this.selectedFile = this.previousSequences[ci].file;
      if (this.previousSequences[ci]) {
        this.pageForm.patchValue({
          // file: pagesArrays.controls[Number(e - 1)].value.file,
          // img_same_as: e,
          file_type: this.previousSequences[ci].file_type,
          file_source: null,
          file_view: this.previousSequences[ci].file,
          embed_link: this.previousSequences[ci].embed_link,
          file_deleted: false
        });
      }

    } else {
      this.pageForm.patchValue({
        // file: pagesArrays.controls[Number(e - 1)].value.file,
        // img_same_as: null,
        file_type: '',
        file_source: null,
        file_view: null,
        embed_link: '',
        file_deleted: false
      });
      this.selectedFileType = this.pageData['file_type'];
      this.selectedFile = this.pageData['file'];
    }
  }

  onPrevDescChange(event) {
    const e = event.target.value;
    // console.log(Number(e - 1), i);
    if (e !== '') {
      const ci = this.previousSequences.findIndex(x => x.sequence == e);
      // console.log('currentIndex => ', e, ci, this.previousSequences[ci]);
      if (this.previousSequences[ci]) {
        this.pageForm.patchValue({
          // desc_same_as: e,
          description: this.previousSequences[ci].description,
        });
      }
    } else {
      this.pageForm.patchValue({
        description: this.pageData['description'],
      });
    }
  }

  submitPage() {
    this.loader.showLoader();
    console.log('form submit values', this.pageForm.value);
    if (this.pageForm.invalid) {
      const errorArray = [];
      Object.keys(this.pageForm.controls).forEach(key => {
        this.pageForm.get(key).markAsDirty();
        if (this.pageForm.get(key).errors !== null) {
          if (this.pageForm.get(key)) {
            errorArray.push({key, error: this.pageForm.get(key).errors});
          }
        }
      });
      if (errorArray.length > 0) {
        this.loader.hideLoader();
        this.loader.showPopup({type: 'frontend_error_array', message: errorArray});
      }
      return;
    }

    const startTime = this.timeToSecondsArray(Number(this.pageForm.value.start_time_hh), Number(this.pageForm.value.start_time_mm), Number(this.pageForm.value.start_time_ss));
    const formData = new FormData();
    // formData.append('id', this.pageId.toString());
    formData.append('description', this.pageForm.value.description);
    formData.append('start_time', startTime.toString());
    formData.append('sequence', this.pageData['sequence']);
    formData.append('end_time', this.pageData['end_time']);
    formData.append('img_same_as', this.pageForm.value.img_same_as);
    formData.append('embed_link', this.pageForm.value.embed_link);
    formData.append('desc_same_as', this.pageForm.value.desc_same_as);
    formData.append('file_type', this.pageForm.value.file_type);
    if (this.pageForm.value.file_source !== null) {
      formData.append('file', this.pageForm.value.file_source);
    }

    this.apiService.patch('api/chapters/sequence/' + this.pageId, formData, {}, this.authService.getLocalStorage('token'))
      .subscribe((response: any) => {
        console.log('response', response);
        this.loader.showPopup({type: 'success', message: response.message});
        /*this.router.navigateByUrl('/page-not-found', {skipLocationChange: true}).then(() => {
          console.log('RELOAD CALLING');
          this.common.setgenerateSequenceNavData({'storyId': this.selectedStoryId, 'chapterId': this.selectedChapterId});
          this.router.navigate(['generate-sequence/' + this.storyGroupId]);
          this.cd.detectChanges();
        });*/
        this.getPageDetails();
        this.loader.hideLoader();
      }, error => {
        this.loader.hideLoader();
        this.serverErrorHandling(error);
        // console.log('error', error);
      });
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

  addNewPage() {

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

  close() {
    this.common.setgenerateSequenceNavData({'storyId': this.pageData['chapter'].story.id, 'chapterId': this.pageData['chapter'].id});
    // this.router.navigate(['generate-sequence/' + this.pageData['chapter'].story.story_group_id]);
    this.router.navigate(['generate-sequence/' + this.pageData['chapter'].story.story_group_master.id]);
    // this._location.back();
  }

}
