const z = require("zod");


const glossarySchema = z.object({
  id: z.number().int().positive().optional(),
  term: z.string().min(1, "The glossary term must be at least 1 character."),
});

module.exports = { glossarySchema };