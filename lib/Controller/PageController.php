<?php
namespace OCA\FilesBpm\Controller;

use OCP\IRequest;
use OCP\AppFramework\Http\TemplateResponse;
use OCP\AppFramework\Http\Template\PublicTemplateResponse;
use OCP\AppFramework\Http\DataResponse;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\Attribute\NoAdminRequired;
use OCP\IURLGenerator;
use OCP\AppFramework\Http\RedirectResponse;
use OCP\AppFramework\Services\IInitialState;
use OCP\IConfig;
use OCP\Files\IRootFolder;

use OCP\AppFramework\Http;

//use OCP\ILogger;
use Psr\Log\LoggerInterface;

//Thanks to : https://github.com/githubkoma/multiboards/blob/main/js/filesintegration/src/index.js


class PageController extends Controller {
	private $userId;
	private IRootFolder $storage;
	private $logger;
	private $urlGenerator;


	public function __construct($AppName,
					IRequest $request,
					IRootFolder
					$storage,
					$UserId,
					LoggerInterface $logger,
					IURLGenerator $urlGenerator,){
		parent::__construct($AppName, $request);
		$this->userId = $UserId;
		$this->storage = $storage;
		$this->urlGenerator = $urlGenerator;
	}


	/**
	 * CAUTION: the @Stuff turns off security checks; for this page no admin is
	 *          required and no CSRF check. If you don't know what CSRF is, read
	 *          it up in the docs or you might create a security hole. This is
	 *          basically the only required method to add this exemption, don't
	 *          add it to any other method if you don't exactly know what it does
	 *
	 * @NoAdminRequired
	 * @NoCSRFRequired
	 * @PublicPage
	 */
	#[NoAdminRequired]
    public function index() {

		if ($this->userId == "") {

			$template = new PublicTemplateResponse($this->appName, 'modeler', []);
			$template->setHeaderTitle('BPMN Files');
			$template->setHeaderDetails("Public");
			$template->setFooterVisible(false);

			$response = $template;
			$redirectUrl = $this->urlGenerator->linkToRoute("core.login.showLoginForm", [
                "redirect_url" => $this->request->getRequestUri()
            ]);
            return new RedirectResponse($redirectUrl);
			//$response->setHeaders(['X-Frame-Options' => 'allow-from *']);		// Should be needed when this site is allowed to be embedded by 3rd party sites

		} else {
			$response = $this->indexLoggedIn();
		}

        return $response;
    }

	/**
	 * CAUTION: the @Stuff turns off security checks; for this page no admin is
	 *          required and no CSRF check. If you don't know what CSRF is, read
	 *          it up in the docs or you might create a security hole. This is
	 *          basically the only required method to add this exemption, don't
	 *          add it to any other method if you don't exactly know what it does
	 *
	 * @NoAdminRequired
	 * @NoCSRFRequired
	 */
	#[NoAdminRequired]
	#[NoCSRFRequired]

	public function indexLoggedIn() {
		return new TemplateResponse($this->appName, 'modeler');  // templates/index.php
	}

  /**
     * This is not a comment, it's a setting!
     * @NoAdminRequired
     */
	#[NoAdminRequired]
	private function getFile($fileId){
		$userFolder = $this->storage->getUserFolder($this->userId);
		try{
			$file = $userFolder->getById($fileId)[0];

		} catch(\OCP\Files\NotFoundException $e) {
            throw new StorageException('File does not exist');
        }
        if (!$file->isReadable())
        {
            throw new ForbiddenException();
        }
		if ($file instanceof \OCP\Files\File) {
			return $file;
		} else {
			throw new StorageException('Can not read from folder');
		}
	}


	  /**
     * This is not a comment, it's a setting!
     * @NoAdminRequired
     */
	#[NoAdminRequired]
	public function getFileInfo($fileId) {
		try
        {
            $file = $this->getFile($fileId);
			//, $writeable, $relativePath
            if ($file instanceof Folder) {
                return new DataResponse(['message' => 'You can not open a folder'], Http::STATUS_BAD_REQUEST);
            }


            $baseFolder = $this->storage->getUserFolder($this->userId);
            $relativePath = dirname($baseFolder->getRelativePath($file->getPath()));

            return new DataResponse(
                [
                    'id' => $file->getId(),
                    'size' => $file->getSize(),
                    'writeable' => $file->isUpdateable(),
                    'mime' => $file->getMimeType(),
                    'path' => $relativePath,
                    'name' => $file->getName(),
                    'owner' => $file->getOwner()->getUID(),
                    'etag' => $file->getEtag(),
                    'mtime' => $file->getMTime(),
                    'created' => $file->getCreationTime() + $file->getUploadTime(),
                    'instanceId' => \OC_Util::getInstanceId()
                ],
                Http::STATUS_OK
            );
        }
        catch (\Exception $e) {
			$message ='An internal server error occurred.';
			return new DataResponse(['message' => $message], Http::STATUS_INTERNAL_SERVER_ERROR);
		}

    }


	  /**
     * This is not a comment, it's a setting!
     * @NoAdminRequired
     */
	#[NoAdminRequired]
	public function getFileContent($fileId){
		try
        {
            $file = $this->getFile($fileId);
			//, $writeable, $relativePath
            if ($file instanceof Folder) {
                return new DataResponse(['message' => 'You can not open a folder'], Http::STATUS_BAD_REQUEST);
            }

			return $file->getContent();

        }
        catch (\Exception $e) {
			$message ='An internal server error occurred.';
			return new DataResponse(['message' => $message], Http::STATUS_INTERNAL_SERVER_ERROR);
		}
	}

  /**
     * This is not a comment, it's a setting!
     * @NoAdminRequired
     */
	#[NoAdminRequired]
	public function testDummy($fileId){
		$message = 'This is only a test. File ID: ';
		return new DataResponse(['message'=> $message], 418);
	}

}