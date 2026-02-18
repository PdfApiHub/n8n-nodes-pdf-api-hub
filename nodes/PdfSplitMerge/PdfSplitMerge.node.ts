import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

export class PdfSplitMerge implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'PDF API Hub (Merge, Convert & Extract PDFs)',
		name: 'pdfSplitMerge',
		icon: { light: 'file:../../icons/pdfhub.light.svg', dark: 'file:../../icons/pdfhub.dark.svg' },
		group: ['transform'],
		version: 1,
		description:
			'Supports PDF parsing, merging, splitting, compressing, locking/unlocking, and HTML/URL to PDF conversion.',
		defaults: {
			name: 'PDF API Hub (Merge, Convert & Extract PDFs)',
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
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
							name: 'PDF Parse / Extract Text',
						value: 'pdfParsing',
							description: 'Extract text or structured data from PDFs',
					},
						{
							name: 'PDF Merge / Split / Compress',
							value: 'pdfManipulation',
							description: 'Merge, split, or compress PDF documents',
						},
						{
							name: 'Website / HTML to PDF',
							value: 'pdfCreation',
							description: 'Capture a website screenshot to PDF or render HTML/CSS to PDF',
						},
						{
							name: 'PDF Security (Lock / Unlock)',
							value: 'pdfSecurity',
							description: 'Lock and unlock password-protected PDFs',
						},
				],
					default: 'pdfParsing',
			},
			// PDF Creation Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['pdfCreation'],
					},
				},
				options: [
					{
						name: 'URL to PDF',
						value: 'urlToPdf',
						description: 'Capture website screenshot to PDF',
						action: 'Capture a screenshot of a website in PDF format',
					},
					{
						name: 'HTML to PDF',
						value: 'htmlToPdf',
						description: 'Generate PDF from HTML/CSS',
						action: 'Convert HTML to PDF',
					},
				],
				default: 'urlToPdf',
			},
			// PDF Manipulation Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['pdfManipulation'],
					},
				},
				options: [
					{
						name: 'Merge PDF',
						value: 'mergePdf',
						description: 'Merge multiple PDFs into a single PDF',
						action: 'Merge pdfs',
					},
					{
						name: 'Split PDF',
						value: 'splitPdf',
						description: 'Split a PDF into multiple files',
						action: 'Split a pdf',
					},
					{
						name: 'Compress PDF',
						value: 'compressPdf',
						description: 'Compress a PDF to reduce file size',
						action: 'Compress pdf',
					},
				],
				default: 'mergePdf',
			},
			// PDF Security Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['pdfSecurity'],
					},
				},
				options: [
					{
						name: 'Lock PDF',
						value: 'lockPdf',
						description: 'Add password protection to a PDF',
						action: 'Lock pdf',
					},
					{
						name: 'Unlock PDF',
						value: 'unlockPdf',
						description: 'Remove password protection from a PDF',
						action: 'Unlock pdf',
					},
				],
				default: 'lockPdf',
			},
			// PDF Parsing Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['pdfParsing'],
					},
				},
				options: [
					{
						name: 'Extract Text / Parse PDF',
						value: 'parsePdf',
						description: 'Extract text or structured data from a PDF',
						action: 'Parse PDF to JSON',
					},
				],
				default: 'parsePdf',
			},

			// Properties for HTML to PDF
			{
				displayName: 'HTML Content',
				name: 'html_content',
				type: 'string',
				default: '',
				description: 'HTML content to render in the document',
				displayOptions: {
					show: {
						operation: ['htmlToPdf'],
					},
				},
			},

			// Properties for Compress PDF
			{
				displayName: 'PDF URL',
				name: 'compress_url',
				type: 'string',
				default: '',
				description: 'URL of the PDF to compress',
				displayOptions: {
					show: {
						operation: ['compressPdf'],
					},
				},
			},
			{
				displayName: 'Compression Level',
				name: 'compression',
				type: 'options',
				options: [
					{ name: 'Low', value: 'low' },
					{ name: 'Medium', value: 'medium' },
					{ name: 'High', value: 'high' },
					{ name: 'Max', value: 'max' },
				],
				default: 'high',
				description: 'Compression strength (higher is more aggressive)',
				displayOptions: {
					show: {
						operation: ['compressPdf'],
					},
				},
			},
			{
				displayName: 'Output Type',
				name: 'compress_output',
				type: 'options',
				options: [
					{ name: 'URL', value: 'url' },
					{ name: 'File', value: 'file' },
					{ name: 'Base64', value: 'base64' },
				],
				default: 'file',
				description: 'Format of the compressed PDF output',
				displayOptions: {
					show: {
						operation: ['compressPdf'],
					},
				},
			},
			{
				displayName: 'Output Filename',
				name: 'compress_output_name',
				type: 'string',
				default: 'compressed.pdf',
				description: 'Custom name for the output file',
				displayOptions: {
					show: {
						operation: ['compressPdf'],
					},
				},
			},

			// Properties for Lock PDF
			{
				displayName: 'PDF URL',
				name: 'lock_url',
				type: 'string',
				default: '',
				description: 'URL of the PDF to lock',
				displayOptions: {
					show: {
						operation: ['lockPdf'],
					},
				},
			},
			{
				displayName: 'Password',
				name: 'lock_password',
				type: 'string',
				typeOptions: {
					password: true,
				},
				default: '',
				description: 'Password to set on the PDF',
				displayOptions: {
					show: {
						operation: ['lockPdf'],
					},
				},
			},
			{
				displayName: 'Input Password',
				name: 'lock_input_password',
				type: 'string',
				typeOptions: {
					password: true,
				},
				default: '',
				description: 'Optional password if the input PDF is already encrypted',
				displayOptions: {
					show: {
						operation: ['lockPdf'],
					},
				},
			},
			{
				displayName: 'Output Type',
				name: 'lock_output',
				type: 'options',
				options: [
					{ name: 'URL', value: 'url' },
					{ name: 'File', value: 'file' },
					{ name: 'Base64', value: 'base64' },
				],
				default: 'file',
				description: 'Format of the locked PDF output',
				displayOptions: {
					show: {
						operation: ['lockPdf'],
					},
				},
			},
			{
				displayName: 'Output Filename',
				name: 'lock_output_name',
				type: 'string',
				default: 'locked.pdf',
				description: 'Custom name for the output file',
				displayOptions: {
					show: {
						operation: ['lockPdf'],
					},
				},
			},

			// Properties for Unlock PDF
			{
				displayName: 'PDF URL',
				name: 'unlock_url',
				type: 'string',
				default: '',
				description: 'URL of the password-protected PDF to unlock',
				displayOptions: {
					show: {
						operation: ['unlockPdf'],
					},
				},
			},
			{
				displayName: 'Password',
				name: 'unlock_password',
				type: 'string',
				typeOptions: {
					password: true,
				},
				default: '',
				description: 'Password to unlock the PDF',
				displayOptions: {
					show: {
						operation: ['unlockPdf'],
					},
				},
			},
			{
				displayName: 'Output Type',
				name: 'unlock_output',
				type: 'options',
				options: [
					{ name: 'URL', value: 'url' },
					{ name: 'File', value: 'file' },
					{ name: 'Base64', value: 'base64' },
				],
				default: 'file',
				description: 'Format of the unlocked PDF output',
				displayOptions: {
					show: {
						operation: ['unlockPdf'],
					},
				},
			},
			{
				displayName: 'Output Filename',
				name: 'unlock_output_name',
				type: 'string',
				default: 'unlocked.pdf',
				description: 'Custom name for the output file',
				displayOptions: {
					show: {
						operation: ['unlockPdf'],
					},
				},
			},
			{
				displayName: 'CSS Content',
				name: 'css_content',
				type: 'string',
				default: '',
				description: 'CSS to style the HTML',
				displayOptions: {
					show: {
						operation: ['htmlToPdf'],
					},
				},
			},
			{
				displayName: 'Viewport Width',
				name: 'viewPortWidth',
				type: 'number',
				default: 1080,
				description: 'Viewport Width in Pixels',
				displayOptions: {
					show: {
						operation: ['htmlToPdf', 'urlToPdf'],
					},
				},
			},
			{
				displayName: 'Viewport Height',
				name: 'viewPortHeight',
				type: 'number',
				default: 720,
				description: 'Viewport Height in Pixels',
				displayOptions: {
					show: {
						operation: ['htmlToPdf', 'urlToPdf'],
					},
				},
			},
			{
				displayName: 'Output Format',
				name: 'output_format',
				type: 'options',
				options: [
					{ name: 'URL', value: 'url' },
					{ name: 'File', value: 'file' },
				],
				default: 'url',
				description: 'Format of the output response',
				displayOptions: {
					show: {
						operation: ['htmlToPdf', 'urlToPdf'],
					},
				},
			},
			// Properties for URL to PDF
			{
				displayName: 'URL',
				name: 'url_to_pdf',
				type: 'string',
				default: '',
				description: 'The URL of the website to capture',
				displayOptions: {
					show: {
						operation: ['urlToPdf'],
					},
				},
			},
			{
				displayName: 'Full Page',
				name: 'full_page',
				type: 'boolean',
				default: true,
				description: 'Whether to capture the full page',
				displayOptions: {
					show: {
						operation: ['urlToPdf'],
					},
				},
			},
			{
				displayName: 'Wait Till',
				name: 'wait_till',
				type: 'number',
				default: 10000,
				description: 'Milliseconds to wait before capturing',
				displayOptions: {
					show: {
						operation: ['urlToPdf'],
					},
				},
			},
			{
				displayName: 'Output Filename',
				name: 'output_filename',
				type: 'string',
				default: 'document',
				description: 'The filename for the generated PDF (without .pdf extension)',
				displayOptions: {
					show: {
						operation: ['htmlToPdf', 'urlToPdf'],
					},
				},
			},
			{
				displayName: 'Timeout (in Seconds)',
				name: 'timeout',
				type: 'number',
				default: 300,
				description: 'Request timeout in seconds (default: 300 seconds = 5 minutes). Increase this for large PDFs.',
				displayOptions: {
					show: {
						operation: ['htmlToPdf', 'urlToPdf'],
					},
				},
			},
			{
				displayName: 'Dynamic Params',
				name: 'dynamic_params',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				default: {},
				description: 'Dynamic parameters for templating (key/value pairs)',
				displayOptions: {
					show: {
						operation: ['htmlToPdf'],
					},
				},
				options: [
					{
						name: 'params',
						displayName: 'Params',
						values: [
							{
								displayName: 'Key',
								name: 'key',
								type: 'string',
								default: '',
								description: 'Placeholder key, for example {cert}',
							},
							{
								displayName: 'Value',
								name: 'value',
								type: 'string',
								default: '',
								description: 'Replacement value, for example name',
							},
						],
					},
				],
			},

			// Merge parameters
			{
				displayName: 'Input Type',
				name: 'merge_input_type',
				type: 'options',
				options: [
					{
						name: 'URL',
						value: 'url',
						description: 'Provide publicly accessible PDF URLs',
					},
					{
						name: 'File (Binary)',
						value: 'file',
						description: 'Upload PDF files from incoming binary data',
					},
				],
				default: 'url',
				description: 'How to provide the PDFs to merge',
				displayOptions: {
					show: {
						operation: ['mergePdf'],
					},
				},
			},
			{
				displayName: 'URLs',
				name: 'urls',
				type: 'string',
				typeOptions: {
					multipleValues: true,
				},
				default: [],
				description: 'Array of PDF URLs to merge',
				placeholder: 'https://pdfapihub.com/sample.pdf',
				displayOptions: {
					show: {
						operation: ['mergePdf'],
						merge_input_type: ['url'],
					},
				},
			},
			{
				displayName: 'Binary Property Names',
				name: 'merge_files_binary_properties',
				type: 'string',
				typeOptions: {
					multipleValues: true,
				},
				default: ['data'],
				description:
					'One or more binary property names that contain PDFs to merge (for example: "data"). Each entry should point to a PDF binary.',
				displayOptions: {
					show: {
						operation: ['mergePdf'],
						merge_input_type: ['file'],
					},
				},
			},
			{
				displayName: 'Output Format',
				name: 'output',
				type: 'options',
				options: [
					{
						name: 'URL',
						value: 'url',
						description: 'Return a URL to the merged PDF',
					},
					{
						name: 'File',
						value: 'file',
						description: 'Download the merged PDF as a file',
					},
					{
						name: 'Base64',
						value: 'base64',
						description: 'Return the merged PDF as a Base64-encoded string',
					},
				],
				default: 'url',
				description: 'Whether to return a URL or download the file',
				displayOptions: {
					show: {
						operation: ['mergePdf'],
					},
				},
			},

			// Split parameters
			{
				displayName: 'PDF URL',
				name: 'url',
				type: 'string',
				default: '',
				description: 'The PDF URL to split',
				displayOptions: {
					show: {
						operation: ['splitPdf'],
					},
				},
			},
			{
				displayName: 'Split Type',
				name: 'splitType',
				type: 'options',
				options: [
					{
						name: 'Specific Pages',
						value: 'pages',
						description: 'Extract specific pages',
					},
					{
						name: 'Each Page',
						value: 'each',
						description: 'Split PDF into individual pages',
					},
					{
						name: 'Chunks',
						value: 'chunks',
						description: 'Split PDF into multiple chunks',
					},
				],
				default: 'pages',
				description: 'How to split the PDF',
				displayOptions: {
					show: {
						operation: ['splitPdf'],
					},
				},
			},
			{
				displayName: 'Pages',
				name: 'pages',
				type: 'string',
				default: '',
				placeholder: '1-3,5',
				description: 'Pages to extract (e.g., "1-3,5" or comma-separated page numbers)',
				displayOptions: {
					show: {
						operation: ['splitPdf'],
						splitType: ['pages'],
					},
				},
			},
			{
				displayName: 'Number of Chunks',
				name: 'chunks',
				type: 'number',
				default: 2,
				description: 'Number of chunks to split the PDF into',
				displayOptions: {
					show: {
						operation: ['splitPdf'],
						splitType: ['chunks'],
					},
				},
			},
			{
				displayName: 'Output Format',
				name: 'output',
				type: 'options',
				options: [
					{
						name: 'URL',
						value: 'url',
						description: 'Return URLs to the split PDF(s)',
					},
					{
						name: 'File/ZIP',
						value: 'file',
						description: 'Download the split PDF(s) as file or ZIP',
					},
					{
						name: 'Base64',
						value: 'base64',
						description: 'Return the split PDF(s) as Base64-encoded string(s)',
					},
				],
				default: 'url',
				description: 'Whether to return URLs or download files',
				displayOptions: {
					show: {
						operation: ['splitPdf'],
					},
				},
			},

			// Properties for Parse PDF
			{
				displayName: 'PDF URL',
				name: 'parse_url',
				type: 'string',
				default: '',
				description: 'URL of the PDF to parse',
				displayOptions: {
					show: {
						operation: ['parsePdf'],
					},
				},
			},
			{
				displayName: 'Parse Mode',
				name: 'parse_mode',
				type: 'options',
				options: [
					{ name: 'Text Only', value: 'text', description: 'Extract text only' },
					{ name: 'Layout', value: 'layout', description: 'Text + text blocks with bounding boxes' },
					{ name: 'Tables', value: 'tables', description: 'Text + table blocks' },
					{ name: 'Full', value: 'full', description: 'Text + blocks + tables + images' },
				],
				default: 'text',
				description: 'What to extract from the PDF',
				displayOptions: {
					show: {
						operation: ['parsePdf'],
					},
				},
			},
			{
				displayName: 'Pages',
				name: 'parse_pages',
				type: 'string',
				default: 'all',
				description: 'Page selection: "all" or a range like "1-3" or single page like "2"',
				displayOptions: {
					show: {
						operation: ['parsePdf'],
					},
				},
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const prepareBinaryResponse = async (
			itemIndex: number,
			responseData: { body: ArrayBuffer; headers?: Record<string, unknown> },
			fallbackFileName: string,
			fallbackMimeType: string,
		) => {
			const headers = responseData.headers ?? {};
			const contentTypeHeader =
				(typeof headers['content-type'] === 'string' ? headers['content-type'] : undefined) ??
				(typeof headers['Content-Type'] === 'string' ? headers['Content-Type'] : undefined);

			const contentType = contentTypeHeader?.split(';')[0]?.trim() || fallbackMimeType;
			let fileName = fallbackFileName;

			if (!fileName) {
				fileName = 'output';
			}

			if (!fileName.includes('.') && contentType.includes('/')) {
				const ext = contentType.includes('pdf')
					? 'pdf'
					: contentType.includes('zip')
						? 'zip'
						: 'bin';
				fileName = `${fileName}.${ext}`;
			}

			const binaryData = await this.helpers.prepareBinaryData(
				Buffer.from(responseData.body),
				fileName,
				contentType,
			);

			returnData.push({
				json: { success: true },
				binary: { data: binaryData },
				pairedItem: { item: itemIndex },
			});
		};

		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i) as string;

				if (operation === 'htmlToPdf' || operation === 'urlToPdf') {
					const outputFormat = this.getNodeParameter('output_format', i) as string;
					const outputFilename = this.getNodeParameter('output_filename', i) as string;
					const timeoutSeconds = this.getNodeParameter('timeout', i) as number;
					const timeout = timeoutSeconds * 1000;
					const body: Record<string, unknown> = { output_filename: outputFilename };

					if (operation === 'htmlToPdf') {
						body.html_content = this.getNodeParameter('html_content', i) as string;
						body.css_content = this.getNodeParameter('css_content', i) as string;
						body.viewPortWidth = this.getNodeParameter('viewPortWidth', i) as number;
						body.viewPortHeight = this.getNodeParameter('viewPortHeight', i) as number;
						body.output_format = outputFormat;

						const dynamicParams = this.getNodeParameter('dynamic_params', i, {}) as {
							params?: Array<{ key?: string; value?: string }>;
						};

						if (dynamicParams.params?.length) {
							const mapped = dynamicParams.params
								.filter((p) => (p.key ?? '') !== '')
								.map((p) => ({ [p.key as string]: p.value ?? '' }));

							if (mapped.length) {
								body.dynamic_params = mapped;
							}
						}
					} else {
						body.url = this.getNodeParameter('url_to_pdf', i) as string;
						body.full_page = this.getNodeParameter('full_page', i) as boolean;
						body.wait_till = this.getNodeParameter('wait_till', i) as number;
						body.viewPortWidth = this.getNodeParameter('viewPortWidth', i) as number;
						body.viewPortHeight = this.getNodeParameter('viewPortHeight', i) as number;
						body.output_format = outputFormat;
					}

					if (outputFormat === 'file') {
						const responseData = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'pdfapihubApi',
							{
								method: 'POST',
								url: 'https://pdfapihub.com/api/v1/generatePdf',
								body,
								json: true,
								encoding: 'arraybuffer',
								returnFullResponse: true,
								timeout,
							},
						);

						await prepareBinaryResponse(
							i,
							responseData as { body: ArrayBuffer; headers?: Record<string, unknown> },
							`${outputFilename}.pdf`,
							'application/pdf',
						);
					} else {
						const responseData = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'pdfapihubApi',
							{
								method: 'POST',
								url: 'https://pdfapihub.com/api/v1/generatePdf',
								body,
								json: true,
								timeout,
							},
						);
						returnData.push({ json: responseData, pairedItem: { item: i } });
					}
				} else if (operation === 'mergePdf') {
					const output = this.getNodeParameter('output', i) as string;
					const mergeInputType = this.getNodeParameter('merge_input_type', i) as string;

					const isFileInput = mergeInputType === 'file';
					const body = !isFileInput
						? {
								urls: this.getNodeParameter('urls', i) as string[],
								output,
							}
						: undefined;

					let fileInputBody: { files: string[]; output: string } | undefined;
					if (isFileInput) {
						const binaryPropertyNames = this.getNodeParameter(
							'merge_files_binary_properties',
							i,
						) as string[];

						if (!binaryPropertyNames?.length) {
							throw new NodeOperationError(
								this.getNode(),
								'Please provide at least one Binary Property Name',
								{ itemIndex: i },
							);
						}

						const files: string[] = [];
						for (const propertyName of binaryPropertyNames) {
							this.helpers.assertBinaryData(i, propertyName);
							const buffer = await this.helpers.getBinaryDataBuffer(i, propertyName);
							files.push(Buffer.from(buffer).toString('base64'));
						}

						fileInputBody = { files, output };
					}

					if (output === 'file') {
						const responseData = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'pdfapihubApi',
							{
								method: 'POST',
								url: 'https://pdfapihub.com/api/v1/pdf/merge',
								...(isFileInput
									? { body: fileInputBody as Record<string, unknown>, json: true }
									: { body, json: true }),
								encoding: 'arraybuffer',
								returnFullResponse: true,
							},
						);

						await prepareBinaryResponse(
							i,
							responseData as { body: ArrayBuffer; headers?: Record<string, unknown> },
							'merged.pdf',
							'application/pdf',
						);
					} else {
						const responseData = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'pdfapihubApi',
							{
								method: 'POST',
								url: 'https://pdfapihub.com/api/v1/pdf/merge',
								...(isFileInput
									? { body: fileInputBody as Record<string, unknown>, json: true }
									: { body, json: true }),
							},
						);
						returnData.push({ json: responseData, pairedItem: { item: i } });
					}
				} else if (operation === 'splitPdf') {
					const pdfUrl = this.getNodeParameter('url', i) as string;
					const splitType = this.getNodeParameter('splitType', i) as string;
					const output = this.getNodeParameter('output', i) as string;

					const body: Record<string, unknown> = { url: pdfUrl, output };

					if (splitType === 'pages') {
						const pages = this.getNodeParameter('pages', i) as string;
						body.pages = pages;
					} else if (splitType === 'each') {
						body.mode = 'each';
					} else if (splitType === 'chunks') {
						const chunks = this.getNodeParameter('chunks', i) as number;
						body.chunks = chunks;
					}

					if (output === 'file') {
						const responseData = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'pdfapihubApi',
							{
								method: 'POST',
								url: 'https://pdfapihub.com/api/v1/pdf/split',
								body,
								json: true,
								encoding: 'arraybuffer',
								returnFullResponse: true,
							},
						);

						await prepareBinaryResponse(
							i,
							responseData as { body: ArrayBuffer; headers?: Record<string, unknown> },
							'split',
							'application/octet-stream',
						);
					} else {
						const responseData = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'pdfapihubApi',
							{
								method: 'POST',
								url: 'https://pdfapihub.com/api/v1/pdf/split',
								body,
								json: true,
							},
						);
						returnData.push({ json: responseData, pairedItem: { item: i } });
					}
				} else if (operation === 'compressPdf') {
					const pdfUrl = this.getNodeParameter('compress_url', i) as string;
					const compression = this.getNodeParameter('compression', i) as string;
					const outputType = this.getNodeParameter('compress_output', i) as string;
					const outputName = this.getNodeParameter('compress_output_name', i) as string;

					const body = {
						url: pdfUrl,
						compression,
						output: outputType,
						output_name: outputName,
					};

					if (outputType === 'file') {
						const responseData = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'pdfapihubApi',
							{
								method: 'POST',
								url: 'https://pdfapihub.com/api/v1/compressPdf',
								body,
								json: true,
								encoding: 'arraybuffer',
								returnFullResponse: true,
							},
						);

						await prepareBinaryResponse(
							i,
							responseData as { body: ArrayBuffer; headers?: Record<string, unknown> },
							outputName,
							'application/pdf',
						);
					} else {
						const responseData = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'pdfapihubApi',
							{
								method: 'POST',
								url: 'https://pdfapihub.com/api/v1/compressPdf',
								body,
								json: true,
							},
						);
						returnData.push({ json: responseData, pairedItem: { item: i } });
					}
				} else if (operation === 'lockPdf') {
					const pdfUrl = this.getNodeParameter('lock_url', i) as string;
					const password = this.getNodeParameter('lock_password', i) as string;
					const inputPassword = this.getNodeParameter('lock_input_password', i, '') as string;
					const outputType = this.getNodeParameter('lock_output', i) as string;
					const outputName = this.getNodeParameter('lock_output_name', i) as string;

					const body: Record<string, unknown> = {
						url: pdfUrl,
						password,
						output: outputType,
						output_name: outputName,
					};

					if (inputPassword) {
						body.input_password = inputPassword;
					}

					if (outputType === 'file') {
						const responseData = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'pdfapihubApi',
							{
								method: 'POST',
								url: 'https://pdfapihub.com/api/v1/lockPdf',
								body,
								json: true,
								encoding: 'arraybuffer',
								returnFullResponse: true,
							},
						);

						await prepareBinaryResponse(
							i,
							responseData as { body: ArrayBuffer; headers?: Record<string, unknown> },
							outputName,
							'application/pdf',
						);
					} else {
						const responseData = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'pdfapihubApi',
							{
								method: 'POST',
								url: 'https://pdfapihub.com/api/v1/lockPdf',
								body,
								json: true,
							},
						);
						returnData.push({ json: responseData, pairedItem: { item: i } });
					}
				} else if (operation === 'unlockPdf') {
					const pdfUrl = this.getNodeParameter('unlock_url', i) as string;
					const password = this.getNodeParameter('unlock_password', i) as string;
					const outputType = this.getNodeParameter('unlock_output', i) as string;
					const outputName = this.getNodeParameter('unlock_output_name', i) as string;

					const body = {
						url: pdfUrl,
						password,
						output: outputType,
						output_name: outputName,
					};

					if (outputType === 'file') {
						const responseData = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'pdfapihubApi',
							{
								method: 'POST',
								url: 'https://pdfapihub.com/api/v1/unlockPdf',
								body,
								json: true,
								encoding: 'arraybuffer',
								returnFullResponse: true,
							},
						);

						await prepareBinaryResponse(
							i,
							responseData as { body: ArrayBuffer; headers?: Record<string, unknown> },
							outputName,
							'application/pdf',
						);
					} else {
						const responseData = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'pdfapihubApi',
							{
								method: 'POST',
								url: 'https://pdfapihub.com/api/v1/unlockPdf',
								body,
								json: true,
							},
						);
						returnData.push({ json: responseData, pairedItem: { item: i } });
					}
				} else if (operation === 'parsePdf') {
					const pdfUrl = this.getNodeParameter('parse_url', i) as string;
					const mode = this.getNodeParameter('parse_mode', i) as string;
					const pages = this.getNodeParameter('parse_pages', i) as string;

					const body = { url: pdfUrl, mode, pages };
					const responseData = await this.helpers.httpRequestWithAuthentication.call(
						this,
						'pdfapihubApi',
						{
							method: 'POST',
							url: 'https://pdfapihub.com/api/v1/pdf/parse',
							body,
							json: true,
						},
					);
					returnData.push({ json: responseData, pairedItem: { item: i } });
				} else {
					throw new NodeOperationError(this.getNode(), `Unsupported operation: ${operation}`, {
						itemIndex: i,
					});
				}
			} catch (error) {
				if (this.continueOnFail()) {
					const message = error instanceof Error ? error.message : 'Unknown error';
					returnData.push({ json: { error: message }, pairedItem: { item: i } });
				} else {
					throw new NodeOperationError(this.getNode(), error, { itemIndex: i });
				}
			}
		}

		return [returnData];
	}
}