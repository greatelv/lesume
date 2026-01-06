import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  // Load the document (using Uint8Array for buffer)
  const data = new Uint8Array(buffer);

  const loadingTask = pdfjsLib.getDocument({
    data,
    useSystemFonts: true, // Use system fonts to avoid font loading errors in node
    disableFontFace: true,
  });

  const pdfDocument = await loadingTask.promise;
  const numPages = pdfDocument.numPages;
  let fullText = "";

  for (let i = 1; i <= numPages; i++) {
    const page = await pdfDocument.getPage(i);
    const textContent = await page.getTextContent();

    const pageText = textContent.items
      .map((item: any) => item.str || "")
      .join(" ");

    fullText += pageText + "\n\n";
  }

  return fullText.trim();
}
