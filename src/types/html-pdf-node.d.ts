declare module 'html-pdf-node' {
  interface HtmlPdfOptions {
    format?: string;
    printBackground?: boolean;
    margin?: {
      top?: string;
      right?: string;
      bottom?: string;
      left?: string;
    };
  }

  interface HtmlPdfFile {
    content: string;
    url?: string;
  }

  export function generatePdf(
    file: HtmlPdfFile,
    options: HtmlPdfOptions,
    callback: (error: Error | null, buffer: Buffer) => void
  ): void;
}

