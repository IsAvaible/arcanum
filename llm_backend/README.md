# LLM Prototype
### basierend auf Flask + Langchain + Azure OpenAI

### Environment Setup
- Um auf SCIEBO zugreifen zu können, muss hier https://fh-aachen.sciebo.de/settings/personal?sectionid=security ein Token erstellt werden und `NEXTCLOUD_USERNAME` und `NEXTCLOUD_PASSWORD` lokal als Umgebungsvariable hinterlegt werden.
  - Herr Neugebauer muss euch einladen, um auf den Ordner zugreifen zu können!
- Um die Azure OpenAI API verwenden zu können, muss die Variable `AZURE_OPENAI_API_KEY` in den lokalen Umgebungsvariablen auf den Azure-API-Schlüssel von Oculavis gesetzt werden. Der Schlüssel kann der .dbx Datei mithilfe des zugehörigen Passworts entnommen werden.
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