# LLM Prototype

### basierend auf Flask + Langchain + Azure OpenAI

### Environment Setup

- Um auf SCIEBO zugreifen zu können, muss hier https://fh-aachen.sciebo.de/settings/personal?sectionid=security ein
  Token erstellt werden und `NEXTCLOUD_USERNAME` und `NEXTCLOUD_PASSWORD` lokal als Umgebungsvariable hinterlegt werden.
    - Herr Neugebauer muss euch einladen, um auf den Ordner zugreifen zu können!
- Um die Azure OpenAI API verwenden zu können, muss die Variable `AZURE_OPENAI_API_KEY` in den lokalen
  Umgebungsvariablen auf den Azure-API-Schlüssel von Oculavis gesetzt werden. Der Schlüssel kann der .dbx Datei mithilfe
  des zugehörigen Passworts entnommen werden.
- Zur Einfachheit bitte einfach die Docker Compose starten
    - Endpunkt zu Case Generierung ist `http://127.0.0.1:5001/generate_case`
    - HTTP Methode -> POST

### Beispiel Request:

```
{
  "socket_id" : "123",
  "attachments":[
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

### Beispiel Response:

```
{
    "cases": [
        {
            "assignee": [
                "Marcel"
            ],
            "attachments": [
                1234
            ],
            "description": "Das Schweißgerät MIG4300Pro macht merkwürdige Geräusche, die auf eine mögliche Überlastung des Motors hindeuten. Zudem schaltet sich das Gerät bei längeren Schweißnähten ab. Die Stromversorgung wurde überprüft und ist stabil. Die Lüftungsschlitze sind frei, jedoch wurde festgestellt, dass der Draht in der Drahtzuführung verhakt war.",
            "solution": "Die Drahtrolle wurde neu ausgerichtet, was das Problem behoben hat.",
            "status": "resolved",
            "title": "Merkwürdige Geräusche und Abschaltung des Schweißgeräts MIG4300Pro"
        },
        {
            "assignee": [],
            "attachments": [
                4567
            ],
            "description": "Beim Schweißen mit dem MIG4300Pro trat kein Gasfluss auf, was zu Poren in der Schweißnaht führte. Die Gasflasche war noch halb voll und das Ventil war offen. Alle Schlauchverbindungen wurden kontrolliert und es wurde festgestellt, dass der Schlauch beschädigt war.",
            "solution": "Ein neuer Schlauch wurde installiert, was den Gasfluss wiederherstellte und die Schweißnähte verbesserten sich.",
            "status": "resolved",
            "title": "Kein Gasfluss beim Schweißgerät MIG4300Pro"
        }
    ]
}

```

Generate Case(s) Diagramm
![generate case](https://github.com/user-attachments/assets/5fd53c91-312e-4e82-a966-a92ce84a29f3)

## LLM Chat
![LLM Chat](https://github.com/user-attachments/assets/086f05c8-755c-4c9f-bfd4-3c2aa5b66f86)

### Beispiel Request:
```
{
  "socketId": "12345",
  "message": "Welche Probleme sind bisher mit Schweißgeräten aufgetreten?",
  "context": [
    {"role": "user", "content": "Hallo"},
    {"role": "assistant", "content": "Hallo, wie kann ich dir helfen?"}
  ]
}
```
### Beispiel Response:
```
"Ein Problem, das mit dem Schweißgerät MIG4300Pro aufgetreten ist, betrifft merkwürdige Geräusche, die auf eine mögliche Überlastung des Motors oder ein internes Problem hindeuten. Zusätzlich schaltet sich das Gerät bei längeren Schweißnähten ab. Die Stromversorgung wurde überprüft und das Gerät war an derselben Steckdose wie immer angeschlossen. Die Lüftungsschlitze waren frei, was auf ein anderes Problem hinwies. Es wurde festgestellt, dass der Draht in der Drahtzuführung verhakt war. Nach der Neuausrichtung der Drahtrolle scheint das Problem behoben zu sein [file:14][case:24]."
```
### Beispiel Response Socket:
```
["llm_message",{"message":"Ein Problem, das mit dem Schwei\u00dfger\u00e4t MIG4300Pro aufgetreten ist, betrifft merkw\u00fcrdige Ger\u00e4usche, die auf eine m\u00f6gliche \u00dcberlastung des Motors oder ein internes Problem hindeuten. Zus\u00e4tzlich schaltet sich das Ger\u00e4t bei l\u00e4ngeren Schwei\u00dfn\u00e4hten ab. Die Stromversorgung wurde \u00fcberpr\u00fcft und das Ger\u00e4t war an derselben Steckdose wie immer angeschlossen. Die L\u00fcftungsschlitze waren frei, was auf ein anderes Problem hinwies. Es wurde festgestellt, dass der Draht in der Drahtzuf\u00fchrung verhakt war. Nach der Neuausrichtung der Drahtrolle scheint das Problem behoben zu sein [file:14][case:24].","socket_id":"12345"}]
```

## Save to VectorDB
![LLM save case](https://github.com/user-attachments/assets/f6d51fcd-d177-4b0d-ae91-94d578a2ea39)

### Beispiel Request: 
```
[
    {
        "id": 24,
        "title": "Merkwürdige Geräusche und Abschaltung des Schweißgeräts MIG4300Pro",
        "description": "Das Schweißgerät MIG4300Pro macht merkwürdige Geräusche, die auf eine mögliche Überlastung des Motors oder ein internes Problem hindeuten. Zusätzlich schaltet sich das Gerät bei längeren Schweißnähten ab. Die Stromversorgung wurde überprüft und das Gerät ist an derselben Steckdose wie immer angeschlossen. Die Lüftungsschlitze sind frei, was auf ein anderes Problem hinweist. [SMS_1_PDF.pdf: 09:12 - 09:17]",
        "solution": "Es wurde festgestellt, dass der Draht in der Drahtzuführung verhakt war. Nach der Neuausrichtung der Drahtrolle scheint das Problem behoben zu sein. [SMS_1_PDF.pdf: 09:20 - 09:23]",
        "assignee": null,
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
]
```
