<?php

namespace OCA\FilesBpm\Preview;

use OCP\Preview\IProviderV2;

class BPMN extends PreviewServer implements IProviderV2 {
	public function getMimeType(): string {
		return 'application/x-bpmn';
	}
}
