const { z } = require("zod");

// Message schema
const messageSchema = z.object({
  content: z.string().min(1),
  socketId: z.string().min(1).optional().or(z.literal("")),
});

const updateMessageSchema = z.object({
  content: z.string().min(1),
  socketId: z.string().min(1).optional().or(z.literal("")),
});

// Chat schema
const chatSchema = z.object({
  title: z.string().min(1).optional().or(z.literal("")),
});

module.exports = {
  updateMessageSchema,
  messageSchema,
  chatSchema,
};
