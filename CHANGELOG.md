# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## 0.2.1 (2021-04-16)
### Added
- add support for resizing properties panel
- add pdf and svg export
- add dmn camunda properties panel
- add support for keyboard shortcuts in modeler
- add support for dmn diagrams
- add camunda properties panel
- show previews for bpmn files
- add bpmn properties panel
- write mimetype mapping
- add mimetype after install
- add bpmn editor

### Fixed
- appstore screenshot
- build/publish scripts
- update menu entry names (https://github.com/Loydl/nc-bpm-app/issues/2)
- editor on single file share
- viewer & modeler with sharing link
- multiple bpmn property panels
- info.xml structure
- ui state of save button for new docs
- single public share
- missing file icon for share and sidebar
- add install repair step
- mime type loader interface
- use post migration repair step
- body scrollbar

### Misc
- update change log
- update screenshot BPMN editor
- update app store info
- update app description
- add screenshot of DMN-editor
- update app description
- mention preview service in readme
- update screenshot
- add release guide
- add screenshot
- update readme
- publish scripts
- rename application to files_bpm
- move editor style to editor
- remove comment
- fix integration test
- fix phpunit bootstrap
- fix psalm
- clean up build script
- fix version string
- fix build script
- update composer deps
- add helper scripts
- initial app scaffold
- use chunks to reduce initial load
- fix unit tests
- fix nextcloud ocp
- update github actions

## 0.4.0 (2022-11-02)
### Updated
- phpunit updated to 8.5
- php-cs-fixer updated to 3.2
- nextcloud/coding-standard to 1.0
- christophwurtz/nextcloud replaced with nextcloud/ocp (no longer maintained)

## 1.0.0 (2023-01-09)
- Nextcloud support updated to v26
- BPMN-js updated to v11


## 1.3.0 (2024-02-26)
- Nextcloud support updated to v28
- BPMN-js updated to v17


## 1.3.1 (2024-03-08)
- Fixed behaviour on modeler exit: now returns you to the correct folder
- Fixed Call Activity links

## 1.3.2 (2024-03-24)
- Fixed bug that prevented regular users from using the modeler

## 1.4.0
- Nextcloud support updated to v29
- DMN-js updated to v16

## 1.5.0
- Nextcloud support updated to v30
- Fixed icons for pdf, svg downloads, save button
- Update to pdf download: subprocesses now have titles
- Links for call activities and data references now update immediately

## 1.5.1 (2024-12-09)
- Added a button to toggle the properties panel
- Added copy-paste functionality
- Updated dialog creation in accordance with Nextcloud 30
- Fixed bug that made some link overlays show up twice


## 1.6.0 (2025-02-13)
- Implemented the bpmn.io CMMN modeler

## 1.7.0 (2025-03-04)
- Nextcloud support for v31
- Tweaks to CMMN modeler

## 1.7.1 (2025-03-10)
- Minor CSS fix (on files page, sidebar content was hidden)

## 1.7.3 (2025-12-28)
- Nextcloud support updated to v33
- Fixed read-only BPMN viewer to be navigable, removed non-functional Properties button
