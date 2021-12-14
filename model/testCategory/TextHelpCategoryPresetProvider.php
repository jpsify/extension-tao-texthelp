<?php
/**
 * Copyright (c) 2018 (original work) Open Assessment Technologies SA;
 */

namespace oat\taoTextHelp\model\testCategory;

use oat\taoQtiTest\models\TestCategoryPreset;
use oat\taoQtiTest\models\TestCategoryPresetProvider;
use oat\taoQtiTest\models\TestCategoryPresetProviderInterface;

/**
 * Class TextHelpCategoryPresetProvider
 * @package oat\taoTextHelp\model\testCategory
 */
class TextHelpCategoryPresetProvider implements TestCategoryPresetProviderInterface
{
    /**
     * @param TestCategoryPresetProvider $presetService
     * @throws \common_exception_InconsistentData
     */
    public function registerPresets(TestCategoryPresetProvider $presetService)
    {
        $presetService->register(
            TestCategoryPresetProvider::GROUP_TOOLS,
            [
                TestCategoryPreset::fromArray([
                    'id'            => 'textToSpeech',
                    'label'         => __('Text to Speech'),
                    'qtiCategory'   => 'x-tao-option-textToSpeech',
                    'description'   => __('Enable text-to-speech via Texthelp'),
                    'order'         => 800,
                    'pluginId'      => 'textToSpeech'
                ]),
            ]
        );
    }
}
