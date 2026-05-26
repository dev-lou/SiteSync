import { v } from 'convex/values';
import { action } from '../_generated/server';
import { requireRole, ROLES } from '../middleware';
import { env } from '../shared/env';

export const convertPdfToPages = action({
  args: {
    blueprintId: v.id('blueprints'),
    fileStorageId: v.string(),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx as any, [ROLES.admin, ROLES.architect]);

    const storedFile = await ctx.storage.get(args.fileStorageId);
    if (!storedFile) throw new Error('File not found in storage');

    const arrayBuf = await (storedFile as any).arrayBuffer();
    const pages: string[] = [];

    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = '';

      const pdf = await pdfjsLib.getDocument({ data: arrayBuf }).promise;

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2 });

        const canvas = new (globalThis as any).OffscreenCanvas(viewport.width, viewport.height);
        const ctx2d = (canvas as any).getContext('2d')!;

        await (page as any).render({ canvasContext: ctx2d, viewport }).promise;

        const pageBlob = await canvas.convertToBlob({ type: 'image/png' });
        const storageId = await ctx.storage.store(new (File as any)([pageBlob], `page-${i}.png`));
        pages.push(storageId);
      }
    } catch (err) {
      throw new Error(`PDF conversion failed: ${(err as Error).message}`);
    }

    return { pages, numPages: pages.length };
  },
});

export const autoTagInspectionPhoto = action({
  args: { photoStorageId: v.string() },
  handler: async (ctx, args) => {
    try {
      const storedFile = await ctx.storage.get(args.photoStorageId);
      if (!storedFile) throw new Error('Photo not found');

      const apiKey = env('GEMINI_API_KEY');
      if (!apiKey) return { tags: [], description: 'AI tagging unavailable (no API key)' };

      const base64Image = await blobToBase64(storedFile as Blob);

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: 'Analyze this construction site inspection photo. Return a JSON object with: tags (array of 3-5 keywords describing what is visible), description (1 sentence summary), and safetyConcerns (array of any safety issues observed, empty if none).',
                  },
                  { inline_data: { mime_type: 'image/jpeg', data: base64Image } },
                ],
              },
            ],
          }),
        },
      );

      const result: any = await response.json();
      const text = result?.candidates?.[0]?.content?.parts?.[0]?.text || '';

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return { tags: [], description: text, safetyConcerns: [] };
    } catch (err) {
      return {
        tags: [],
        description: `Analysis failed: ${(err as Error).message}`,
        safetyConcerns: [],
      };
    }
  },
});

async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return (btoa as any)(binary);
}
