<?php

namespace OCA\FilesBpm\Preview;

use OCP\Preview\IProviderV2;

class CMMN extends PreviewServer implements IProviderV2 {
	public function getMimeType(): string {
		return 'application/x-cmmn';
	}
}
