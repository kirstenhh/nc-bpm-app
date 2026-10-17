<?php

namespace OCA\FilesBpm\AppInfo;

use OCA\Files\Event\LoadAdditionalScriptsEvent;
use OCA\Files_Sharing\Event\BeforeTemplateRenderedEvent;
use OCA\FilesBpm\Listener\LoadAdditionalScriptsListener;
use OCA\FilesBpm\Preview\BPMN;
use OCA\FilesBpm\Preview\DMN;
use OCP\AppFramework\App;
use OCP\AppFramework\Bootstrap\IBootContext;
use OCP\AppFramework\Bootstrap\IBootstrap;
use OCP\AppFramework\Bootstrap\IRegistrationContext;

class Application extends App implements IBootstrap {
	public const APP_ID = 'files_bpm';

	/**
	 * @param array $params
	 */
	public function __construct(array $params = []) {
		parent::__construct(self::APP_ID, $params);
	}

	public function register(IRegistrationContext $context): void {
		$context->registerEventListener(LoadAdditionalScriptsEvent::class, LoadAdditionalScriptsListener::class);
		$context->registerEventListener(BeforeTemplateRenderedEvent::class, LoadAdditionalScriptsListener::class);

		// \OCP\IPreview::registerProvider() was removed in Nextcloud 35.
		// Register the preview providers via the registration context instead
		// (available since Nextcloud 23).
		$context->registerPreviewProvider(BPMN::class, '/application\/x-bpmn/');
		$context->registerPreviewProvider(DMN::class, '/application\/x-dmn/');
	}

	public function boot(IBootContext $context): void {
	}
}
