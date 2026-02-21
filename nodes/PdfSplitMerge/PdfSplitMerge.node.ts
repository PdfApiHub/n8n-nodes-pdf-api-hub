import type {
	IExecuteFunctions,
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

export class PdfSplitMerge implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'PDF API Hub',
		name: 'pdfSplitMerge',
		icon: { light: 'file:../../icons/pdfhub.light.svg', dark: 'file:../../icons/pdfhub.dark.svg' },
		group: ['transform'],
		version: 1,
		description:
			'PDF and image tools: merge/split/compress, OCR, convert, lock/unlock, watermark, and URL/HTML processing.',
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
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Image to PDF',
						value: 'imageToPdf',
						description: 'Convert images (PNG, WebP, JPG) to PDF',
					},
					{
						name: 'OCR to Searchable Text (PDF/Image)',
						value: 'ocrParsing',
						description: 'Extract searchable text from scanned PDFs/images',
					},
					{
						name: 'PDF Merge / Split / Compress',
						value: 'pdfManipulation',
						description: 'Merge, split, or compress PDF documents',
					},
					{
						name: 'PDF Parse / Extract Text',
						value: 'pdfParsing',
						description: 'Extract text or structured data from PDFs',
					},
					{
						name: 'PDF Security (Lock / Unlock)',
						value: 'pdfSecurity',
						description: 'Lock and unlock password-protected PDFs',
					},
					{
						name: 'PDF to Image',
						value: 'pdfToImage',
						description: 'Convert PDF pages to images (PNG, WebP)',
					},
					{
						name: 'URL to HTML',
						value: 'urlToHtml',
						description: 'Fetch HTML content from a URL',
					},
					{
						name: 'Watermark PDF',
						value: 'watermark',
						description: 'Add watermark to PDF or image',
					},
					{
						name: 'Website / HTML to Image',
						value: 'imageGeneration',
						description: 'Capture a website screenshot to image or render HTML/CSS to image',
					},
					{
						name: 'Website / HTML to PDF',
						value: 'pdfCreation',
						description: 'Capture a website screenshot to PDF or render HTML/CSS to PDF',
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
			// Image Generation Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['imageGeneration'],
					},
				},
				options: [
					{
						name: 'URL to Image',
						value: 'urlToImage',
						description: 'Capture website screenshot as image',
						action: 'Capture a screenshot of a website as an image',
					},
					{
						name: 'HTML to Image',
						value: 'htmlToImage',
						description: 'Generate image from HTML/CSS',
						action: 'Convert HTML to image',
					},
				],
				default: 'urlToImage',
			},
			// OCR Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['ocrParsing'],
					},
				},
				options: [
					{
						name: 'PDF OCR Parse',
						value: 'pdfOcrParse',
						description: 'Extract text from scanned PDF using OCR',
						action: 'Ocr parse a pdf document',
					},
					{
						name: 'Image OCR Parse',
						value: 'imageOcrParse',
						description: 'Extract text from image using OCR',
						action: 'Ocr parse an image',
					},
				],
				default: 'pdfOcrParse',
			},
			// Image to PDF Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['imageToPdf'],
					},
				},
				options: [
					{
						name: 'PNG to PDF',
						value: 'pngToPdf',
						description: 'Convert PNG image(s) to PDF',
						action: 'Convert PNG images to PDF',
					},
					{
						name: 'WebP to PDF',
						value: 'webpToPdf',
						description: 'Convert WebP image(s) to PDF',
						action: 'Convert web p images to pdf',
					},
					{
						name: 'JPG to PDF',
						value: 'jpgToPdf',
						description: 'Convert JPG image(s) to PDF',
						action: 'Convert JPG images to PDF',
					},
				],
				default: 'pngToPdf',
			},
			// PDF to Image Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['pdfToImage'],
					},
				},
				options: [
					{
						name: 'PDF to PNG',
						value: 'pdfToPng',
						description: 'Convert PDF pages to PNG images',
						action: 'Convert PDF to PNG images',
					},
					{
						name: 'PDF to WebP',
						value: 'pdfToWebp',
						description: 'Convert PDF pages to WebP images',
						action: 'Convert pdf to web p images',
					},
					{
						name: 'PDF to JPG',
						value: 'pdfToJpg',
						description: 'Convert PDF pages to JPG images',
						action: 'Convert PDF to JPG images',
					},
				],
				default: 'pdfToPng',
			},
			// URL to HTML Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['urlToHtml'],
					},
				},
				options: [
					{
						name: 'Fetch HTML',
						value: 'fetchHtml',
						description: 'Fetch HTML content from a URL',
						action: 'Fetch HTML content from a URL',
					},
				],
				default: 'fetchHtml',
			},
			// Watermark Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['watermark'],
					},
				},
				options: [
					{
						name: 'Add Watermark',
						value: 'addWatermark',
						description: 'Add diagonal text watermark to PDF or image',
						action: 'Add watermark to PDF or image',
					},
				],
				default: 'addWatermark',
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
						action: 'Merge multiple pdfs into a single pdf',
					},
					{
						name: 'Split PDF',
						value: 'splitPdf',
						description: 'Split a PDF into multiple files',
						action: 'Split a PDF into multiple files',
					},
					{
						name: 'Compress PDF',
						value: 'compressPdf',
						description: 'Compress a PDF to reduce file size',
						action: 'Reduce size of pdf file',
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
						action: 'Password protect a pdf file',
					},
					{
						name: 'Unlock PDF',
						value: 'unlockPdf',
						description: 'Remove password protection from a PDF',
						action: 'Remove password protection from PDF',
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

			// =====================================================
			// IMAGE GENERATION PROPERTIES (HTML to Image, URL to Image)
			// =====================================================
			{
				displayName: 'URL',
				name: 'image_gen_url',
				type: 'string',
				default: '',
				description: 'The URL of the website to capture as image',
				displayOptions: {
					show: {
						operation: ['urlToImage'],
					},
				},
			},
			{
				displayName: 'HTML Content',
				name: 'image_html_content',
				type: 'string',
				default: '',
				description: 'HTML content to render as image',
				displayOptions: {
					show: {
						operation: ['htmlToImage'],
					},
				},
			},
			{
				displayName: 'CSS Content',
				name: 'image_css_content',
				type: 'string',
				default: '',
				description: 'CSS to style the HTML',
				displayOptions: {
					show: {
						operation: ['htmlToImage'],
					},
				},
			},
			{
				displayName: 'Output Format',
				name: 'image_output_format',
				type: 'options',
				options: [
					{ name: 'URL', value: 'url' },
					{ name: 'Base64', value: 'base64' },
					{ name: 'Both', value: 'both' },
					{ name: 'File', value: 'file' },
				],
				default: 'url',
				description: 'Format of the output image',
				displayOptions: {
					show: {
						operation: ['htmlToImage', 'urlToImage'],
					},
				},
			},
			{
				displayName: 'Width',
				name: 'image_width',
				type: 'number',
				default: 1280,
				description: 'Width of the output image in pixels',
				displayOptions: {
					show: {
						operation: ['htmlToImage', 'urlToImage'],
					},
				},
			},
			{
				displayName: 'Height',
				name: 'image_height',
				type: 'number',
				default: 720,
				description: 'Height of the output image in pixels',
				displayOptions: {
					show: {
						operation: ['htmlToImage', 'urlToImage'],
					},
				},
			},
			{
				displayName: 'Viewport Width',
				name: 'image_viewport_width',
				type: 'number',
				default: 1920,
				description: 'Viewport width for rendering',
				displayOptions: {
					show: {
						operation: ['htmlToImage', 'urlToImage'],
					},
				},
			},
			{
				displayName: 'Viewport Height',
				name: 'image_viewport_height',
				type: 'number',
				default: 1080,
				description: 'Viewport height for rendering',
				displayOptions: {
					show: {
						operation: ['htmlToImage', 'urlToImage'],
					},
				},
			},
			{
				displayName: 'Device Scale Factor',
				name: 'image_device_scale',
				type: 'number',
				default: 1,
				description: 'Device scale factor for higher resolution (1-3)',
				displayOptions: {
					show: {
						operation: ['htmlToImage', 'urlToImage'],
					},
				},
			},
			{
				displayName: 'Quality',
				name: 'image_quality',
				type: 'number',
				default: 80,
				description: 'Image quality (30-100)',
				displayOptions: {
					show: {
						operation: ['htmlToImage', 'urlToImage'],
					},
				},
			},
			{
				displayName: 'Full Page',
				name: 'image_full_page',
				type: 'boolean',
				default: false,
				description: 'Whether to capture the full page (for URLs only)',
				displayOptions: {
					show: {
						operation: ['urlToImage'],
					},
				},
			},
			{
				displayName: 'Wait Time (Seconds)',
				name: 'image_wait_till',
				type: 'number',
				default: 0,
				description: 'Time to wait in seconds before capturing',
				displayOptions: {
					show: {
						operation: ['urlToImage'],
					},
				},
			},
			{
				displayName: 'Wait Until',
				name: 'image_wait_until',
				type: 'options',
				options: [
					{ name: 'Load', value: 'load' },
					{ name: 'DOM Content Loaded', value: 'domcontentloaded' },
					{ name: 'Network Idle', value: 'networkidle' },
				],
				default: 'load',
				description: 'When to consider navigation successful',
				displayOptions: {
					show: {
						operation: ['urlToImage'],
					},
				},
			},
			{
				displayName: 'Google Font',
				name: 'image_font',
				type: 'string',
				default: '',
				description: 'Google Font name(s) to include (use | separator for multiple)',
				displayOptions: {
					show: {
						operation: ['htmlToImage'],
					},
				},
			},
			{
				displayName: 'Dynamic Params',
				name: 'image_dynamic_params',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				default: {},
				description: 'Dynamic parameters to replace in HTML',
				displayOptions: {
					show: {
						operation: ['htmlToImage'],
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
								description: 'Placeholder key',
							},
							{
								displayName: 'Value',
								name: 'value',
								type: 'string',
								default: '',
								description: 'Replacement value',
							},
						],
					},
				],
			},

			// =====================================================
			// OCR PROPERTIES (PDF OCR Parse, Image OCR Parse)
			// =====================================================
			{
				displayName: 'PDF URL',
				name: 'ocr_pdf_url',
				type: 'string',
				default: '',
				description: 'URL of the PDF to OCR parse',
				displayOptions: {
					show: {
						operation: ['pdfOcrParse'],
					},
				},
			},
			{
				displayName: 'Pages',
				name: 'ocr_pages',
				type: 'string',
				default: 'all',
				description: 'Page selection: "all", a range like "1-3", or comma list like "1,3,5-7"',
				displayOptions: {
					show: {
						operation: ['pdfOcrParse'],
					},
				},
			},
			{
				displayName: 'Image URL',
				name: 'ocr_image_url',
				type: 'string',
				default: '',
				description: 'URL of the image to OCR parse',
				displayOptions: {
					show: {
						operation: ['imageOcrParse'],
					},
				},
			},
			{
				displayName: 'Base64 Image',
				name: 'ocr_base64_image',
				type: 'string',
				default: '',
				description: 'Base64 image string (plain or data URL) - alternative to URL',
				displayOptions: {
					show: {
						operation: ['imageOcrParse'],
					},
				},
			},
			{
				displayName: 'Language',
				name: 'ocr_lang',
				type: 'string',
				default: 'eng',
				description: 'OCR language code(s), for example "eng" or "eng+hin"',
				displayOptions: {
					show: {
						operation: ['pdfOcrParse', 'imageOcrParse'],
					},
				},
			},
			{
				displayName: 'DPI',
				name: 'ocr_dpi',
				type: 'number',
				default: 200,
				description: 'Rasterization DPI before OCR (72-400)',
				displayOptions: {
					show: {
						operation: ['pdfOcrParse'],
					},
				},
			},
			{
				displayName: 'Page Segmentation Mode (PSM)',
				name: 'ocr_psm',
				type: 'number',
				default: 3,
				description: 'Page segmentation mode (0-13)',
				displayOptions: {
					show: {
						operation: ['pdfOcrParse', 'imageOcrParse'],
					},
				},
			},
			{
				displayName: 'OCR Engine Mode (OEM)',
				name: 'ocr_oem',
				type: 'number',
				default: 3,
				description: 'OCR engine mode (0-3)',
				displayOptions: {
					show: {
						operation: ['pdfOcrParse', 'imageOcrParse'],
					},
				},
			},

			// =====================================================
			// IMAGE TO PDF PROPERTIES
			// =====================================================
			{
				displayName: 'Input Type',
				name: 'img2pdf_input_type',
				type: 'options',
				options: [
					{ name: 'URL(s)', value: 'url' },
					{ name: 'Base64', value: 'base64' },
					{ name: 'File (Binary)', value: 'file' },
				],
				default: 'url',
				description: 'How to provide the image(s)',
				displayOptions: {
					show: {
						operation: ['pngToPdf', 'webpToPdf', 'jpgToPdf'],
					},
				},
			},
			{
				displayName: 'Image URLs',
				name: 'img2pdf_urls',
				type: 'string',
				typeOptions: {
					multipleValues: true,
				},
				default: [],
				description: 'Array of image URLs to convert (max 100)',
				placeholder: 'https://example.com/image.png',
				displayOptions: {
					show: {
						operation: ['pngToPdf', 'webpToPdf', 'jpgToPdf'],
						img2pdf_input_type: ['url'],
					},
				},
			},
			{
				displayName: 'Base64 Image(s)',
				name: 'img2pdf_base64',
				type: 'string',
				typeOptions: {
					multipleValues: true,
				},
				default: [],
				description: 'Base64 image payload(s)',
				displayOptions: {
					show: {
						operation: ['pngToPdf', 'webpToPdf', 'jpgToPdf'],
						img2pdf_input_type: ['base64'],
					},
				},
			},
			{
				displayName: 'Binary Property Names',
				name: 'img2pdf_binary_properties',
				type: 'string',
				typeOptions: {
					multipleValues: true,
				},
				default: ['data'],
				description: 'Binary property names containing images to convert',
				displayOptions: {
					show: {
						operation: ['pngToPdf', 'webpToPdf', 'jpgToPdf'],
						img2pdf_input_type: ['file'],
					},
				},
			},
			{
				displayName: 'Output Format',
				name: 'img2pdf_output',
				type: 'options',
				options: [
					{ name: 'URL', value: 'url' },
					{ name: 'Base64', value: 'base64' },
					{ name: 'Both', value: 'both' },
					{ name: 'File', value: 'file' },
				],
				default: 'url',
				description: 'Format of the output PDF',
				displayOptions: {
					show: {
						operation: ['pngToPdf', 'webpToPdf', 'jpgToPdf'],
					},
				},
			},
			{
				displayName: 'Output Filename',
				name: 'img2pdf_output_filename',
				type: 'string',
				default: 'converted.pdf',
				description: 'Filename for the output PDF',
				displayOptions: {
					show: {
						operation: ['pngToPdf', 'webpToPdf', 'jpgToPdf'],
					},
				},
			},

			// =====================================================
			// PDF TO IMAGE PROPERTIES
			// =====================================================
			{
				displayName: 'PDF URL',
				name: 'pdf2img_url',
				type: 'string',
				default: '',
				description: 'URL of the PDF to convert',
				displayOptions: {
					show: {
						operation: ['pdfToPng', 'pdfToWebp', 'pdfToJpg'],
					},
				},
			},
			{
				displayName: 'Pages',
				name: 'pdf2img_pages',
				type: 'string',
				default: '1',
				description: 'Page(s) to convert: single number like "1", range like "1-3", or comma list',
				displayOptions: {
					show: {
						operation: ['pdfToPng', 'pdfToWebp', 'pdfToJpg'],
					},
				},
			},
			{
				displayName: 'DPI',
				name: 'pdf2img_dpi',
				type: 'number',
				default: 150,
				description: 'Output image DPI (72-300)',
				displayOptions: {
					show: {
						operation: ['pdfToPng', 'pdfToWebp', 'pdfToJpg'],
					},
				},
			},
			{
				displayName: 'Quality',
				name: 'pdf2img_quality',
				type: 'number',
				default: 85,
				description: 'Image quality (1-100)',
				displayOptions: {
					show: {
						operation: ['pdfToPng', 'pdfToWebp', 'pdfToJpg'],
					},
				},
			},
			{
				displayName: 'Output Format',
				name: 'pdf2img_output',
				type: 'options',
				options: [
					{ name: 'URL', value: 'url' },
					{ name: 'Base64', value: 'base64' },
					{ name: 'Both', value: 'both' },
					{ name: 'File', value: 'file' },
				],
				default: 'url',
				description: 'Format of the output',
				displayOptions: {
					show: {
						operation: ['pdfToPng', 'pdfToWebp', 'pdfToJpg'],
					},
				},
			},

			// =====================================================
			// URL TO HTML PROPERTIES
			// =====================================================
			{
				displayName: 'URL',
				name: 'html_fetch_url',
				type: 'string',
				default: '',
				description: 'URL to fetch HTML from',
				displayOptions: {
					show: {
						operation: ['fetchHtml'],
					},
				},
			},
			{
				displayName: 'Wait Until',
				name: 'html_wait_till',
				type: 'options',
				options: [
					{ name: 'Load', value: 'load' },
					{ name: 'DOM Content Loaded', value: 'domcontentloaded' },
					{ name: 'Network Idle', value: 'networkidle' },
				],
				default: 'load',
				description: 'When to consider navigation successful',
				displayOptions: {
					show: {
						operation: ['fetchHtml'],
					},
				},
			},
			{
				displayName: 'Timeout (Ms)',
				name: 'html_timeout',
				type: 'number',
				default: 30000,
				description: 'Maximum wait time in milliseconds',
				displayOptions: {
					show: {
						operation: ['fetchHtml'],
					},
				},
			},
			{
				displayName: 'Wait For Selector',
				name: 'html_wait_for_selector',
				type: 'string',
				default: '',
				description: 'CSS selector to wait for before returning HTML',
				displayOptions: {
					show: {
						operation: ['fetchHtml'],
					},
				},
			},
			{
				displayName: 'Additional Wait (Ms)',
				name: 'html_wait_for_timeout',
				type: 'number',
				default: 0,
				description: 'Additional wait time in milliseconds after page load',
				displayOptions: {
					show: {
						operation: ['fetchHtml'],
					},
				},
			},
			{
				displayName: 'Viewport Width',
				name: 'html_viewport_width',
				type: 'number',
				default: 1920,
				displayOptions: {
					show: {
						operation: ['fetchHtml'],
					},
				},
			},
			{
				displayName: 'Viewport Height',
				name: 'html_viewport_height',
				type: 'number',
				default: 1080,
				displayOptions: {
					show: {
						operation: ['fetchHtml'],
					},
				},
			},
			{
				displayName: 'User Agent',
				name: 'html_user_agent',
				type: 'string',
				default: '',
				description: 'Custom user agent string',
				displayOptions: {
					show: {
						operation: ['fetchHtml'],
					},
				},
			},

			// =====================================================
			// WATERMARK PROPERTIES
			// =====================================================
			{
				displayName: 'Input Type',
				name: 'watermark_input_type',
				type: 'options',
				options: [
					{ name: 'URL', value: 'url' },
					{ name: 'Base64', value: 'base64' },
					{ name: 'File (Binary)', value: 'file' },
				],
				default: 'url',
				description: 'How to provide the file to watermark',
				displayOptions: {
					show: {
						operation: ['addWatermark'],
					},
				},
			},
			{
				displayName: 'File URL',
				name: 'watermark_url',
				type: 'string',
				default: '',
				description: 'URL of the PDF or image to watermark',
				displayOptions: {
					show: {
						operation: ['addWatermark'],
						watermark_input_type: ['url'],
					},
				},
			},
			{
				displayName: 'Base64 File',
				name: 'watermark_base64',
				type: 'string',
				default: '',
				description: 'Base64-encoded file contents',
				displayOptions: {
					show: {
						operation: ['addWatermark'],
						watermark_input_type: ['base64'],
					},
				},
			},
			{
				displayName: 'Binary Property Name',
				name: 'watermark_binary_property',
				type: 'string',
				default: 'data',
				description: 'Binary property name containing the file',
				displayOptions: {
					show: {
						operation: ['addWatermark'],
						watermark_input_type: ['file'],
					},
				},
			},
			{
				displayName: 'Watermark Text',
				name: 'watermark_text',
				type: 'string',
				default: 'CONFIDENTIAL',
				description: 'Text to use as watermark',
				displayOptions: {
					show: {
						operation: ['addWatermark'],
					},
				},
			},
			{
				displayName: 'Opacity',
				name: 'watermark_opacity',
				type: 'number',
				default: 0.15,
				description: 'Watermark opacity (0.0 to 1.0)',
				displayOptions: {
					show: {
						operation: ['addWatermark'],
					},
				},
			},
			{
				displayName: 'Angle',
				name: 'watermark_angle',
				type: 'number',
				default: 30,
				description: 'Rotation angle in degrees',
				displayOptions: {
					show: {
						operation: ['addWatermark'],
					},
				},
			},
			{
				displayName: 'Font Size',
				name: 'watermark_font_size',
				type: 'number',
				default: 0,
				description: 'Font size (0 for auto)',
				displayOptions: {
					show: {
						operation: ['addWatermark'],
					},
				},
			},
			{
				displayName: 'Output Format',
				name: 'watermark_output',
				type: 'options',
				options: [
					{ name: 'File', value: 'file' },
					{ name: 'URL', value: 'url' },
					{ name: 'Base64', value: 'base64' },
					{ name: 'Both', value: 'both' },
				],
				default: 'file',
				description: 'Format of the watermarked output',
				displayOptions: {
					show: {
						operation: ['addWatermark'],
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

					let multipartBody: Buffer | undefined;
					let multipartBoundary: string | undefined;
					if (isFileInput) {
						const binaryPropertyNamesParam = this.getNodeParameter(
							'merge_files_binary_properties',
							i,
						) as unknown;

						const binaryPropertyNames = (
							Array.isArray(binaryPropertyNamesParam)
								? binaryPropertyNamesParam
								: [binaryPropertyNamesParam]
						)
							.map((v) => String(v ?? '').trim())
							.filter((v) => v !== '');

						if (!binaryPropertyNames.length) {
							throw new NodeOperationError(
								this.getNode(),
								'Please provide at least one Binary Property Name',
								{ itemIndex: i },
							);
						}

						multipartBoundary = `----n8nFormBoundary${Math.random().toString(36).slice(2)}`;
						const parts: Buffer[] = [];

						for (const propertyName of binaryPropertyNames) {
							const binaryData = this.helpers.assertBinaryData(i, propertyName);
							const binaryDataBuffer = await this.helpers.getBinaryDataBuffer(i, propertyName);
							const fileName = binaryData.fileName ?? 'file.pdf';
							const contentType = binaryData.mimeType ?? 'application/pdf';

							parts.push(
								Buffer.from(
									`--${multipartBoundary}\r\n` +
										`Content-Disposition: form-data; name="files"; filename="${fileName}"\r\n` +
										`Content-Type: ${contentType}\r\n\r\n`,
								),
							);
							parts.push(Buffer.from(binaryDataBuffer));
							parts.push(Buffer.from('\r\n'));
						}

						parts.push(
							Buffer.from(
								`--${multipartBoundary}\r\n` +
									'Content-Disposition: form-data; name="output"\r\n\r\n' +
									`${output}\r\n`,
							),
						);
						parts.push(Buffer.from(`--${multipartBoundary}--\r\n`));

						multipartBody = Buffer.concat(parts);
					}

					if (output === 'file') {
						const responseData = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'pdfapihubApi',
							{
								method: 'POST',
								url: 'https://pdfapihub.com/api/v1/pdf/merge',
								...(isFileInput
									? {
											body: multipartBody as Buffer,
											headers: {
												'Content-Type': `multipart/form-data; boundary=${multipartBoundary}`,
											},
										}
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
									? {
											body: multipartBody as Buffer,
											headers: {
												'Content-Type': `multipart/form-data; boundary=${multipartBoundary}`,
											},
										}
									: { body, json: true }),
								returnFullResponse: true,
							},
						);

						const responseBody = (responseData as { body?: unknown }).body;
						if (typeof responseBody === 'string') {
							try {
								returnData.push({ json: JSON.parse(responseBody), pairedItem: { item: i } });
							} catch {
								returnData.push({ json: { raw: responseBody }, pairedItem: { item: i } });
							}
						} else if (Buffer.isBuffer(responseBody)) {
							const text = responseBody.toString('utf8');
							try {
								returnData.push({ json: JSON.parse(text), pairedItem: { item: i } });
							} catch {
								returnData.push({ json: { raw: text }, pairedItem: { item: i } });
							}
						} else {
							returnData.push({
								json: (responseBody ?? {}) as unknown as IDataObject,
								pairedItem: { item: i },
							});
						}
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
				}
				// =====================================================
				// IMAGE GENERATION (HTML to Image, URL to Image)
				// =====================================================
				else if (operation === 'htmlToImage' || operation === 'urlToImage') {
					const outputFormat = this.getNodeParameter('image_output_format', i) as string;
					const width = this.getNodeParameter('image_width', i) as number;
					const height = this.getNodeParameter('image_height', i) as number;
					const viewportWidth = this.getNodeParameter('image_viewport_width', i) as number;
					const viewportHeight = this.getNodeParameter('image_viewport_height', i) as number;
					const deviceScale = this.getNodeParameter('image_device_scale', i) as number;
					const quality = this.getNodeParameter('image_quality', i) as number;

					const body: Record<string, unknown> = {
						output_format: outputFormat,
						width,
						height,
						viewPortWidth: viewportWidth,
						viewPortHeight: viewportHeight,
						device_scale_factor: deviceScale,
						quality,
					};

					if (operation === 'htmlToImage') {
						body.html_content = this.getNodeParameter('image_html_content', i) as string;
						body.css_content = this.getNodeParameter('image_css_content', i, '') as string;
						const font = this.getNodeParameter('image_font', i, '') as string;
						if (font) body.font = font;

						const dynamicParams = this.getNodeParameter('image_dynamic_params', i, {}) as {
							params?: Array<{ key?: string; value?: string }>;
						};
						if (dynamicParams.params?.length) {
							const mapped: Record<string, string> = {};
							dynamicParams.params
								.filter((p) => (p.key ?? '') !== '')
								.forEach((p) => {
									mapped[p.key as string] = p.value ?? '';
								});
							if (Object.keys(mapped).length) {
								body.dynamic_params = mapped;
							}
						}
					} else {
						body.url = this.getNodeParameter('image_gen_url', i) as string;
						body.full_page = this.getNodeParameter('image_full_page', i) as boolean;
						body.wait_till = this.getNodeParameter('image_wait_till', i) as number;
						body.wait_until = this.getNodeParameter('image_wait_until', i) as string;
					}

					if (outputFormat === 'file') {
						const responseData = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'pdfapihubApi',
							{
								method: 'POST',
								url: 'https://pdfapihub.com/api/v1/generateImage',
								body,
								json: true,
								encoding: 'arraybuffer',
								returnFullResponse: true,
							},
						);
						await prepareBinaryResponse(
							i,
							responseData as { body: ArrayBuffer; headers?: Record<string, unknown> },
							'image.png',
							'image/png',
						);
					} else {
						const responseData = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'pdfapihubApi',
							{
								method: 'POST',
								url: 'https://pdfapihub.com/api/v1/generateImage',
								body,
								json: true,
							},
						);
						returnData.push({ json: responseData, pairedItem: { item: i } });
					}
				}
				// =====================================================
				// OCR OPERATIONS (PDF OCR Parse, Image OCR Parse)
				// =====================================================
				else if (operation === 'pdfOcrParse') {
					const pdfUrl = this.getNodeParameter('ocr_pdf_url', i) as string;
					const pages = this.getNodeParameter('ocr_pages', i) as string;
					const lang = this.getNodeParameter('ocr_lang', i) as string;
					const dpi = this.getNodeParameter('ocr_dpi', i) as number;
					const psm = this.getNodeParameter('ocr_psm', i) as number;
					const oem = this.getNodeParameter('ocr_oem', i) as number;

					const body = { url: pdfUrl, pages, lang, dpi, psm, oem };
					const responseData = await this.helpers.httpRequestWithAuthentication.call(
						this,
						'pdfapihubApi',
						{
							method: 'POST',
							url: 'https://pdfapihub.com/api/v1/pdf/ocr/parse',
							body,
							json: true,
						},
					);
					returnData.push({ json: responseData, pairedItem: { item: i } });
				} else if (operation === 'imageOcrParse') {
					const imageUrl = this.getNodeParameter('ocr_image_url', i, '') as string;
					const base64Image = this.getNodeParameter('ocr_base64_image', i, '') as string;
					const lang = this.getNodeParameter('ocr_lang', i) as string;
					const psm = this.getNodeParameter('ocr_psm', i) as number;
					const oem = this.getNodeParameter('ocr_oem', i) as number;

					const body: Record<string, unknown> = { lang, psm, oem };
					if (imageUrl) body.image_url = imageUrl;
					if (base64Image) body.base64_image = base64Image;

					const responseData = await this.helpers.httpRequestWithAuthentication.call(
						this,
						'pdfapihubApi',
						{
							method: 'POST',
							url: 'https://pdfapihub.com/api/v1/image/ocr/parse',
							body,
							json: true,
						},
					);
					returnData.push({ json: responseData, pairedItem: { item: i } });
				}
				// =====================================================
				// IMAGE TO PDF (PNG, WebP, JPG to PDF)
				// =====================================================
				else if (operation === 'pngToPdf' || operation === 'webpToPdf' || operation === 'jpgToPdf') {
					const inputType = this.getNodeParameter('img2pdf_input_type', i) as string;
					const outputFormat = this.getNodeParameter('img2pdf_output', i) as string;
					const outputFilename = this.getNodeParameter('img2pdf_output_filename', i) as string;

					let multipartBody: Buffer | undefined;
					let multipartBoundary: string | undefined;
					let body: Record<string, unknown> | undefined;

					if (inputType === 'file') {
						const binaryPropertyNamesParam = this.getNodeParameter('img2pdf_binary_properties', i) as unknown;
						const binaryPropertyNames = (
							Array.isArray(binaryPropertyNamesParam)
								? binaryPropertyNamesParam
								: [binaryPropertyNamesParam]
						)
							.map((v) => String(v ?? '').trim())
							.filter((v) => v !== '');

						if (!binaryPropertyNames.length) {
							throw new NodeOperationError(
								this.getNode(),
								'Please provide at least one Binary Property Name',
								{ itemIndex: i },
							);
						}

						multipartBoundary = `----n8nFormBoundary${Math.random().toString(36).slice(2)}`;
						const parts: Buffer[] = [];

						for (const propertyName of binaryPropertyNames) {
							const binaryData = this.helpers.assertBinaryData(i, propertyName);
							const binaryDataBuffer = await this.helpers.getBinaryDataBuffer(i, propertyName);
							const fileName = binaryData.fileName ?? 'image.png';
							const contentType = binaryData.mimeType ?? 'image/png';

							parts.push(
								Buffer.from(
									`--${multipartBoundary}\r\n` +
										`Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n` +
										`Content-Type: ${contentType}\r\n\r\n`,
								),
							);
							parts.push(Buffer.from(binaryDataBuffer));
							parts.push(Buffer.from('\r\n'));
						}

						parts.push(
							Buffer.from(
								`--${multipartBoundary}\r\n` +
									'Content-Disposition: form-data; name="output"\r\n\r\n' +
									`${outputFormat}\r\n`,
							),
						);
						if (outputFilename) {
							parts.push(
								Buffer.from(
									`--${multipartBoundary}\r\n` +
										'Content-Disposition: form-data; name="output_filename"\r\n\r\n' +
										`${outputFilename}\r\n`,
								),
							);
						}
						parts.push(Buffer.from(`--${multipartBoundary}--\r\n`));
						multipartBody = Buffer.concat(parts);
					} else if (inputType === 'url') {
						const urls = this.getNodeParameter('img2pdf_urls', i) as string[];
						body = { urls, output: outputFormat, output_filename: outputFilename };
					} else {
						const base64Images = this.getNodeParameter('img2pdf_base64', i) as string[];
						body = base64Images.length === 1
							? { image_base64: base64Images[0], output: outputFormat, output_filename: outputFilename }
							: { images_base64: base64Images, output: outputFormat, output_filename: outputFilename };
					}

					if (outputFormat === 'file') {
						const responseData = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'pdfapihubApi',
							{
								method: 'POST',
								url: 'https://pdfapihub.com/api/v1/convert/image/pdf',
								...(inputType === 'file'
									? {
											body: multipartBody as Buffer,
											headers: { 'Content-Type': `multipart/form-data; boundary=${multipartBoundary}` },
										}
									: { body, json: true }),
								encoding: 'arraybuffer',
								returnFullResponse: true,
							},
						);
						await prepareBinaryResponse(
							i,
							responseData as { body: ArrayBuffer; headers?: Record<string, unknown> },
							outputFilename || 'converted.pdf',
							'application/pdf',
						);
					} else {
						const responseData = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'pdfapihubApi',
							{
								method: 'POST',
								url: 'https://pdfapihub.com/api/v1/convert/image/pdf',
								...(inputType === 'file'
									? {
											body: multipartBody as Buffer,
											headers: { 'Content-Type': `multipart/form-data; boundary=${multipartBoundary}` },
										}
									: { body, json: true }),
							},
						);
						returnData.push({ json: responseData as IDataObject, pairedItem: { item: i } });
					}
				}
				// =====================================================
				// PDF TO IMAGE (PDF to PNG, WebP, JPG)
				// =====================================================
				else if (operation === 'pdfToPng' || operation === 'pdfToWebp' || operation === 'pdfToJpg') {
					const pdfUrl = this.getNodeParameter('pdf2img_url', i) as string;
					const pages = this.getNodeParameter('pdf2img_pages', i) as string;
					const dpi = this.getNodeParameter('pdf2img_dpi', i) as number;
					const quality = this.getNodeParameter('pdf2img_quality', i) as number;
					const outputFormat = this.getNodeParameter('pdf2img_output', i) as string;

					const imageFormatMap: Record<string, string> = {
						pdfToPng: 'png',
						pdfToWebp: 'webp',
						pdfToJpg: 'jpg',
					};
					const imageFormat = imageFormatMap[operation];

					const body = {
						url: pdfUrl,
						pages,
						image_format: imageFormat,
						dpi,
						quality,
						output: outputFormat,
					};

					if (outputFormat === 'file') {
						const responseData = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'pdfapihubApi',
							{
								method: 'POST',
								url: 'https://pdfapihub.com/api/v1/convert/pdf/image',
								body,
								json: true,
								encoding: 'arraybuffer',
								returnFullResponse: true,
							},
						);
						const mimeType = imageFormat === 'png' ? 'image/png' : imageFormat === 'webp' ? 'image/webp' : 'image/jpeg';
						await prepareBinaryResponse(
							i,
							responseData as { body: ArrayBuffer; headers?: Record<string, unknown> },
							`output.${imageFormat}`,
							mimeType,
						);
					} else {
						const responseData = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'pdfapihubApi',
							{
								method: 'POST',
								url: 'https://pdfapihub.com/api/v1/convert/pdf/image',
								body,
								json: true,
							},
						);
						returnData.push({ json: responseData, pairedItem: { item: i } });
					}
				}
				// =====================================================
				// URL TO HTML
				// =====================================================
				else if (operation === 'fetchHtml') {
					const url = this.getNodeParameter('html_fetch_url', i) as string;
					const waitTill = this.getNodeParameter('html_wait_till', i) as string;
					const timeout = this.getNodeParameter('html_timeout', i) as number;
					const waitForSelector = this.getNodeParameter('html_wait_for_selector', i, '') as string;
					const waitForTimeout = this.getNodeParameter('html_wait_for_timeout', i) as number;
					const viewportWidth = this.getNodeParameter('html_viewport_width', i) as number;
					const viewportHeight = this.getNodeParameter('html_viewport_height', i) as number;
					const userAgent = this.getNodeParameter('html_user_agent', i, '') as string;

					const body: Record<string, unknown> = {
						url,
						wait_till: waitTill,
						timeout,
						wait_for_timeout: waitForTimeout,
						viewport_width: viewportWidth,
						viewport_height: viewportHeight,
					};
					if (waitForSelector) body.wait_for_selector = waitForSelector;
					if (userAgent) body.user_agent = userAgent;

					const responseData = await this.helpers.httpRequestWithAuthentication.call(
						this,
						'pdfapihubApi',
						{
							method: 'POST',
							url: 'https://pdfapihub.com/api/v1/url-to-html',
							body,
							json: true,
						},
					);
					returnData.push({ json: responseData, pairedItem: { item: i } });
				}
				// =====================================================
				// WATERMARK
				// =====================================================
				else if (operation === 'addWatermark') {
					const inputType = this.getNodeParameter('watermark_input_type', i) as string;
					const text = this.getNodeParameter('watermark_text', i) as string;
					const opacity = this.getNodeParameter('watermark_opacity', i) as number;
					const angle = this.getNodeParameter('watermark_angle', i) as number;
					const fontSize = this.getNodeParameter('watermark_font_size', i) as number;
					const outputFormat = this.getNodeParameter('watermark_output', i) as string;

					let multipartBody: Buffer | undefined;
					let multipartBoundary: string | undefined;
					let body: Record<string, unknown> | undefined;

					if (inputType === 'file') {
						const binaryPropertyName = this.getNodeParameter('watermark_binary_property', i) as string;
						const binaryData = this.helpers.assertBinaryData(i, binaryPropertyName);
						const binaryDataBuffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);
						const fileName = binaryData.fileName ?? 'file.pdf';
						const contentType = binaryData.mimeType ?? 'application/pdf';

						multipartBoundary = `----n8nFormBoundary${Math.random().toString(36).slice(2)}`;
						const parts: Buffer[] = [];

						parts.push(
							Buffer.from(
								`--${multipartBoundary}\r\n` +
									`Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n` +
									`Content-Type: ${contentType}\r\n\r\n`,
							),
						);
						parts.push(Buffer.from(binaryDataBuffer));
						parts.push(Buffer.from('\r\n'));

						parts.push(
							Buffer.from(
								`--${multipartBoundary}\r\n` +
									'Content-Disposition: form-data; name="text"\r\n\r\n' +
									`${text}\r\n`,
							),
						);
						parts.push(
							Buffer.from(
								`--${multipartBoundary}\r\n` +
									'Content-Disposition: form-data; name="opacity"\r\n\r\n' +
									`${opacity}\r\n`,
							),
						);
						parts.push(
							Buffer.from(
								`--${multipartBoundary}\r\n` +
									'Content-Disposition: form-data; name="angle"\r\n\r\n' +
									`${angle}\r\n`,
							),
						);
						if (fontSize > 0) {
							parts.push(
								Buffer.from(
									`--${multipartBoundary}\r\n` +
										'Content-Disposition: form-data; name="font_size"\r\n\r\n' +
										`${fontSize}\r\n`,
								),
							);
						}
						parts.push(
							Buffer.from(
								`--${multipartBoundary}\r\n` +
									'Content-Disposition: form-data; name="output_format"\r\n\r\n' +
									`${outputFormat}\r\n`,
							),
						);
						parts.push(Buffer.from(`--${multipartBoundary}--\r\n`));
						multipartBody = Buffer.concat(parts);
					} else if (inputType === 'url') {
						const fileUrl = this.getNodeParameter('watermark_url', i) as string;
						body = { file_url: fileUrl, text, opacity, angle, output_format: outputFormat };
						if (fontSize > 0) body.font_size = fontSize;
					} else {
						const base64File = this.getNodeParameter('watermark_base64', i) as string;
						body = { base64_file: base64File, text, opacity, angle, output_format: outputFormat };
						if (fontSize > 0) body.font_size = fontSize;
					}

					if (outputFormat === 'file') {
						const responseData = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'pdfapihubApi',
							{
								method: 'POST',
								url: 'https://pdfapihub.com/api/v1/watermark',
								...(inputType === 'file'
									? {
											body: multipartBody as Buffer,
											headers: { 'Content-Type': `multipart/form-data; boundary=${multipartBoundary}` },
										}
									: { body, json: true }),
								encoding: 'arraybuffer',
								returnFullResponse: true,
							},
						);
						await prepareBinaryResponse(
							i,
							responseData as { body: ArrayBuffer; headers?: Record<string, unknown> },
							'watermarked.pdf',
							'application/pdf',
						);
					} else {
						const responseData = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'pdfapihubApi',
							{
								method: 'POST',
								url: 'https://pdfapihub.com/api/v1/watermark',
								...(inputType === 'file'
									? {
											body: multipartBody as Buffer,
											headers: { 'Content-Type': `multipart/form-data; boundary=${multipartBoundary}` },
										}
									: { body, json: true }),
							},
						);
						returnData.push({ json: responseData as IDataObject, pairedItem: { item: i } });
					}
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