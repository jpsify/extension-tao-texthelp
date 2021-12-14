<?php
/**
 * Copyright (c) 2018 (original work) Open Assessment Technologies SA ;
 */

namespace oat\taoTextHelp\scripts\update;

/**
 * Class Updater
 * @package oat\taoTextHelp\scripts\update
 * @deprecated use migrations instead. See https://github.com/oat-sa/generis/wiki/Tao-Update-Process
 */
class Updater extends \common_ext_ExtensionUpdater
{
    /**
     * Perform update from $initialVersion to $versionUpdatedTo.
     *
     * @param string $initialVersion
     * @return string $versionUpdatedTo
     */
    public function update($initialVersion)
    {
        if ($this->isVersion('0.1.0')) {

            $extension = $this->getServiceManager()->get(\common_ext_ExtensionsManager::SERVICE_ID)->getExtensionById('taoQtiTest');
            $config = $extension->getConfig('testRunner');

            $config['plugins']['textToSpeech']['languagesCrosswalk'] = [];

            $extension->setConfig('testRunner', $config);

            $this->setVersion('0.2.0');
        }

        $this->skip('0.2.0', '0.2.2');

        if ($this->isVersion('0.2.2')) {

            $extension = $this->getServiceManager()->get(\common_ext_ExtensionsManager::SERVICE_ID)->getExtensionById('taoQtiTest');
            $config = $extension->getConfig('testRunner');

            // URI of the remote config file
            $config['plugins']['textToSpeech']['setupUrl'] = '//taotoolbar.speechstream.net/tao/configQA.js';
            $config['plugins']['textToSpeech']['allowTextHelpLangCheck'] = false;
            $config['plugins']['textToSpeech']['allowQtiLangCheck'] = true;
            $config['plugins']['textToSpeech']['forceLanguage'] = true;

            // remove local TTS config, as it should remain on their server
            $removeList = ['server', 'build', 'custId', 'loginName', 'speechServer', 'speechServerBackup', 'cacheServer', 'webServices', 'voiceFromLangFlag'];
            foreach ($removeList as $entry) {
                unset($config['plugins']['textToSpeech'][$entry]);
            }

            $extension->setConfig('testRunner', $config);

            $this->setVersion('0.3.0');
        }

        if ($this->isVersion('0.3.0')) {

            $extension = $this->getServiceManager()->get(\common_ext_ExtensionsManager::SERVICE_ID)->getExtensionById('taoQtiTest');
            $config = $extension->getConfig('testRunner');

            // URI of the remote config file
            $config['plugins']['textToSpeech']['allowVolumeSetting'] = false;

            $extension->setConfig('testRunner', $config);

            $this->setVersion('0.4.0');
        }

        if ($this->isVersion('0.4.0')) {

            $extension = $this->getServiceManager()->get(\common_ext_ExtensionsManager::SERVICE_ID)->getExtensionById('taoQtiTest');
            $config = $extension->getConfig('testRunner');

            // URI of the remote config file
            $config['plugins']['textToSpeech']['overrideMathExpr'] = false;

            $extension->setConfig('testRunner', $config);

            $this->setVersion('0.5.0');
        }

        $this->skip('0.5.0', '1.2.0');

        if ($this->isVersion('1.2.0')) {
            $extension = $this->getServiceManager()->get(\common_ext_ExtensionsManager::SERVICE_ID)->getExtensionById('taoQtiTest');
            $config = $extension->getConfig('testRunner');
            if (isset($config['plugins']['textToSpeech']['setupUrl']) &&
                $config['plugins']['textToSpeech']['setupUrl'] == '//taotoolbar.speechstream.net/tao/configQA.js') {
                $config['plugins']['textToSpeech']['setupUrl'] = '//configuration.speechstream.net/oat/taopremimum/v216/config.js';
                $extension->setConfig('testRunner', $config);
            }


            $this->setVersion('1.3.0');
        }

        $this->skip('1.3.0', '1.3.3');
        
        //Updater files are deprecated. Please use migrations.
        //See: https://github.com/oat-sa/generis/wiki/Tao-Update-Process

        $this->setVersion($this->getExtension()->getManifest()->getVersion());
    }
}
