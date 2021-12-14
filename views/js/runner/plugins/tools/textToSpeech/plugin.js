/**
 * Copyright (c) 2017-2018 (original work) Open Assessment Technologies SA ;
 */

define([
    'jquery',
    'lodash',
    'i18n',
    'ui/hider',
    'ui/stacker',
    'taoTests/runner/plugin',
    'taoQtiTest/runner/helpers/map',
    'taoTextHelp/runner/plugins/tools/textToSpeech/textToSpeech'
], function (
    $,
    _,
    __,
    hider,
    stackerFactory,
    pluginFactory,
    mapHelper,
    ttsFactory
) {
    'use strict';

    /**
     * Prefix of category that contain a language code
     * @type {string}
     */
    var langPrefix = 'x-tao-lang-';

    /**
     * Selectors for math expression that should be overridden with ARIA label
     * @type {string[]}
     */
    var mathAriaEls = [
        '[data-qti-class="math"]',
        '.math-renderer'
    ];

    /**
     * Selectors for math controls that should be wrapped into a pronunciation tag
     * @type {string[]}
     */
    var mathWrapEls = [
        '.math-entry'
    ];

    /**
     * Returns the configured plugin
     * @returns {Object}
     */
    return pluginFactory({

        /**
         * Plugin name
         * @type {String}
         */
        name: 'textToSpeech',

        /**
         * Initialize plugin
         */
        init: function init() {
            var self = this;
            var testRunner = this.getTestRunner();

            this.ttsButton = this.getAreaBroker().getToolbox().createEntry({
                control: 'tts',
                icon: 'headphones',
                text: __('Text to Speech'),
                title: __('Text to Speech')
            })
                .on('render', function () {
                    var stacker = stackerFactory('test-runner');

                    self.tts = ttsFactory(testRunner.getAreaBroker(), self.getConfig())
                        .render(self.ttsButton.getElement())
                        .disable() // disable & hide by default
                        .hide();

                    stacker.autoBringToFront(self.tts.getElement());
                })
                .on('click', function (e) {
                    var ttsEl = self.tts.getElement();

                    // prevent action if the click is made inside the tts controls which is a sub part of the button
                    if ($(e.target).closest(ttsEl).length) {
                        return;
                    }

                    hider.toggle(ttsEl);

                    if (ttsEl.hasClass('hidden')) {
                        self.tts.disable();
                    } else {
                        self.tts.enable();
                    }
                })
                .disable() // disable & hide by default
                .hide();

            testRunner
                .on('loaditem', function () {
                    self.disable();
                    self.ttsButton.hide();
                    self.ttsButton.$component.find('.settings').removeClass('active');
                    self.ttsButton.$component.find('.settings > .settings-menu').hide();
                })
                .on('enabletools', function () {
                    self.enable();
                })
                .on('renderitem', function () {
                    var context = testRunner.getTestContext();
                    var testMap = testRunner.getTestMap();
                    var config = testRunner.getConfig();
                    var item = mapHelper.getItem(testMap, context.itemIdentifier);
                    var ttsConfig = self.getConfig() || {};
                    var $contentArea = testRunner.getAreaBroker().getContentArea();
                    var $qti, languageCode, deliveryId, itemId;

                    if (context.options.textToSpeech) {
                        self.enable();
                        self.ttsButton.show();

                        // ensure alt attributes are well loaded by TextHelp on each image
                        // (TextHelp does not directly read the alt attribute, but cache it in a data-msg attribute)
                        $contentArea.find('img').each(function () {
                            var msg = this.getAttribute('data-msg');
                            if (!msg && this.hasAttribute('alt')) {
                                this.setAttribute('data-msg', this.getAttribute('alt'));
                            }
                        });

                        if (ttsConfig.overrideMathExpr && _.isString(ttsConfig.overrideMathExpr)) {
                            // override math expressions with a predefined text using ARIA label
                            $contentArea.find(mathAriaEls.join(',')).each(function () {
                                this.setAttribute('role', 'math');
                                this.setAttribute('aria-label', ttsConfig.overrideMathExpr);
                            });
                            // wrap complex math controls inside a tag that provides replacement text
                            $contentArea.find(mathWrapEls.join(',')).wrap($('<span />').attr('data-pron', ttsConfig.overrideMathExpr));
                        }

                        // map the language code to fit TextHelp
                        if (self.tts.config.allowQtiLangCheck) {
                            $qti = $contentArea.find('.qti-item');
                            languageCode = $qti.attr('lang');
                            if (!languageCode) {
                                languageCode = $qti.attr('xml:lang');
                                if (languageCode) {
                                    $qti.attr('xml:lang', self.tts.getLanguageCode(languageCode));
                                }
                            } else {
                                $qti.attr('lang', self.tts.getLanguageCode(languageCode));
                            }
                        }

                        // Change the language according to the item content
                        // Note: this only works if TextHelp does not automatically handle the lang attribute
                        // i.e. with allowTextHelpLangCheck option set to false
                        if (self.tts.canSetLanguage()) {
                            _.forEach(item.categories, function(category) {
                                if (category.substr(0, langPrefix.length) === langPrefix) {
                                    languageCode = category.substr(langPrefix.length);
                                    return false;
                                }
                            });

                            if (languageCode) {
                                self.tts.pushLanguage(languageCode);
                            }
                        }

                        //If we are in multi-tenant context then we choose tenantName as bookId for caching
                        //in other cases - testDefinition will be used as bookId for caching on textHelp side
                        if (ttsConfig.tenantName) {
                            deliveryId = ttsConfig.tenantName;
                            itemId = this.itemRunner._item.attributes.identifier;
                        } else {
                            deliveryId = config.testDefinition;
                            itemId = context.itemIdentifier;
                        }
                        self.tts.updateTexthelpCache(deliveryId, itemId);
                    }
                })
                .on('unloaditem', function () {
                    if (typeof self.tts !== "undefined") {
                        self.tts.popLanguage();
                    }
                })
                .on('disabletools unloaditem', function () {
                    var context = testRunner.getTestContext();
                    if (context.options && context.options.textToSpeech && typeof self.tts !== "undefined") {
                        //textHelp requested stopping of running playback on item unload
                        self.tts.stop();
                        self.tts.exec('setCurrentTarget', null);
                    }

                    self.disable();
                });
        },

        /**
         * Enable plugin
         */
        enable: function enable() {
            if (this.tts) {
                this.tts.enable();
            }

            if (this.ttsButton) {
                this.ttsButton.enable();
            }
        },

        /**
         * Disable plugin
         */
        disable: function disable() {
            if (this.tts) {
                this.tts.disable();
            }

            if (this.ttsButton) {
                this.ttsButton.disable();
            }
        }
    });
});
