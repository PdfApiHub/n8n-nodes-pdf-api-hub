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
