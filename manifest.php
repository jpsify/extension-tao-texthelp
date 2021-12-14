<?php
/**
 * Copyright (c) 2018 (original work) Open Assessment Technologies SA;
 */

use oat\taoTextHelp\scripts\install\RegisterTestRunnerPlugins;
use oat\taoTextHelp\scripts\install\RegisterTextHelpCategoryPresetProviders;
use oat\taoTextHelp\scripts\update\Updater;

return array(
    'name' => 'taoTextHelp',
    'label' => 'taoTextHelp',
    'description' => 'TAO Premium feature: TextHelp',
    'license' => 'Proprietary',
    'author' => 'Open Assessment Technologies SA',
    'managementRole' => 'http://www.tao.lu/Ontologies/generis.rdf#taoTextHelpManager',
    'acl' => array(
        array('grant', 'http://www.tao.lu/Ontologies/generis.rdf#taoTextHelpManager', array('ext' => 'taoTextHelp')),
    ),
    'install' => array(
        'php' => array(
            RegisterTestRunnerPlugins::class,
            RegisterTextHelpCategoryPresetProviders::class,
        )
    ),
    'update' => Updater::class,
    'uninstall' => array(),
    'routes' => array(
        '/taoTextHelp' => 'oat\\taoTextHelp\\controller'
    ),
    'constants' => array(
        # views directory
        "DIR_VIEWS" => dirname(__FILE__) . DIRECTORY_SEPARATOR . "views" . DIRECTORY_SEPARATOR,

        #BASE URL (usually the domain root)
        'BASE_URL' => ROOT_URL . 'taoTextHelp/',
    ),
    'extra' => array(
        'structures' => dirname(__FILE__) . DIRECTORY_SEPARATOR . 'controller' . DIRECTORY_SEPARATOR . 'structures.xml',
    )
);
