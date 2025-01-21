const z = require("zod");

const attachmentSchema = z.object({
  id: z.number().int().positive().optional(),
  filename: z.string().min(3),
  filepath: z.string().min(3),
  mimetype: z.string().min(3),
  size: z.number().int().positive(),
  uploadedAt: z.date().optional(),
  filehash: z.string().min(3),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

const caseSchema = z.object({
  id: z.number().int().positive().optional(),
  case_type: z.enum(["Problem", "Incident", "Change", "FAQ"]),
  title: z.string().min(3),
  description: z.string().min(1),
  solution: z.string().min(1).optional().or(z.literal("")),
  assignees: z.union([z.string(), z.string().array()]),
  status: z.enum(["Open", "In Progress", "Solved", "Closed"]).optional(),
  priority: z.enum(["Low", "Medium", "High"]).optional(),
  draft: z.string().optional(),
  craftedAt: z.date().optional(),
  updatedAt: z.date().optional(),
  attachmentSchema: z.array(attachmentSchema).optional(),
});

module.exports = { caseSchema, attachmentSchema };
