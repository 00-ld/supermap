import type { AiCommandPlan, AiTaskDraft } from './aiCommandTypes'

const storagePrefix = 'ai-copilot-draft:'

export const createAiTaskDraft = (plan: AiCommandPlan, sourceText: string): AiTaskDraft => {
  const draft: AiTaskDraft = {
    ...plan,
    id: `ai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    sourceText,
    createdAt: new Date().toISOString(),
  }
  sessionStorage.setItem(`${storagePrefix}${draft.id}`, JSON.stringify(draft))
  return draft
}

export const getAiTaskDraft = (id: string | null | undefined): AiTaskDraft | null => {
  if (!id) return null
  try {
    const raw = sessionStorage.getItem(`${storagePrefix}${id}`)
    return raw ? JSON.parse(raw) as AiTaskDraft : null
  } catch {
    return null
  }
}

export const removeAiTaskDraft = (id: string) => sessionStorage.removeItem(`${storagePrefix}${id}`)
