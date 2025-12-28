import BPMNModeler from 'bpmn-js/lib/Modeler';
import NavigatedViewer from 'bpmn-js/lib/NavigatedViewer';
import {
	BpmnPropertiesPanelModule,
	BpmnPropertiesProviderModule,
} from 'bpmn-js-properties-panel';
import { translate as t } from '@nextcloud/l10n';

//@ts-ignore
import colorPicker from 'bpmn-js-color-picker';
import copyPasteModule from './copypaste';

import camundaModdleDescriptor from 'camunda-bpmn-moddle/resources/camunda.json';
import api from './api';
import Editor from './Editor';


import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';
import 'bpmn-js/dist/assets/bpmn-js.css';
// import 'bpmn-js-properties-panel/dist/assets/properties-panel.css';
// import 'bpmn-js-properties-panel/dist/assets/element-templates.css';
// import 'bpmn-js-bpmnlint/dist/assets/css/bpmn-js-bpmnlint.css';

let openPropertiesPanel = false;

import './Editor.scss';

import '@fortawesome/fontawesome-free/js/all.js';
import '@fortawesome/fontawesome-free/js/solid.js';

import './Editor.scss';
import { jsPDF } from 'jspdf';
import { is, isAny, getBusinessObject } from 'bpmn-js/lib/util/ModelUtil';

import propertiesProvider from './provider';
import propDescriptor from './descriptors/ncModeler.json';

declare type Modeler = {
	destroy(): void,
	on(event: string, callback: (...any) => void): void
	importXML(xml: string): Promise<{ warnings: string[] }>
	saveXML(options?: { format?: boolean, preamble?: boolean }): Promise<{ xml: string }>
	saveSVG(): Promise<{ svg: string }>
	get(serviceName: string, strict?: boolean): any
}

const PLAIN_TEMPLATE = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn2:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" xsi:schemaLocation="http://www.omg.org/spec/BPMN/20100524/MODEL BPMN20.xsd" id="sample-diagram" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn2:process id="Process_1" isExecutable="false">
	<bpmn2:startEvent id="StartEvent_1"/>
  </bpmn2:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
	<bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
	  <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">
		<dc:Bounds height="36.0" width="36.0" x="412.0" y="240.0"/>
	  </bpmndi:BPMNShape>
	</bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn2:definitions>`;

export default class BPMNEditor extends Editor {

	private modeler: Modeler | NavigatedViewer;

	protected getContent(): Promise<string> {
		if (this.modeler) {
			return this.modeler.saveXML().then(data => data.xml);
		}

		if (this.file.etag || OCA.Sharing?.PublicApp) {

			//return api.fileContentFmController(this.file.path, this.file.id ?? 0);
			return api.getFileContent(this.file.path, this.file.id ?? 0);
			// if (this.file.path.endsWith('/')) {
			// 	return api.getFileContent(this.file.path, this.file.name);
			// }

			// //new version: path includes name. Old version: path does not include name.
			// return api.getFileContent(this.file.path, this.file.name);
		}

		return Promise.resolve(PLAIN_TEMPLATE);
	}

	protected async getSVG(): Promise<string> {

		if (this.modeler) {
			return (await this.modeler.saveSVG()).svg;
		}

		throw new Error('Modeler not loaded');
	}

	protected async destroy(): Promise<void> {
		this.modeler && this.modeler.destroy();

		//this.removeResizeListener(this.onResize);
	}
	protected async downloadAsPDF(pdf: jsPDF): Promise<void> {

		const canvas = this.modeler.get('canvas');
		const rootelem = canvas.getRootElement();
		const elemReg = this.modeler.get('elementRegistry');
		const mainProc = elemReg
			.filter(el => isAny(el, ['bpmn:Process', 'bpmn:Collaboration']) && !is(el, 'bpmn:SubProcess'))[0];

		if (rootelem.type == 'bpmn:SubProcess') {
			await canvas.setRootElement(mainProc);
		}
		//for printing
		const svgContainer = $('<div>');
		svgContainer.css({
			position: 'fixed',
			bottom: '100%',
		});
		svgContainer.append(await this.getSVG());
		svgContainer.appendTo(this.containerElement);

		const svgElement = svgContainer.find('svg').get(0);
		//const bounding = svgElement.getBoundingClientRect();

		if (svgElement) {
			const width = svgElement.width.baseVal.value < 620 ? svgElement.width.baseVal.value - 30 : 600;
			const height = svgElement.height.baseVal.value < 375 ? svgElement.height.baseVal.value - 30 : 375;
			await pdf.svg(svgElement, {
				x: 15,
				y: 45,
				width: width,
				height: height,
			}); //nb: width and height are a4 dimensions - 30 mm
		}

		//get subprocesses

		const subprocesses = elemReg.filter(el => el.type === 'bpmn:SubProcess' && el.hasOwnProperty('layer'));


		for (let i = 0; i < subprocesses.length; i++) {
			const svgContainer = $('<div>');
			svgContainer.css({
				position: 'fixed',
				bottom: '100%',
			});
			canvas.setRootElement(subprocesses[i]);
			svgContainer.append(await this.getSVG());
			svgContainer.appendTo(this.containerElement);

			const subsvg = svgContainer.find('svg').get(0);
			if (subsvg) {
				pdf.addPage('a4', 'landscape');
				pdf.text(subprocesses[i].di.bpmnElement.name, 15, 30);

				const width = subsvg.width.baseVal.value < 620 ? subsvg.width.baseVal.value - 30 : 600;
				const height = subsvg.height.baseVal.value < 375 ? subsvg.height.baseVal.value - 30 : 375;

				await pdf.svg(subsvg, {
					x: 15,
					y: 45,
					width: width,
					height: height,
				});
			}
			svgContainer.remove();
		}
		canvas.setRootElement(rootelem);
	}

	//helper method for getting the extension element values?
	private extElemHelper = (xml: string) => {

		const extensionDict = new Map<string, Array<[string, string]>>();

		const parser = new DOMParser();
		const xmlData = parser.parseFromString(xml, 'text/xml');

		const elements = xmlData.getElementsByTagNameNS('*', 'extensionElements');

		for (let i = 0; i < elements.length; i++) {
			const parent = elements[i].parentElement?.id ?? 'na'; //na is a placeholder; this should not be a possible value
			const children = new Array<[string, string]>();
			const childArray = elements[i].getElementsByTagName('nc:property');
			for (let j = 0; j < childArray.length; j++) {
				children.push([childArray[j].getAttribute('name') ?? 'na', childArray[j].getAttribute('value') ?? '']);
			}
			extensionDict.set(parent, children);
		}
		return extensionDict;
	};

	protected async runEditor(): Promise<void> {

		let bpmnXML = await this.getContent();
		if (!bpmnXML || bpmnXML == '') {
			bpmnXML = PLAIN_TEMPLATE;
		}
		const modeler = this.getModeler();
		const moddle = this.modeler.get('moddle');
		try {
			await modeler.importXML(bpmnXML);
			//Hack to manually extract and set the extension elements
			const extensionElementsDict = this.extElemHelper(bpmnXML);
			const elements = modeler.get('elementRegistry');

			elements.forEach(function (element) {

				const extensionParent = getBusinessObject(element).extensionElements || moddle.create('bpmn:ExtensionElements');
				if (!extensionParent.values) {
					extensionParent.values = [];
				}
				const extProperties = extensionElementsDict.get(element.id) || [];
				for (let i = 0; i < extProperties.length; i++) {
					const prop = extProperties[i];
					const property = moddle.create('nc:property', { name: prop[0], value: prop[1] });
					extensionParent.get('values').push(property);
				}
			});
			this.addOverlays();
		} catch (err) {
			console.error(err);
			this.showLoadingError(err.toString());
		}
	}

	private onResize = () => {
		this.modeler && this.modeler.get('canvas').resized();
	}

	private getModeler() {
		if (!this.modeler) {
			const containerElement = this.getAppContainerElement();
			const canvasElement = containerElement.find('.bpmn-canvas')[0]; //[0] will return the HTMLElement; otherwise this function returns JQuery<HTMLElement>
			const propertiesElement = containerElement.find('.bpmn-properties');
			this.modeler = this.isFileUpdatable() ? new BPMNModeler({
				container: canvasElement,
				additionalModules: [
					BpmnPropertiesPanelModule,
					BpmnPropertiesProviderModule,
					propertiesProvider,
					colorPicker,
					copyPasteModule
				],
				propertiesPanel: {
					parent: propertiesElement,
					layout: {
						open: true,
						groups: {
							general: { open: true },
							documentation: { open: true },
							nc: { open: true },
						},
					},
				},
				moddleExtensions: {
					camunda: camundaModdleDescriptor,
					nc: propDescriptor,
				},
			}) : new NavigatedViewer({
				container: canvasElement
			});
			this.modeler.on('element.changed', (e) => {
				if (!this.hasUnsavedChanges) {
					this.hasUnsavedChanges = true;

					containerElement.attr('data-state', 'unsaved');
				}
				this.updateOverlay(e);
			});
			if (openPropertiesPanel) {

				$('<div>')
					.addClass('entry close icon-close propertiespanel-close')
					.attr('role', 'button')
					.on('click', this.clickCallbackFactory(this.closeProp))
					.appendTo(propertiesElement);
				console.log('appended a close button');
			}

		}
		return this.modeler;
	}
	protected async closeProp(): Promise<void> {
		const containerElement = this.getAppContainerElement();
		const propertiesElement = containerElement.find('.bpmn-properties');
		propertiesElement.addClass('hidden');
	}

	private updateOverlay(ev) {
		console.log('updating overlays');
		const element = ev.element;
		if (isAny(element, ['bpmn:CallActivity', 'bpmn:DataStoreReference', 'bpmn:DataObjectReference']) &&! (element.type == 'label' )) {
			console.log(element);
			try {
				const overlays = this.modeler.get('overlays');

				overlays.remove({ element: element.id });

				const extValues = element.businessObject?.extensionElements;
				if (!extValues) {
					return;
				}
				let modelUrl = extValues.values?.find(a => ['bpmnModel', 'dataSource'].indexOf(a.name) >= 0)?.value;
				if (!modelUrl) {
					return;
				}
				modelUrl = modelUrl.replace('https://', '');
				modelUrl = modelUrl.replace('https//', '');

				if (element.type == 'bpmn:CallActivity' || element.type == 'bpmn:callActivity') {
					const htmlOverlay = `<a href="https://${modelUrl}" class="djs-overlay djs-overlay-drilldown link-overlay" target="_blank"><i class="fa-solid fa-link"></i></a>`;
					overlays.add(element.id, 'drilldown', {
						position: {
							bottom: 0,
							right: 0,
						},
						html: htmlOverlay,
					});
				} else {
					const htmlOverlay = `<a href="https://${modelUrl}" class="djs-overlay djs-overlay-drilldown link-overlay" target="_blank"><i class="fa-regular fa-file-lines"></i></a>`;

					let left = element.width;
					let top = element.height + 5;
					if (element.label) {
						left = (element.width + element.label.width) / 2 + 5;
						top = element.height + element.label.height + 5;
					}

					overlays.add(element.id, 'drilldown', {
						position: { left, top },
						html: htmlOverlay,
					});
				}

			} catch (e) {
				//These overlays are just helpful, so it's better to skip any that break without warning the user
				console.error('non-breaking error: ');
				console.log(e);
			}
		}
	}

	private addOverlays() {
		const elements = this.modeler.get('elementRegistry');
		const overlays = this.modeler.get('overlays');
		elements.forEach(function (element) {

			if (isAny(element, ['bpmn:CallActivity', 'bpmn:DataStoreReference', 'bpmn:DataObjectReference']) && ! (element.type == 'label')) {
				try {
					console.log(element);
					const extValues = element.businessObject?.extensionElements;
					if (!extValues) {
						return;
					}
					overlays.remove({ element: element.id });

					let modelUrl = extValues.values?.find(a => ['bpmnModel', 'dataSource'].indexOf(a.name) >= 0)?.value;
					if (!modelUrl) {
						return;
					}

					modelUrl = modelUrl.replace('https://', '');
					modelUrl = modelUrl.replace('https//', '');

					if (element.type == 'bpmn:CallActivity' || element.type == 'bpmn:callActivity') {
						const htmlOverlay = `<a href="https://${modelUrl}" class="djs-overlay djs-overlay-drilldown link-overlay" target="_blank"><i class="fa-solid fa-link"></i></a>`;

						overlays.add(element.id, 'drilldown', {
							position: {
								bottom: 0,
								right: 0,
							},
							html: htmlOverlay,
						});
					} else {
						const htmlOverlay = `<a href="https://${modelUrl}" class="djs-overlay djs-overlay-drilldown link-overlay" target="_blank""><i class="fa-regular fa-file-lines"></i></a>`;

						let left = element.width;
						let top = element.height + 5;
						if (element.label) {
							left = (element.width + element.label.width) / 2 + 5;
							top = element.height + element.label.height + 5;
						}

						overlays.add(element.id, 'drilldown', {
							position: { left, top },
							html: htmlOverlay,
						});
					}
				} catch (e) {
					//These overlays are just helpful, so it's better to skip any that break without warning the user
					console.error('non-breaking error: ');
					console.log(e);
				}
			}
		});
	}
	protected getAppContainerElement(): JQuery {
		let newcontainer = false;
		if (!this.containerElement || this.containerElement.length === 0) {
			newcontainer = true;
		}
		const containerElement = super.getAppContainerElement();
		// if (newcontainer) {
		//const groupElement = $('#modeler-actions-group');
		if (newcontainer && this.isFileUpdatable()) {
			const actionsgroup = document.getElementById('modeler-actions-group') ?? $('#modeler-actions-group');
			$('<div>', { id: 'propertiesToggle' })
				.attr('role', 'button')
				.addClass('entry')
				.on('click', this.toggleProperties)
				.append('<span>Properties</span>')
				.appendTo(actionsgroup);
		}

		return containerElement;
	}



	private toggleProperties = (ev: JQuery.ClickEvent) => {

		openPropertiesPanel = !openPropertiesPanel;

		const propertiesElement = this.getAppContainerElement().find('.bpmn-properties');
		propertiesElement.toggleClass('hidden');
		// if (openPropertiesPanel) {
		// 	propertiesElement.removeClass('hidden');
		// }else{
		// 	propertiesElement.addClass('hidden');
		// 	//
		// }
	}

}
