import type { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { NodeOperationError, NodeApiError } from 'n8n-workflow';

import * as generatePdf from './generatePdf';
import * as mergePdf from './mergePdf';
import * as splitPdf from './splitPdf';
import * as compressPdf from './compressPdf';
import * as lockPdf from './lockPdf';
import * as unlockPdf from './unlockPdf';
import * as parsePdf from './parsePdf';
import * as generateImage from './generateImage';
import * as pdfOcrParse from './pdfOcrParse';
import * as imageOcrParse from './imageOcrParse';
import * as documentSimilarity from './documentSimilarity';
import * as imageToPdf from './imageToPdf';
import * as docxToPdf from './docxToPdf';
import * as pdfToDocx from './pdfToDocx';
import * as pdfToImage from './pdfToImage';
import * as fetchHtml from './fetchHtml';
import * as addWatermark from './addWatermark';
import * as signPdf from './signPdf';
import * as pdfToFormat from './pdfToFormat';

/**
 * Action handler type.
 * `operation` is passed so multi-operation handlers (generatePdf, generateImage, etc.)
 * can differentiate between sub-operations sharing the same handler.
 */
type ActionHandler = (
	this: IExecuteFunctions,
	index: number,
	returnData: INodeExecutionData[],
	operation: string,
) => Promise<void>;

/**
 * Map from operation name → handler.
 * Operations sharing a handler (e.g. htmlToPdf / urlToPdf) each get their own entry.
 */

/**
 * Combined descriptions from all action modules.
 */
export const allActionDescriptions: INodeProperties[] = [
	...addWatermark.description,
	...compressPdf.description,
	...documentSimilarity.description,
	...docxToPdf.description,
	...fetchHtml.description,
	...generateImage.description,
	...generatePdf.description,
	...imageOcrParse.description,
	...imageToPdf.description,
	...lockPdf.description,
	...mergePdf.description,
	...parsePdf.description,
	...pdfOcrParse.description,
	...pdfToDocx.description,
	...pdfToFormat.description,
	...pdfToImage.description,
	...splitPdf.description,
	...unlockPdf.description,
	...signPdf.description,
];

const actionMap: Record<string, ActionHandler> = {
	// PDF generation
	htmlToPdf: generatePdf.execute,
	urlToPdf: generatePdf.execute,

	// PDF manipulation
	mergePdf: mergePdf.execute as ActionHandler,
	splitPdf: splitPdf.execute as ActionHandler,
	compressPdf: compressPdf.execute as ActionHandler,

	// PDF security
	lockPdf: lockPdf.execute as ActionHandler,
	unlockPdf: unlockPdf.execute as ActionHandler,

	// PDF parsing
	parsePdf: parsePdf.execute as ActionHandler,

	// Image generation
	htmlToImage: generateImage.execute,
	urlToImage: generateImage.execute,

	// OCR
	pdfOcrParse: pdfOcrParse.execute as ActionHandler,
	imageOcrParse: imageOcrParse.execute as ActionHandler,

	// Document intelligence
	documentSimilarity: documentSimilarity.execute as ActionHandler,

	// Image to PDF
	pngToPdf: imageToPdf.execute,
	webpToPdf: imageToPdf.execute,
	jpgToPdf: imageToPdf.execute,

	// Document conversion
	docxToPdf: docxToPdf.execute as ActionHandler,
	pdfToDocx: pdfToDocx.execute as ActionHandler,

	// PDF to other formats
	pdfToXlsx: pdfToFormat.execute,
	pdfToCsv: pdfToFormat.execute,
	pdfToTxt: pdfToFormat.execute,
	pdfToHtml: pdfToFormat.execute,
	pdfToPptx: pdfToFormat.execute,

	// PDF to image
	pdfToPng: pdfToImage.execute,
	pdfToWebp: pdfToImage.execute,
	pdfToJpg: pdfToImage.execute,

	// URL to HTML
	fetchHtml: fetchHtml.execute as ActionHandler,

	// Watermark & Sign
	addWatermark: addWatermark.execute as ActionHandler,
	signPdf: signPdf.execute as ActionHandler,
};

/**
 * Main dispatcher – called from PdfSplitMerge.node.ts execute().
 */
export async function executePdfSplitMerge(
	this: IExecuteFunctions,
): Promise<INodeExecutionData[][]> {
	const items = this.getInputData();
	const returnData: INodeExecutionData[] = [];

	for (let i = 0; i < items.length; i++) {
		try {
			const operation = this.getNodeParameter('operation', i) as string;
			const handler = actionMap[operation];

			if (!handler) {
				throw new NodeOperationError(this.getNode(), `Unsupported operation: ${operation}`, {
					itemIndex: i,
				});
			}

			await handler.call(this, i, returnData, operation);
		} catch (error) {
			if (this.continueOnFail()) {
				const message = error instanceof Error ? error.message : 'Unknown error';
				returnData.push({ json: { error: message }, pairedItem: { item: i } });
			} else if (error instanceof NodeApiError) {
				// Already a well-formatted API error — re-throw as-is
				throw error;
			} else {
				throw new NodeOperationError(this.getNode(), error, { itemIndex: i });
			}
		}
	}

	return [returnData];
}
