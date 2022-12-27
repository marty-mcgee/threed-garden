// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  // url: 'http://localhost:8000',
  url: 'https://beacon-development.com:8000',
  // url: 'http://localhost:4200', // [MM] default ng localhost port 4200

  nameRegex: '^[a-zA-Z\\\\s]*$',
  emailRegex: '^\\w+([\\.-]?\\w+)*@\\w+([\\.-]?\\w+)*(\\.\\w{2,3})+$',
  mobileRegex: '^[0-9]{10}$',
  otpRegex: '^[0-9]{4}$',
  // passwordRegex: '^[0-9]{8}$',
  passwordRegex: '^(?=.*?[A-Za-z]).{8,20}$',
  endTimeHH: '^[0-5]{1}[0-9]{1}$',
  endTimeMM: '^[0-5]{1}[0-9]{1}$',
  endTimeSS: '^[0-5]{1}[0-9]{1}$',
  httpsUrlRegex: 'https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)',
  scrollLeft: 180,
  scrollRight: 180,
  config: {
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
  }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
