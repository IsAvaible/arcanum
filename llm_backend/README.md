# LLM Prototype

### Based on Flask + LangChain + Azure OpenAI

---

## Environment Setup

1. Copy `.env.example` and customize it to create your own `.env` file.

2. To access **SCIEBO**, create a token here:
   [https://fh-aachen.sciebo.de/settings/personal?sectionid=security](https://fh-aachen.sciebo.de/settings/personal?sectionid=security)
   Set the following environment variables locally:

  * `NEXTCLOUD_USERNAME`
  * `NEXTCLOUD_PASSWORD`

   ⚠️ *You must be invited by Mr. Neugebauer to access the shared folder.*

3. To use the **Azure OpenAI API**, create your own Azure OpenAI instance:

  * Sign up at [Azure](https://azure.microsoft.com/) and navigate to **Azure AI Foundry**.
  * Add the following models: `gpt-4o`, `whisper`, and `text-embedding-ada-002`.
  * Once deployed, copy the **endpoint** and **API key**.
  * Set the environment variable `AZURE_OPENAI_API_KEY` with your API key, and update your `.env` file accordingly.

   ⚠️ *Note: The previous Oculavis instance is no longer available as the project has concluded.*

4. For simplicity, start the project using Docker Compose.

  * **Endpoint for case generation:** `http://127.0.0.1:5001/generate_case`
  * **HTTP Method:** `POST`

---

## Example Request

```json
{
  "socket_id": "123",
  "attachments": [
    {
      "file_id": 1234,
      "filename": "test.mp3",
      "filepath": "/IP_WKS/Audio/test.mp3",
      "size": 98765,
      "filehash": "123456789123456789a"
    },
    {
      "file_id": 4567,
      "filename": "test.pdf",
      "filepath": "/IP_WKS/Text/test.pdf",
      "size": 43210,
      "filehash": "12345678912456789b"
    }
  ]
}
```

## Example Response

```json
{
  "cases": [
    {
      "assignees": ["Marcel"],
      "attachments": [1234],
      "description": "The MIG4300Pro welding machine is making strange noises, indicating a possible motor overload. It also shuts down during longer welds. The power supply has been checked and is stable. The ventilation slots are clear, but the wire was found to be jammed in the wire feed.",
      "solution": "The wire spool was realigned, resolving the issue.",
      "status": "resolved",
      "title": "Strange Noises and Shutdown of MIG4300Pro Welding Machine"
    },
    {
      "assignees": [],
      "attachments": [4567],
      "description": "While welding with the MIG4300Pro, there was no gas flow, causing porosity in the weld seam. The gas cylinder was half full, and the valve was open. All hose connections were checked, revealing a damaged hose.",
      "solution": "The hose was replaced, restoring gas flow and improving the welds.",
      "status": "resolved",
      "title": "No Gas Flow on MIG4300Pro Welding Machine"
    }
  ]
}
```

### Case Generation Diagram

![generate case](https://github.com/user-attachments/assets/5fd53c91-312e-4e82-a966-a92ce84a29f3)

---

## LLM Chat

### Example Request

```json
{
  "socketId": "12345",
  "message": "What issues have occurred with welding machines so far?",
  "context": [
    { "role": "user", "content": "Hello" },
    { "role": "assistant", "content": "Hi, how can I help you?" }
  ]
}
```

### Example Response

```text
An issue with the MIG4300Pro welding machine involved strange noises indicating a possible motor overload or internal issue. The device also shut down during longer welds. Power supply was checked and confirmed stable. The ventilation slots were clear, pointing to another issue. It was found that the wire was jammed in the wire feed. After realigning the wire spool, the problem seemed resolved. [file:14][case:24]
```

### Example Socket Response

```json
[
  "llm_message",
  {
    "message": "An issue with the MIG4300Pro welding machine involved strange noises indicating a possible motor overload or internal issue. The device also shut down during longer welds. Power supply was checked and confirmed stable. The ventilation slots were clear, pointing to another issue. It was found that the wire was jammed in the wire feed. After realigning the wire spool, the problem seemed resolved. [file:14][case:24]",
    "socket_id": "12345"
  }
]
```

---

## Save to VectorDB

### Example Request

```json
{
  "id": 24,
  "title": "Strange Noises and Shutdown of MIG4300Pro Welding Machine",
  "description": "The MIG4300Pro welding machine is making strange noises, possibly indicating motor overload or internal issues. Additionally, the device shuts down during longer welds. The power supply has been checked and remains consistent. Ventilation slots are unobstructed. [SMS_1_PDF.pdf: 09:12 - 09:17]",
  "solution": "The wire was found jammed in the wire feed. After realigning the wire spool, the problem appears to be resolved. [SMS_1_PDF.pdf: 09:20 - 09:23]",
  "assignees": [],
  "status": "Solved",
  "case_type": "Problem",
  "priority": "Medium",
  "draft": true,
  "createdAt": "2025-01-05T13:24:29.740Z",
  "updatedAt": "2025-01-05T13:24:29.740Z",
  "attachments": [
    {
      "id": 14,
      "filename": "SMS_1_PDF.pdf",
      "filepath": "/IP_WKS/Text/f4ea323f129f8fc199b0539726729f1375153a0c715b0fd8c63fa48fa9361bfd.pdf",
      "mimetype": "application/pdf",
      "size": 34666,
      "uploadedAt": "2025-01-05T13:22:06.258Z",
      "filehash": "f4ea323f129f8fc199b0539726729f1375153a0c715b0fd8c63fa48fa9361bfd",
      "createdAt": "2025-01-05T13:22:06.258Z",
      "updatedAt": "2025-01-05T13:22:06.259Z"
    }
  ]
}
```