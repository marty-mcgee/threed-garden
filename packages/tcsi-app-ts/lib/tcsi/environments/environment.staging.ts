export const environment = {
  production: false,
  url: 'https://beacon-development.com:8000',
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
