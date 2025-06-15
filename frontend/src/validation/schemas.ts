import * as z from 'zod'
import { CaseCaseTypeEnum, CasePriorityEnum, CaseStatusEnum } from '@/api'

export const caseSchema = z.object({
  title: z.string({ required_error: 'Please provide a title' }).min(1, 'Please provide a title'),
  case_type: z.nativeEnum(CaseCaseTypeEnum, {
    required_error: 'Please select at least one case type',
  }),
  status: z.nativeEnum(CaseStatusEnum, { required_error: 'Please select a status' }),
  priority: z
    .nativeEnum(CasePriorityEnum, { required_error: 'Please select a priority' })
    .optional(),

  description: z
    .string({ required_error: 'Please provide a description' })
    .min(1, 'Please provide a description'),
  solution: z.string().optional(),

  assignees: z
    .string({ required_error: 'Please select at least one assignee' })
    .array()
    .nonempty({ message: 'Please select at least one assignee' }),
  participants: z.string().array().optional(),
  team: z.string().optional(),

  products: z.array(z.number()).default([]),

  draft: z.boolean().default(false),
})
export type CaseSchemaType = z.infer<typeof caseSchema>
