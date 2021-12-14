<?php
/**
 * Copyright (c) 2018 (original work) Open Assessment Technologies SA ;
 */

namespace oat\taoTextHelp\scripts\install;

use common_report_Report as Report;
use oat\oatbox\extension\InstallAction;
use oat\taoTests\models\runner\plugins\PluginRegistry;
use oat\taoTests\models\runner\plugins\TestPlugin;

/**
 * Class RegisterTestRunnerPlugins
 * Install action that registers the test runner plugins
 * @package oat\taoTextHelp\scripts\install
 */
class RegisterTestRunnerPlugins extends InstallAction
{

    protected $plugins = [
        'tools' => [
            [
                'id' => 'textToSpeech',
                'name' => 'Text to Speech',
                'module' => 'taoTextHelp/runner/plugins/tools/textToSpeech/plugin',
                'bundle' => 'taoTextHelp/loader/testPlugins.min',
                'description' => 'Enables text-to-speech via Texthelp',
                'category' => 'tools',
                'active' => true,
                'tags' => []
            ]
        ]
    ];

    protected $configs = [
        'textToSpeech' => [
            'id' => 'textToSpeech',
            'config' => [
                // URI of the config file that should contain the right setup for the customer
                'setupUrl' => '//configuration.speechstream.net/oat/taopremimum/v216/config.js',

                // Override math expressions with an alternative text
                'overrideMathExpr' => false,

                // Override the default language crosswalk set in `crosswalk.json`
                'languagesCrosswalk' => [
                    // "yy" => "xx-XX"
                ],

                // Display a setting for the TTS volume
                'allowVolumeSetting' => false,

                // Rely on TextHelp to detect the language based on the content.
                // If enabled it will prevent to explicitly change the language.
                'allowTextHelpLangCheck' => false,

                // Take care of the QTI language attribute. If disabled, it will also prevent allowTextHelpLangCheck
                'allowQtiLangCheck' => true,

                // Setup the default language for the platform
                'forceLanguage' => true,    // override TextHelp defined language
                'voiceLanguage' => 'en-US', // language code
                'voiceGender' => 'female',  // voice gender: 'female' or 'male'
                'voiceIndex' => 0           // when several voices are available for the same gender (cf. languages.json)
            ],
            'shortcuts' => []
        ]
    ];

    /**
     * @return Report
     * @throws \common_exception_InconsistentData
     */
    protected function registerPlugins()
    {
        $registry = PluginRegistry::getRegistry();
        $count = 0;

        foreach ($this->plugins as $categoryPlugins) {
            foreach ($categoryPlugins as $pluginData) {
                if ($registry->register(TestPlugin::fromArray($pluginData))) {
                    $count++;
                }
            }
        }

        return new Report(Report::TYPE_SUCCESS, $count . ' plugins registered.');
    }

    /**
     * @return Report
     */
    protected function configurePlugins()
    {
        $extension = $this->getServiceLocator()->get(\common_ext_ExtensionsManager::SERVICE_ID)->getExtensionById('taoQtiTest');
        $config = $extension->getConfig('testRunner');
        $count = 0;

        if (isset($this->configs['textToSpeech']) && defined('DEFAULT_LANG')) {
            $this->configs['textToSpeech']['config']['voiceLanguage'] = DEFAULT_LANG;
        }

        foreach ($this->configs as $pluginName => $pluginConfig) {
            $configured = false;

            if (isset($pluginConfig['id'])) {
                $pluginName = $pluginConfig['id'];
            }

            if (isset($pluginConfig['shortcuts']) && count($pluginConfig['shortcuts'])) {
                $config['shortcuts'][$pluginName] = $pluginConfig['shortcuts'];
                $configured = true;
            }

            if (isset($pluginConfig['config']) && count($pluginConfig['config'])) {
                $config['plugins'][$pluginName] = $pluginConfig['config'];
                $configured = true;
            }

            if ($configured) {
                $count ++;
            }
        }

        $extension->setConfig('testRunner', $config);

        return new Report(Report::TYPE_SUCCESS, $count . ' plugins configured.');
    }

    /**
     * Run the install action
     * @param $params
     * @return Report
     * @throws \common_exception_Error
     * @throws \common_exception_InconsistentData
     */
    public function __invoke($params)
    {
        $registered = $this->registerPlugins();
        $configured = $this->configurePlugins();

        $overall = new Report(Report::TYPE_SUCCESS, 'Plugins registration done!');
        $overall->add($registered);
        $overall->add($configured);
        if ($overall->containsError()) {
            $overall->setType(Report::TYPE_ERROR);
        }

        return $overall;
    }
}
