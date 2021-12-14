<?php
/**
 * Copyright (c) 2018 Open Assessment Technologies, S.A.
 */

namespace oat\taoTextHelp\scripts\install;

use oat\oatbox\extension\InstallAction;
use oat\taoQtiTest\models\TestCategoryPresetRegistry;

/**
 * Class RegisterTextHelpCategoryPresetProviders
 * @package oat\taoTextHelp\scripts\install
 */
class RegisterTextHelpCategoryPresetProviders extends InstallAction
{
    public function __invoke($params)
    {
        $registry = TestCategoryPresetRegistry::getRegistry();

        $registry->set('taoTextHelp', '\oat\taoTextHelp\model\testCategory\TextHelpCategoryPresetProvider');

        return new \common_report_Report(\common_report_Report::TYPE_SUCCESS, 'TextHelp category preset provider has been successfully registered');
    }
}
