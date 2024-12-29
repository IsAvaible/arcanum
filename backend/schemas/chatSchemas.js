const { z } = require("zod");

// Message schema
const messageSchema = z.object({
  content: z.string().min(1),
  socketId: z.string().min(1),
});

const updateMessageSchema = z.object({
  content: z.string().min(1),
  socketId: z.string().optional(),
});

// Chat schema
const chatSchema = z.object({
  title: z.string().optional(),
});

module.exports = {
  updateMessageSchema,
  messageSchema,
  chatSchema,
};
