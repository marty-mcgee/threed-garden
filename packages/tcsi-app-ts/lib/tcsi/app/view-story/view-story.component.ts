import {ChangeDetectorRef, Component, ElementRef, Inject, OnInit, ViewChild} from '@angular/core';
import {DOCUMENT} from '@angular/common';
import {ActivatedRoute, Router} from '@angular/router';
import {LoaderService} from '../service/loader.service';
import {ApiService} from '../service/api.service';
import {AuthService} from '../service/auth.service';
import {DomSanitizer} from '@angular/platform-browser';

@Component({
  selector: 'app-view-story',
  templateUrl: './view-story.component.html',
  styleUrls: ['./view-story.component.scss']
})
export class ViewStoryComponent implements OnInit {
  chapterData = [{'story': {'title': ''}, 'title': '', 'audio_file': ''}];
  chapterId = 0;
  currentPageIndex = 0;
  sequenceArray = [];
  chapterList = [];
  selectedSequence = {
    sequence: 0,
    start_time: '00',
    end_time: '00',
    time_in: '00:00',
    time_out: '00:00',
    file: '',
    file_type: 1,
    description: '',
    embed_link: ''
  };
  comingSoon: boolean = false;
  hideVideo: boolean = false;
  currentSequence = 0;
  fontSize = 13;

  public selectedAudioFile: string = '';
  // public selectedAudioFile: string = 'http://localhost:8000/uploads/chapter_audio_files/undefined/1669212089591-fatteshikast_hechi_yel_deva_naka.mp3';
  public autoplay: boolean = false;
  public volume: number = 1.0; /* 1.0 is loudest */
  audioMute = false;
  @ViewChild('audioElement', {static: false}) public _audioRef: ElementRef;
  private audio: HTMLMediaElement;
  public videoVolume: number = 0.0; /* 1.0 is loudest */
  @ViewChild('videoElement', {static: false}) public _videoRef: ElementRef;
  private video: HTMLMediaElement;

  constructor(@Inject(DOCUMENT) private document: any,
              private route: ActivatedRoute,
              private router: Router,
              private loader: LoaderService,
              private apiService: ApiService,
              private activatedRoute: ActivatedRoute,
              private authService: AuthService,
              private domSanitizer: DomSanitizer,
              private cd: ChangeDetectorRef) {
    console.log('snapshot.params', this.route.snapshot.params);
    this.chapterId = this.route.snapshot.params.cid;
    if (this.chapterId === 0) {
      this.comingSoon = true;
    }
    this.getChapterDetails();
  }

  public get paused(): boolean {
    if (this.audio) {
      return this.audio.paused;
    } else {
      return true;
    }
  }

  public pause(): void {
    console.log('Pause');
    if (this.audio) {
      if (this.video) {
        this.video.pause();
      }

      this.audio.pause();
      // this.remorveListner();
    }
  }

  public play(): void {
    console.log('Play');
    if (this.audio) {
      if (this.audio.readyState >= 2) {
        if (this.video) {
          this.video.play();
        } /*else {
          //to initiate video first time
          if (this.selectedSequence.file_type === 2) {
            this.ngAfterVideoPlay();
            this.video.play();
          }
        }*/
        this.audio.play();
      }
    }
  }

  public mute(): void {
    console.log('mute', this.audio.volume);
    if (this.audio.volume === 0.0) {
      this.audioMute = false;
      this.audio.volume = this.volume;
    } else {
      this.audioMute = true;
      this.audio.volume = 0.0;
    }
    // }
  }

  public ngAfterAudioPlay() {
    this.audio = this._audioRef.nativeElement;
    if (this.audio) {
      this.audio.volume = this.volume;
      this.audio.autoplay = this.autoplay;
      this.getAudioRunningTime();
    }
  }

  public ngAfterVideoPlay(autoplay) {
    this.video = this._videoRef.nativeElement;
    // console.log('VIDEO PLAY');
    //check if video started
    if (this.video) {
      //check if audio started
      if (this.audio) {
        //setting volume for video
        this.video.volume = this.videoVolume;
        //if first sequence and audio started then not autoplaying video
        if (this.audio.paused) {
          this.video.pause();
        } else {
          this.video.play();
        }
      }
      // this.getvideoRunningTime();
    }
  }

  public ngAfterViewInit() {
    /*this.pause();
    this.audio = this._audioRef.nativeElement;
    if (this.audio) {
      this.audio.volume = this.volume;
      this.audio.autoplay = this.autoplay;
      this.getAudioRunningTime();
    }*/
  }

  ngOnInit() {
  }

  config = {
    uiColor: '#ffffff',
    toolbarGroups: [{name: 'clipboard', groups: ['clipboard', 'undo']},
      {name: 'editing', groups: ['find', 'selection', 'spellchecker']},
      {name: 'links'}, {name: 'insert'},
      {name: 'document', groups: ['mode', 'document', 'doctools']},
      {name: 'basicstyles', groups: ['basicstyles', 'cleanup']},
      {name: 'paragraph', groups: ['list', 'indent', 'blocks', 'align']},
      {name: 'styles'},
      {name: 'colors'}],
    //  skin: 'kama',
    //  resize_enabled: false,
    //  removePlugins: 'elementspath,save,magicline',
    extraPlugins: 'divarea,smiley,justify,indentblock,colordialog',
    colorButton_foreStyle: {
      element: 'font',
      attributes: {'color': '#(color)'}
    },
    //  height: 188,
    removeDialogTabs: 'image:advanced;link:advanced',
    removeButtons: 'Subscript,Superscript,Anchor,Source,Table',
    format_tags: 'p;h1;h2;h3;h4;h5;h6;pre;div'
  };

  getChapterDetails() {
    // const params = {skip: 0, take: 44, take_stories: 44};
    this.loader.showLoader();
    this.apiService.get('api/library/chapters/' + this.chapterId, {}, {}, this.authService.getLocalStorage('token'))
      .subscribe((response: any) => {
        this.chapterData = response.chapter;
        this.chapterList = response.chapter_list;
        this.sequenceArray = response.chapter.chapter_sequences;
        if (this.chapterData['audio_file'] === null || this.sequenceArray.length === 0) {
          this.comingSoon = true;
        } else {
          this.comingSoon = false;
          // console.log('chapterdata => ', this.chapterData);
          this.selectedAudioFile = this.chapterData['audio_file'];
          console.log('this.sequenceArray => ', this.sequenceArray);

          //load all files on page load
          this.sequenceArray.forEach((item, k) => {
            const preloadLink = document.createElement('link');
            preloadLink.href = item.file;
            preloadLink.rel = 'preload';
            preloadLink.as = 'image';
            document.head.appendChild(preloadLink);
          });

          this.ngAfterAudioPlay();
          this.setSequenceIndex();
        }
        this.cd.detectChanges();
        console.log('hide loaded');
        this.hideVideo = true;
        this.loader.hideLoader();
      }, error => {
        this.loader.hideLoader();
        this.serverErrorHandling(error);
      });
  }

  setSequenceIndex() {
    /*if (this.selectedSequence.file_type === 2) {
      if (this.selectedSequence.sequence === 1) {
        this.ngAfterVideoPlay(false);
      } else {
        this.ngAfterVideoPlay(true);
      }
    }*/
    this.selectedSequence = this.sequenceArray[this.currentPageIndex];
    const timeOut = this.secondsToTimeArray(this.selectedSequence.end_time);
    this.selectedSequence.time_out = timeOut[0] !== '00' ? timeOut[0] + ':' + timeOut[1] + ':' + timeOut[2] : timeOut[1] + ':' + timeOut[2];
  }

  calculateVideoTime(startTime, sequence) {
    if (this.video) {
      // if (this.currentSequence !== sequence) {
      this.video.currentTime = this.audio.currentTime - startTime;
      // }
      // console.log('calculateVideoTime', this.audio.currentTime, this.video.currentTime, this.audio.currentTime - startTime);
    }
  }

  getAudioRunningTime() {
    this.audio.addEventListener('timeupdate', () => {
      // console.log('currentTime=>', this.audio.currentTime);
      this.sequenceArray.forEach((item, k) => {
        // console.log('item => ', item, k);
        if (this.audio.currentTime >= item.start_time && this.audio.currentTime <= item.end_time) {
          // console.log('item', item, k, item.sequence);
          this.currentPageIndex = k;
          // console.log('getAudioRunningTime => ', this.currentPageIndex);
          this.setSequenceIndex();
          if (item.file_type === 2) {
            // this.currentSequence = item.sequence;
            this.calculateVideoTime(item.start_time, item.sequence);
            this.ngAfterVideoPlay(false);
          }

          // this.page = item;
        }
      });
    });
  }

  removeListner() {
    // console.log('remorveListner called');
    this.audio.removeEventListener('timeupdate', () => {
      // console.log('event listener removed => not working');
    });
  }

  changeChapter(e) {
    console.log('target.value', e.target.value);
    if (e.target.value !== '') {
      console.log('if');
      this.chapterId = e.target.value;
      this.router.navigate(['view-story/' + e.target.value]);
      this.getChapterDetails();
    } else {
      console.log('else');
      this.chapterId = 0;
    }
  }

  backward() {
    console.log('backward.currentPageIndex', this.currentPageIndex);
    if (this.currentPageIndex !== 0) {
      this.audio.currentTime = this.sequenceArray[this.currentPageIndex - 1].start_time;
    }
  }

  forward() {
    console.log('forward.currentPageIndex', this.currentPageIndex);
    this.currentPageIndex = this.currentPageIndex + 1;
    if (this.sequenceArray[this.currentPageIndex]) {
      this.audio.currentTime = this.sequenceArray[this.currentPageIndex].start_time;
    } else {
      this.currentPageIndex = this.currentPageIndex - 1;
    }
  }

  secondsToTimeArray(e) {
    const h = Math.floor(e / 3600).toString().padStart(2, '0');
    const m = Math.floor(e % 3600 / 60).toString().padStart(2, '0');
    const s = Math.floor(e % 60).toString().padStart(2, '0');

    return [h, m, s];
    // return m + ':' + s;
  }

  changeFontSize() {
    // console.log('fontSize', this.fontSize);
    // this.fontSize = this.fontSize + 1;
    if (this.fontSize <= 20) {
      this.fontSize = this.fontSize + 1;
    } else {
      this.fontSize = 13;
    }
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

  serverErrorHandling(error) {
    // const errorData = error.error;
    this.loader.hideLoader();
    if (error.status === 404) {
      // this.router.navigate(['/page-not-found']);
    }
  }

  embedLink(link) {
    return this.domSanitizer.bypassSecurityTrustUrl(link);
  }
}
