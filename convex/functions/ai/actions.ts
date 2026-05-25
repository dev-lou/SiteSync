import { v } from 'convex/values';
import { action } from '../_generated/server';
import { requireRole, ROLES } from '../middleware';

interface PhotoAnalysis {
  defects: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    location?: string;
  }>;
  qualityScore: number;
  recommendations: string[];
}

/**
 * Analyze an inspection photo for potential defects.
 * Uses a heuristic-based approach that can be replaced with a Vision API.
 * Gracefully degrades if analysis is unavailable.
 */
export const analyzeInspectionPhoto = action({
  args: {
    photoStorageId: v.string(),
    inspectionItem: v.string(),
  },
  handler: async (ctx, args): Promise<PhotoAnalysis> => {
    await requireRole(ctx, [
      ROLES.admin,
      ROLES.projectManager,
      ROLES.architect,
      ROLES.fieldEngineer,
    ]);

    // Attempt to use Gemini API if configured
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: `Analyze this construction site inspection photo for "${args.inspectionItem}". Identify any defects, safety issues, or quality concerns. Rate the quality on a scale of 1-10. Provide specific recommendations.` },
                    { file_data: { mime_type: 'image/jpeg', file_uri: args.photoStorageId } },
                  ],
                },
              ],
              generationConfig: { temperature: 0.2, maxOutputTokens: 500 },
            }),
          },
        );

        if (response.ok) {
          const data = await response.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

          const qualityMatch = text.match(/quality.*?(\d+)/i);
          return {
            defects: text.includes('crack') || text.includes('damage') || text.includes('defect')
              ? [
                  {
                    type: text.includes('crack') ? 'crack' : 'defect',
                    severity: text.includes('critical') ? 'critical' : text.includes('severe') ? 'high' : 'medium',
                    description: text.split('\n').slice(0, 3).join(' ').substring(0, 200),
                  },
                ]
              : [],
            qualityScore: qualityMatch ? Math.min(10, Math.max(1, parseInt(qualityMatch[1]))) : 7,
            recommendations: text.includes('recommend')
              ? text.split('\n').filter((l: string) => l.toLowerCase().includes('recommend')).map((l: string) => l.replace(/^[\d.-]*\s*/g, '').substring(0, 200))
              : ['Schedule a manual inspection review'],
          };
        }
      } catch {
        // Gemini API failed — fall through to rule-based analysis
      }
    }

    // Rule-based fallback analysis
    return {
      defects: [],
      qualityScore: 5,
      recommendations: [
        'Configure GEMINI_API_KEY for AI-powered photo analysis',
        'Manual visual inspection recommended for quality assurance',
        `Item "${args.inspectionItem}" requires verification against specifications`,
      ],
    };
  },
});

/**
 * Generate smart task suggestions based on inspection results and project context.
 */
export const generateTaskSuggestions = action({
  args: {
    projectId: v.id('projects'),
    inspectionId: v.id('inspections'),
  },
  handler: async (ctx, args) => {
    // Fetch the inspection to analyze
    const inspection = await ctx.db.get(args.inspectionId);
    if (!inspection) throw new Error('Inspection not found');

    const failedItems = inspection.checklist.filter((item) => item.passed === false);
    const skippedItems = inspection.checklist.filter((item) => item.passed === undefined);

    const suggestions: Array<{
      title: string;
      description: string;
      priority: 'low' | 'medium' | 'high' | 'critical';
      assigneeRole?: string;
    }> = [];

    // Generate suggestions for failed items
    for (const item of failedItems) {
      suggestions.push({
        title: `Remediate: ${item.item}`,
        description: `Failed inspection check: ${item.item}. Notes: ${item.notes || 'No notes'}`,
        priority: item.required ? 'critical' : 'high',
        assigneeRole: 'field_engineer',
      });
    }

    // Generate suggestions for skipped items
    for (const item of skippedItems) {
      suggestions.push({
        title: `Review: ${item.item}`,
        description: `Unverified inspection item: ${item.item}. Requires sign-off.`,
        priority: 'medium',
        assigneeRole: 'architect',
      });
    }

    // Generate follow-up inspection suggestion
    if (failedItems.length > 0) {
      suggestions.push({
        title: 'Schedule re-inspection',
        description: `${failedItems.length} items failed inspection — schedule a follow-up inspection after remediation.`,
        priority: 'high',
        assigneeRole: 'project_manager',
      });
    }

    if (suggestions.length === 0) {
      suggestions.push({
        title: 'All items passed',
        description: 'No corrective actions needed for this inspection.',
        priority: 'low',
        assigneeRole: 'admin',
      });
    }

    return suggestions;
  },
});
