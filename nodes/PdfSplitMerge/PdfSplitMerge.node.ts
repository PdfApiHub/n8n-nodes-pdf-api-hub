import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';
import { executePdfSplitMerge, allActionDescriptions } from './actions';
import { resourceProperty, operationProperties } from './descriptions';

export class PdfSplitMerge implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'PDF API Hub',
		name: 'pdfSplitMerge',
		icon: { light: 'file:../../icons/pdfhub.light.svg', dark: 'file:../../icons/pdfhub.dark.svg' },
		group: ['transform'],
		version: 1,
		description:
			'HTML/URL to PDF API, OCR, merge/split/compress PDFs, convert formats, and website screenshots. Complete PDF processing toolkit.',
		defaults: {
			name: 'PDF API Hub',
		},
		codex: {
			alias: [
				'HTML',
				'PDF',
				'PDF Tools',
				'HTML to PDF',
				'URL to PDF',
				'Website to PDF',
				'Screenshot',
				'Website Screenshot',
				'HTML to Image',
				'URL to Image',
				'Merge PDF',
				'Split PDF',
				'Compress PDF',
				'Lock PDF',
				'Unlock PDF',
				'PDF Security',
				'OCR',
				'PDF OCR',
				'Image OCR',
				'PDF to Image',
				'Image to PDF',
				'DOCX to PDF',
				'PDF to DOCX',
				'PDF to Excel',
				'PDF to XLSX',
				'PDF to CSV',
				'PDF to Text',
				'PDF to HTML',
				'PDF to PowerPoint',
				'PDF to PPTX',
				'Excel',
				'Spreadsheet',
				'Watermark',
				'Sign PDF',
				'Signature',
				'E-Sign',
				'Convert',
				'Format Conversion',
				'HTML2PDF',
				'Convert HTML to PDF',
				'Combine PDF',
				'Upload File',
				'File Storage',
			],
			categories: ['Documents', 'Utilities'],
			subcategories: {
				Documents: ['PDF', 'OCR', 'Conversion'],
				Utilities: ['File Processing', 'Screenshots'],
			},
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'pdfapihubApi',
				required: true,
			},
		],
		usableAsTool: true,
		properties: [
			resourceProperty,
			...operationProperties,
			...allActionDescriptions,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executePdfSplitMerge.call(this);
	}
}
