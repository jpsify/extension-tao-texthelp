module.exports = function(grunt) {
    'use strict';

    var sass    = grunt.config('sass') || {};
    var watch   = grunt.config('watch') || {};
    var notify  = grunt.config('notify') || {};
    var root    = grunt.option('root') + '/taoTextHelp/views/';

    sass.taotexthelp = {};
    sass.taotexthelp.files = {};
    sass.taotexthelp.files[root + 'js/runner/plugins/tools/textToSpeech/textToSpeech.css'] = root + 'js/runner/plugins/tools/textToSpeech/textToSpeech.scss';

    watch.taotexthelpsass = {
        files: [root + 'js/runner/plugins/tools/textToSpeech/textToSpeech.scss'],
        tasks: ['sass:taotexthelp', 'notify:taotexthelpsass'],
        options: {
            debounceDelay: 1000
        }
    };

    notify.taotexthelpsass = {
        options: {
            title: 'Grunt SASS',
            message: 'SASS files compiled to CSS'
        }
    };

    grunt.config('sass', sass);
    grunt.config('watch', watch);
    grunt.config('notify', notify);

    //register an alias for main build
    grunt.registerTask('taotexthelpsass', ['sass:taotexthelp']);
};
