/**
 * Copyright (c) 2017-2018 (original work) Open Assessment Technologies SA ;
 */

define([
    'jquery',
    'lodash',
    'i18n',
    'core/logger',
    'ui/component',
    'json!taoTextHelp//runner/plugins/tools/textToSpeech/languages.json',
    'json!taoTextHelp//runner/plugins/tools/textToSpeech/crosswalk.json',
    'tpl!taoTextHelp/runner/plugins/tools/textToSpeech/textToSpeech',
    'css!taoTextHelp/runner/plugins/tools/textToSpeech/textToSpeech',
    'nouislider',
    'mathJax'
], function (
    $,
    _,
    __,
    loggerFactory,
    componentFactory,
    languagesMap,
    languagesCrosswalk,
    tpl
) {
    'use strict';

    var logger = loggerFactory('textHelp/textToSpeech');

    /**
     * Defaults config entries
     * @type {Object}
     * @private
     */
    var _defaults = {
        // URI of the config file that should contain the right setup for the customer
        setupUrl: '//configuration.speechstream.net/oat/taopremimum/v216/config.js',

        // Contextual ID for caching purposes
        bookId: null,
        pageId: null,

        // Max length for the cache identifiers.
        // Since the cache is segmented in a folders storage structure, the length matters.
        maxIdLength: 32,

        // Start with the click-to-speak feature activated
        enableClickToSpeak: false,

        // Display a setting for the TTS volume
        allowVolumeSetting: false,

        // Rely on TextHelp to detect the language based on the content.
        // If enabled it will prevent to explicitly change the language.
        allowTextHelpLangCheck: false,

        // Take care of the QTI language attribute. If disabled, it will also prevent allowTextHelpLangCheck
        allowQtiLangCheck: true,

        // Override the default language crosswalk set in `crosswalk.json`
        languagesCrosswalk: {
            // yy: 'xx-XX'
        },

        // Setup the default language for the platform
        forceLanguage: true,    // override TextHelp defined language
        voiceLanguage: 'en-US', // language code
        voiceGender: 'female',  // voice gender: 'female' or 'male'
        voiceIndex: 0,          // when several voices are available for the same gender (cf. languages.json)

        // Internal setup
        ignoreEls: ['header', '.left-bar', '.right-bar', '.modal', 'footer', '.action-bar', '.sts-scope', '.media-container']
    };

    /**
     * Mapping for TextHelp API
     * @type {Object}
     */
    var textHelpMapping = {
        properties: {
            texthelpSpeechStream: 'TexthelpSpeechStream',
            voiceName: 'eba_voice',
            language: 'eba_language',
            locale: 'eba_locale',
            bookId: 'eba_book_id',
            pageId: 'eba_page_id',
            voiceFromLangFlag: 'eba_voice_from_lang_flag'
        },
        functions: {
            barDynamicStart: '$rw_barDynamicStart',
            barInit: '$rw_barInit',
            disableSpeech: '$rw_disableSpeech',
            enableClickToSpeak: '$rw_enableClickToSpeak',
            enableContinuousReading: '$rw_enableContinuousReading',
            enableSpeech: '$rw_enableSpeech',
            event_pause: '$rw_event_pause',
            event_play: '$rw_event_play',
            setVoice: '$rw_setVoice',
            onloadCallback: 'eba_onload_callback',
            speechmodeCallback: 'eba_speechmode_callback',
            pageCompleteCallback: 'eba_page_complete_callback',
            speechCompleteCallback: '$rw_speechCompleteCallback',
            renderingSpeechCallback: '$rw_renderingSpeechCallback',
            setSentenceFromSelection: '$rw_setSentenceFromSelection',
            isPaused: '$rw_isPaused',
            isSpeaking: '$rw_isSpeaking',
            setSpeedValue: '$rw_setSpeedValue',
            setVolumeValue: '$rw_setVolumeValue',
            stopSpeech: '$rw_stopSpeech',
            setBookId: '$rw_setBookId',
            setPageId: '$rw_setPageId',
            tagSentences: '$rw_tagSentences',
            userParameters: '$rw_userParameters',
            setCurrentTarget: '$rw_setCurrentTarget'
        }
    };

    /**
     * Gets a TextHelp language definition
     * @param {String} languageCode
     * @param {String} voiceGender
     * @param {String|Number} voiceIndex
     * @returns {Object}
     */
    function getTHLang(languageCode, voiceGender, voiceIndex) {
        var voices;
        var langMap = languagesMap[languageCode];
        var lang = {
            voice: 'Ava',
            language: window['ENGLISH_US'],
            locale: 'US'
        };

        if (langMap) {
            lang.language = window[langMap.language] || lang.language;
            lang.locale = langMap.locale;
            voices = langMap.voices[voiceGender] || _.values(langMap.voices)[0];
            lang.voice = voices[Math.max(0, Math.min(parseInt(voiceIndex, 10) || 0, voices.length - 1))];
        }

        return lang;
    }

    /**
     * Gets the actual name of a TextHelp property
     * @param {String} name
     * @returns {String}
     */
    function getTHPropName(name) {
        return textHelpMapping.properties[name];
    }

    /**
     * Gets the actual name of a TextHelp function
     * @param {String} name
     * @returns {String}
     */
    function getTHFuncName(name) {
        return textHelpMapping.functions[name];
    }

    /**
     * Gets a TextHelp property
     * @param {String} name
     */
    function getTHProp(name) {
        name = getTHPropName(name);
        return name && window[name];
    }

    /**
     * Sets a TextHelp property
     * @param {String} name
     * @param {*} value
     */
    function setTHProp(name, value) {
        name = getTHPropName(name);
        if (name) {
            return window[name] = value;
        }
    }

    /**
     * Gets a TextHelp function
     * @param {String} name
     */
    function getTHFunc(name) {
        name = getTHFuncName(name);
        return name && window[name];
    }

    /**
     * Sets a TextHelp function
     * @param {String} name
     * @param {Function} fn
     */
    function setTHFunc(name, fn) {
        name = getTHFuncName(name);
        if (name && _.isFunction(fn)) {
            return window[name] = fn;
        }
    }

    /**
     * The factory
     * @param {areaBroker} areaBroker
     * @param {Object} [config]
     * @param {String} [config.setupUrl = '//configuration.speechstream.net/oat/taopremimum/v216/config.js'] - URI of the config file that should contain the right setup for the customer
     * @param {String} [config.bookId = null] - Identifier for caching purpose
     * @param {String} [config.pageId = null] - Identifier for caching purpose
     * @param {Number} [config.maxIdLength = 32] - Max length for the cache identifiers
     * @param {Boolean} [config.enableClickToSpeak = false] - Start with the click-to-speak feature activated
     * @param {Boolean} [config.allowVolumeSetting = false] - Display a setting for the TTS volume
     * @param {Boolean} [config.allowTextHelpLangCheck = false] - Rely on TextHelp to detect the language (lang attribute). If enabled it will prevent to explicitly change the language.
     * @param {Boolean} [config.allowQtiLangCheck = true] - Take care of the QTI language attribute. If disabled, it will also prevent allowTextHelpLangCheck.
     * @param {Object} [config.languagesCrosswalk] - Override the default language crosswalk set in `crosswalk.json`
     * @param {Boolean} [config.forceLanguage = true] - Override TextHelp defined language
     * @param {String} [config.voiceLanguage = 'en_US] - The voice language
     * @param {String} [config.voiceGender = 'female'] - The voice gender
     * @param {Number} [config.voiceIndex = 0] - The voice index
     * @param {Array} [config.ignoreEls = ['header', '.left-bar', '.right-bar', '.modal', 'footer', '.action-bar', '.sts-scope', '.media-container']]
     * @returns {ui/component}
     */
    return function factory(areaBroker, config) {
        var component, speed, volume, onCompleteDelayer;
        var languagesHistory = [];
        var crosswalk = _.clone(languagesCrosswalk);
        var api = {
            /**
             * Execute texthelp function
             * @param {String} action
             * @param {...} arguments
             */
            exec: function exec(action) {
                var fn = getTHFunc(action);
                if (_.isFunction(fn)) {
                    return fn.apply(this, [].slice.call(arguments, 1));
                }
            },

            /**
             * Ensure the identifier is well formatted to be accepted as a cache id by TextHelp.
             * @param {String} id
             * @returns {String}
             */
            formatId: function formatId(id) {
                // TextHelp cache may fail if the ID is too long, so we only keep the most significant part
                return encodeURIComponent(id)
                    .replace(/[%.]+/g, '')
                    .substr(-this.config.maxIdLength);
            },

            /**
             * Re-initialize texthelp
             */
            updateTexthelpCache: function updateTexthelpCache(deliveryId, itemId) {
                this.config.bookId = this.formatId(deliveryId);
                this.config.pageId = this.formatId(itemId);

                setTHProp('bookId', this.config.bookId);
                setTHProp('pageId', this.config.pageId);

                this.exec('setBookId', this.config.bookId);
                this.exec('setPageId', this.config.pageId);
                this.exec('tagSentences', areaBroker.getContentArea().selector);

                return this;
            },

            /**
             * Enable texthelp
             */
            enable: function enable() {
                this.exec('enableSpeech');
                return this;
            },

            /**
             * Disable texthelp
             */
            disable: function disable() {
                this.exec('disableSpeech');
                return this;
            },

            /**
             * Play
             */
            play: function play() {
                if (!this.exec('isSpeaking') || this.exec('isPaused')) {
                    this.exec('event_play');
                    this.trigger('play');
                }

                return this;
            },

            /**
             * Pause
             */
            pause: function pause() {
                this.exec('event_pause');
                this.trigger('pause');

                return this;
            },

            /**
             * Stop
             */
            stop: function stop() {
                this.exec('stopSpeech');
                this.trigger('stop');

                return this;
            },

            /**
             * Temporarily change the language
             * @param {String} [languageCode=en_US] - language code (like en_US)
             * @param {String} [voiceGender='female'] - gender of the voice (female or male)
             * @param {Number} [voiceIndex=0] - The index of the voice (when several are provided, cf. languages.json)
             */
            pushLanguage: function(languageCode, voiceGender, voiceIndex) {
                languagesHistory.push(_.pick(this.config, ['voiceLanguage', 'voiceGender', 'voiceIndex']));
                this.setLanguage(languageCode, voiceGender, voiceIndex);
                return this;
            },

            /**
             * Restore the language settings as it was before the last call to `pushLanguage()`
             */
            popLanguage: function() {
                var backup;
                if (languagesHistory.length) {
                    backup = languagesHistory.pop();
                    this.setLanguage(backup.voiceLanguage, backup.voiceGender, backup.voiceIndex);
                }
                return this;
            },

            /**
             * Gets a usable language code
             * @param {String} code
             * @returns {String}
             */
            getLanguageCode: function getLanguageCode(code) {
                code = ('' + code).replace(/_/g, '-');
                return crosswalk[code.toLocaleLowerCase()] || code;
            },

            /**
             * Tells if the language can be set explicitly
             * @returns {Boolean}
             */
            canSetLanguage: function canSetLanguage() {
                var allowTextHelpLangCheck = this.config.allowTextHelpLangCheck;
                return !allowTextHelpLangCheck || (allowTextHelpLangCheck && !this.config.allowQtiLangCheck);
            },

            /**
             * Change the language
             * @param {String} [languageCode=en_US] - language code (like en_US)
             * @param {String} [voiceGender='female'] - gender of the voice (female or male)
             * @param {Number} [voiceIndex=0] - The index of the voice (when several are provided, cf. languagesMap.json)
             */
            setLanguage: function(languageCode, voiceGender, voiceIndex) {
                var cfg = _.merge(this.config, _.defaults({
                    voiceLanguage: languageCode,
                    voiceGender: voiceGender,
                    voiceIndex: voiceIndex
                }, this.config));
                var lang = getTHLang(this.getLanguageCode(cfg.voiceLanguage), cfg.voiceGender, cfg.voiceIndex);

                setTHProp('voiceName', lang.voice);
                setTHProp('language', lang.language);
                setTHProp('locale', lang.locale);
                this.exec('setVoice', lang.voice);

                return this;
            },

            /**
             * Speech speed
             * @param {String} value
             * @returns {api}
             */
            setSpeed: function setSpeed(value) {
                speed = +value;

                this.exec('setSpeedValue', speed);
                this.trigger('setSpeed', speed);

                return this;
            },

            /**
             * Volume
             * @param {String} value
             * @returns {api}
             */
            setVolume: function setVolume(value) {
                volume = +value;

                this.exec('setVolumeValue', volume);
                this.trigger('setVolume', volume);

                return this;
            },

            /**
             * Click to pronounce
             */
            clickToSpeak: function clickToSpeak() {
                var self = this;
                var $contentArea = areaBroker.getContentArea();
                var $navigationArea = areaBroker.getNavigationArea();

                this.config.enableClickToSpeak = !this.config.enableClickToSpeak;

                this.exec('enableClickToSpeak', this.config.enableClickToSpeak);
                this.exec('enableContinuousReading', !this.config.enableClickToSpeak); // continuous reading is off when click to speak is on
                this.trigger('clickToSpeak');

                //adding each item a special class by presence of which normal click handling could be prevented and passed to click-to-speak handling
                $contentArea.find('.qti-item').each(function () {
                    $(this).toggleClass('prevent-click-handler');
                });

                //we should disable click-to-speak while navigating through test, if it was enabled on some item page
                //just to ensure that after other item load click-to-speak will function normally, and tao click handlers won't work on item-part click
                $navigationArea.off('click.tts').on('click.tts', 'a', function () {
                    if ($contentArea.find('.qti-item.prevent-click-handler').length > 0) {
                        self.clickToSpeak();
                    }
                });

                return this;
            }
        };

        /**
         * Eventify a texthelp method
         * @param {String} method
         * @param {String} [event]
         */
        function eventifyTHFunc(method, event) {
            var fn = getTHFunc(method);
            if (_.isFunction(fn)) {
                setTHFunc(method, function () {
                    var params = [event || method];
                    var args = params.slice.call(arguments);
                    component.trigger.apply(component, params.concat(args));
                    return fn.apply(this, args);
                });
            }
        }

        /**
         * Prevent the delayed action to run
         */
        function clearOnCompleteDelayer() {
            if (onCompleteDelayer) {
                clearTimeout(onCompleteDelayer);
                onCompleteDelayer = null;
            }
        }

        /**
         * Register a delayed action
         */
        function setOnCompleteDelayer(delayed) {
            clearOnCompleteDelayer();
            onCompleteDelayer = setTimeout(delayed, 200);
        }

        component = componentFactory(api, _defaults)
            .setTemplate(tpl)
            .on('init', function () {
                var self = this;
                var cfg = this.config;

                speed = 40; // default speed
                volume = 40; // default volume

                // override languages crosswalk
                _.merge(crosswalk, cfg.languagesCrosswalk);

                // we have to mark some blocks as ignored to prevent TTS accessing it
                $(this.config.ignoreEls.join(',')).attr('data-ignore', true);

                // load the remote config file to setup TextHelp
                require([cfg.setupUrl], function () {
                    var method = 'userParameters';
                    var fn = getTHFunc(method);
                    var tss = getTHProp('texthelpSpeechStream');

                    // callback that will be called once the engine is loaded
                    setTHFunc(method, function () {
                        var res;
                        if (_.isFunction(fn)) {
                            res = fn.apply(this, [].slice.call(arguments));
                        }
                        try {
                            setTHProp('voiceFromLangFlag', !self.canSetLanguage());
                            if (cfg.forceLanguage) {
                                self.setLanguage(cfg.voiceLanguage, cfg.voiceGender, cfg.voiceIndex);
                            }

                            setTHProp('bookId', self.formatId(cfg.bookId));
                            setTHProp('pageId', self.formatId(cfg.pageId));

                            // Set TextHelp callbacks
                            setTHFunc('pageCompleteCallback', function () {
                                self.trigger('stop');
                            });
                            setTHFunc('speechmodeCallback', function (speaking) {
                                self.trigger('speechmode', speaking);
                            });
                            setTHFunc('onloadCallback', function () {
                                self.trigger('load');
                            });

                            // Set some default TextHelp options
                            self.exec('enableClickToSpeak', self.config.enableClickToSpeak);
                            self.exec('setSpeedValue', speed);
                            self.exec('setVolumeValue', volume);

                            eventifyTHFunc('speechCompleteCallback', 'speechComplete');
                            eventifyTHFunc('renderingSpeechCallback', 'renderingSpeech');
                            eventifyTHFunc('setSentenceFromSelection', 'setSentence');

                        } catch(err) {
                            logger.error(err);
                        }
                        return res;
                    });

                    // Load and initialize the TextHelp engine
                    try {
                        tss.addToolbar(self.formatId(cfg.bookId), self.formatId(cfg.pageId));
                    } catch(err) {
                        logger.error(err);
                    }
                });
            })
            .init(config)
            .on('render', function () {
                var self = this;
                var $this = this.getElement();

                // prevents clicks from removing highlighted text
                $this.on('mousedown', function (e) {
                    e.preventDefault();
                    return false;
                });

                // Action clicks
                $this.find('.action').on('click', function (e) {
                    var $action = $(this);

                    // prevents disabled actions from being triggered
                    if ($action.hasClass('disabled')) {
                        e.stopImmediatePropagation();
                    }

                    // hides settings menu when another action clicked
                    if (!$action.closest('.settings').length) {
                        $this.find('.settings').removeClass('active');
                        $this.find('.settings > .settings-menu').hide();
                    }
                });

                // Show/hide settings menu
                $this.find('.settings').on('click', function () {
                    $(this).toggleClass('active');
                    $this.find('.settings-menu').toggle();
                });

                // Settings menu
                $this.find('.settings > .settings-menu')
                    .on('click', function (e) { // prevent child elements triggering a click on settings menu
                        e.stopPropagation();
                    })
                    .hide(); // Hide settings menu to begin

                // Hide/show volume and speed sliders
                $this.find('.settings > .settings-menu > .option')
                    .on('mouseenter', function () {
                        $(this).find('.slider-container').show();
                    })
                    .on('mouseleave', function () {
                        $(this).find('.slider-container').hide();
                    });

                // Hide slider to begin
                $this.find('.settings > .settings-menu > .option > .slider-container').hide();

                // Text to speech actions
                $this.find('.click-to-speak').on('click', function() {
                    self.clickToSpeak();
                });
                $this.find('.play').on('click', function() {
                    self.play();
                });
                $this.find('.pause').on('click', function() {
                    self.pause();
                }).hide();
                $this.find('.stop').on('click', function() {
                    self.stop();
                });

                // Settings menu's volume slider action
                if (self.config.allowVolumeSetting) {
                    $this.find('.settings > .settings-menu > .volume .slider')
                        .noUiSlider({
                            animate: true,
                            connected: true,
                            range: {
                                min: 0,
                                max: 100
                            },
                            start: volume,
                            step: 10
                        })
                        .on('change', function (e, value) {
                            self.setVolume(value);
                        });
                }

                // Settings menu's speed slider
                $this.find('.settings > .settings-menu > .speed .slider')
                    .noUiSlider({
                        animate: true,
                        connected: true,
                        range: {
                            min: 25, //textHelp guys requested us to choose only three speeds for caching purposes, so 25/40/55 (Slow/Normal/Fast) were selected
                            max: 55
                        },
                        start: speed,
                        step: 15 //actual step for speed slider, so the values will be 0,15,30,etc,etc,100.
                    })
                    .on('change', function (e, value) {
                        self.setSpeed(value);
                    });
            })
            .on('clickToSpeak', function () {
                var $el = this.getElement();
                var $contentArea = areaBroker.getContentArea();

                if (this.config.enableClickToSpeak) {
                    $el.find('.click-to-speak').addClass('active');
                    $el.find('.play').addClass('disabled').show();
                    $el.find('.pause').addClass('disabled').hide();
                    $contentArea.css('cursor', 'pointer');
                } else {
                    $el.find('.click-to-speak').removeClass('active');
                    $el.find('.play').removeClass('disabled').show();
                    $el.find('.pause').removeClass('disabled').hide();
                    $contentArea.css('cursor', 'default');
                }
            })
            .on('play', function () {
                var $el = this.getElement();

                $el.find('.play').hide();
                $el.find('.pause').show();
            })
            .on('pause', function () {
                var $el = this.getElement();

                $el.find('.play').show();
                $el.find('.pause').hide();
            })
            .on('stop', function () {
                var $el = this.getElement();

                $el.find('.play').show();
                $el.find('.pause').hide();
            })
            .on('setSentence renderingSpeech', function () {
                clearOnCompleteDelayer();
                this.trigger('play');
            })
            .on('speechComplete', function (source) {
                var self = this;
                if (source === 'Complete') {
                    // since the speechComplete event may occur each time a sentence is finished to be spoken
                    // we need to apply a delay to differentiate actual end from pause between sentences.
                    setOnCompleteDelayer(function () {
                        self.trigger('stop');
                    });
                }
            });

        return component;
    };
});
