import {ChangeDetectorRef, Component, Inject, OnInit, ViewChild, ElementRef, ViewChildren, QueryList} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {LoaderService} from '../service/loader.service';
import {ApiService} from '../service/api.service';
import {Subscription} from 'rxjs';
import {DOCUMENT} from '@angular/common';
import {AuthService} from '../service/auth.service';
import {environment} from '../../environments/environment';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  // activeParams: Subscription;
  // platform = '';
  // @ViewChildren('widgetsContent',{static:false}) widgetsContent: <ElementRef>;
  @ViewChildren('widgetsContent') widgetsContent: QueryList<ElementRef>;
  showChapterModal = false;
  activeData: Subscription;
  showCountViewModal = false;
  visible = false;
  storyGroupData = [];
  selectedStoryGroupId = 0;
  selectedStoryId = 0;
  selectedChapterId = 0;
  selectedImage = null;
  showImageModal = false;
  showEditDiv = false;
  chapters = [];
  showDetailsModal = {
    title: '',
    description: '',
    selectedImage: 'assets/img/story-one.png',
    keyExplorer: false,
    count: 0,
    audio_length: '00:00:00'
  };
  storyChapterId = 0;

  constructor(@Inject(DOCUMENT) private document: any,
              private router: Router,
              private loader: LoaderService,
              private apiService: ApiService,
              private activatedRoute: ActivatedRoute,
              private authService: AuthService,
              private cd: ChangeDetectorRef,
  ) {
    this.getStoryGroup();
  }

  scrollLeft(i) {
    this.widgetsContent.toArray()[i].nativeElement.scrollLeft -= environment.scrollLeft;
  }

  scrollRight(i) {
    this.widgetsContent.toArray()[i].nativeElement.scrollLeft += environment.scrollRight;
  }

  ngOnInit() {
    /*this.activeData = this.activatedRoute.data
      .subscribe((data: Data) => {
        this.document.body.scrollTop = 0;
        window.scrollTo(0, 0);
        console.log('all data', data);

        if (data['validate-token'].error) {
          if (data['validate-token'].error.status === 400) {
            /!*!//set to login*!/
            console.log('^^^^^^^^ SET TO LOGIN');
            this.authService.clearLocalStorage();
            this.authService.setIsLoggedIn(false);
          }
        } else if (data['validate-token']) {
          this.authService.setLocalStorage('userData', JSON.stringify(data['validate-token']));
          this.authService.setIsLoggedIn(true);
        }
      }, error => {
        console.log('^^^^^^^^^^ error data => ', error);
        // this.serverErrorHandling(error);
      });*/

    /*this.activeParams = this.activatedRoute.params
      .subscribe(
        (params: Params) => {
          // console.log(params.platform);
          this.platform = params.platform;
          // this.common.setPageUrl(params.url);
        });*/
  }

  onclick() {
    this.visible = !this.visible;
  }

  getStoryGroup() {
    // console.log('response', response);
    const params = {skip: 0, take: 44, take_stories: 44};
    this.loader.showLoader();
    this.apiService.post('api/library/story-groups', params, {}, this.authService.getLocalStorage('token'))
      .subscribe((response: any) => {
        this.storyGroupData = response.story_groups;
        if (this.storyGroupData[0].stories.length > 0) {
          this.viewStory(this.storyGroupData[0], this.storyGroupData[0].stories[0]);
        }
        this.cd.detectChanges();
        this.loader.hideLoader();
      }, error => {
        this.loader.hideLoader();
        this.serverErrorHandling(error);
      });
  }

  replaceUrl(image) {
    return image.replace('undefined', 'https://beacon-development.com:8000');
  }

  viewStory(data, story) {
    console.log('story => ', this.selectedStoryId, story);
    if (this.selectedStoryId === story.id) {
      this.selectedStoryId = 0;
      this.showDetailsModal = {
        title: story.title,
        description: story.description,
        selectedImage: this.replaceUrl(story.story_image),
        keyExplorer: story.key_explorer,
        count: story.storyViewerCount === null ? 0 : story.storyViewerCount,
        audio_length: '00:00:00'
      };
      return false;
    } else {
      this.chapters = [];
      this.loader.showLoader();
      const params = {
        skip: 0, take: 50, story_group_id: data.id, story_id: story.id
      };
      this.apiService.post('api/library/chapters', params, {}, this.authService.getLocalStorage('token'))
        .subscribe((response: any) => {
          console.log('response  api/chapters/', response);
          // this.storyGroupData.push(response.story_groups);
          this.selectedStoryGroupId = data.id;
          this.selectedStoryId = story.id;
          this.chapters = response.chapters;
          if (this.chapters.length > 0) {
            this.storyChapterId = this.chapters[0].id;
          } else {
            this.storyChapterId = 0;
          }

          this.showDetailsModal = {
            title: story.title,
            description: story.description,
            selectedImage: this.replaceUrl(story.story_image),
            keyExplorer: story.key_explorer,
            count: story.storyViewerCount === null ? 0 : story.storyViewerCount,
            audio_length: '00:00:00'
          };
          this.showEditDiv = true;
          // this.editDivData(data, story);
          // this.selectedStory = storyId;
          this.loader.hideLoader();
        }, error => {
          this.loader.hideLoader();
          this.serverErrorHandling(error);
        });
    }
  }

  viewChapter(cd) {
    this.selectedChapterId = cd.id;
    this.showDetailsModal = {
      title: cd.title,
      description: cd.description,
      selectedImage: this.replaceUrl(cd.chapter_image),
      keyExplorer: cd.key_explorer,
      count: cd.chapterViewerCount === null ? 0 : cd.chapterViewerCount,
      audio_length: '00:00:00'
    };
  }

  onGroupStoryChange(event) {
    this.selectedStoryGroupId = event.target.value;
    // this.selectedStoryId = 0;
    // this.showDetailsModal = {title: '', description: '', selectedImage: 'assets/img/story-one.png', keyExplorer: false, count: 0};
    this.chapters = [];
    const indexForGroup = this.storyGroupData.findIndex(x => x.id === Number(event.target.value));
    // console.log('indexForGroup => ', this.storyGroupData, event.target.value, indexForGroup, this.storyGroupData[indexForGroup]);
    console.log(indexForGroup, this.storyGroupData[indexForGroup], this.storyGroupData[indexForGroup].stories.length);
    if (this.storyGroupData[indexForGroup].stories.length > 0) {
      this.viewStory(this.storyGroupData[indexForGroup], this.storyGroupData[indexForGroup].stories[0]);
    } else {
      this.selectedStoryId = 0;
      this.selectedStoryGroupId = 0;
      this.showEditDiv = false;
    }
  }

  playStory() {
    const chapterId = this.selectedChapterId === 0 ? this.storyChapterId : this.selectedChapterId;
    console.log('chapterId => ', chapterId, this.selectedChapterId, this.storyChapterId);
    if (this.selectedChapterId === 0 && this.storyChapterId === 0) {
      this.loader.showPopup({type: 'error', message: 'Chapters not created.'});
    } else {
      this.loader.hidePopup();
      this.router.navigate(['view-story/' + chapterId]);
    }
  }

  openChapterModal() {
    console.log('openChapterModal called');
    this.showChapterModal = true;
  }

  closeChapterModal() {
    console.log('closeChapterModal called');
    this.showChapterModal = false;
  }

  openCountViewModal() {
    console.log('openCountViewModal called');
    this.showCountViewModal = true;
  }

  closeCountViewModal() {
    console.log('closeCountViewModal called');
    this.showCountViewModal = false;
  }

  serverErrorHandling(error) {
    // const errorData = error.error;
    if (error.status === 404) {
      this.router.navigate(['/page-not-found']);
    }
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
