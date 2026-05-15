import type {
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
	ResourceMapperFields,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';
import { description as generatePdfDescription, execute as generatePdfExecute } from '../PdfSplitMerge/actions/generatePdf';
import { NodeOperationError, NodeApiError } from 'n8n-workflow';

/**
 * Filter generatePdf descriptions to only include htmlToPdf-related fields.
 * We keep fields that either:
 *  - Have no displayOptions (always shown)
 *  - Show for operation=['htmlToPdf']
 *  - Show for operation containing 'htmlToPdf' (e.g. ['htmlToPdf','urlToPdf'])
 */
const htmlToPdfDescriptions = generatePdfDescription.filter((prop) => {
	const show = prop.displayOptions?.show;
	const hide = prop.displayOptions?.hide;

	// No displayOptions at all → keep
	if (!prop.displayOptions) return true;

	// If explicitly showing only urlToPdf, skip
	if (show?.operation) {
		const ops = show.operation as string[];
		if (!ops.includes('htmlToPdf')) return false;
	}

	// If it has a hide rule for htmlToPdf operations, skip
	if (hide?.operation) {
		const ops = hide.operation as string[];
		if (ops.includes('htmlToPdf')) return false;
	}

	return true;
});

export class HtmlToPdf implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'HTML to PDF',
		name: 'htmlToPdf',
		icon: { light: 'file:../../icons/pdfhub.light.svg', dark: 'file:../../icons/pdfhub.dark.svg' },
		group: ['transform'],
		version: 1,
		description: 'Convert HTML/CSS into a polished PDF document',
		defaults: {
			name: 'HTML to PDF',
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
			...htmlToPdfDescriptions,
		],
	};

	methods = {
		loadOptions: {
			async getStarterTemplates(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				try {
					const responseData = await this.helpers.httpRequest({
						method: 'GET',
						url: 'https://pdfapihub.com/starter-templates.json',
						json: true,
					}) as Array<{ id: string; title: string; category?: string }>;

					return [
						{ name: '— None —', value: '' },
						...responseData.map((t) => ({
							name: t.category ? `${t.category}: ${t.title}` : t.title,
							value: t.id,
						})),
					];
				} catch {
					return [{ name: '— None —', value: '' }];
				}
			},
		},
		resourceMapping: {
			async getStarterTemplatePlaceholders(this: ILoadOptionsFunctions): Promise<ResourceMapperFields> {
				const templateId = this.getCurrentNodeParameter('starter_template') as string;
				if (!templateId) return { fields: [] };

				try {
					const allTemplates = await this.helpers.httpRequest({
						method: 'GET',
						url: 'https://pdfapihub.com/starter-templates.json',
						json: true,
					}) as Array<{
						id: string;
						html: string;
						fields: Array<{ key: string; label: string; defaultValue: string }>;
					}>;

					const template = allTemplates.find((t) => t.id === templateId);
					if (!template) return { fields: [] };

					return {
						fields: template.fields.map((f) => ({
							id: f.key,
							displayName: f.label || f.key,
							type: 'string' as const,
							required: false,
							defaultMatch: false,
							display: true,
							defaultValue: f.defaultValue ?? '',
						})),
					};
				} catch {
					return { fields: [] };
				}
			},

			async getStarterTemplateHtml(this: ILoadOptionsFunctions): Promise<ResourceMapperFields> {
				const templateId = this.getCurrentNodeParameter('starter_template') as string;
				if (!templateId) return { fields: [] };

				try {
					const allTemplates = await this.helpers.httpRequest({
						method: 'GET',
						url: 'https://pdfapihub.com/starter-templates.json',
						json: true,
					}) as Array<{ id: string; html: string }>;

					const template = allTemplates.find((t) => t.id === templateId);
					if (!template) return { fields: [] };

					return {
						fields: [{
							id: 'html_content',
							displayName: 'HTML Content',
							type: 'string' as const,
							required: false,
							defaultMatch: false,
							display: true,
							defaultValue: template.html ?? '',
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						} as any],
					};
				} catch {
					return { fields: [] };
				}
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				await generatePdfExecute.call(this, i, returnData, 'htmlToPdf');
			} catch (error) {
				if (this.continueOnFail()) {
					const message = error instanceof Error ? error.message : 'Unknown error';
					returnData.push({ json: { error: message }, pairedItem: { item: i } });
				} else if (error instanceof NodeApiError) {
					throw error;
				} else {
					throw new NodeOperationError(this.getNode(), error, { itemIndex: i });
				}
			}
		}

		return [returnData];
	}
}
