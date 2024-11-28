# LLM Prototype
### basierend auf Flask + Langchain + Azure OpenAI

### Environment Setup
- Um auf SCIEBO zugreifen zu können, muss hier https://fh-aachen.sciebo.de/settings/personal?sectionid=security ein Token erstellt werden und `WEBDAV_LOGIN` und `WEBDAV_PASSWORD` lokal als Umgebungsvariable hinterlegt werden.
  - Herr Neugebauer muss euch einladen, um auf den Ordner zugreifen zu können!
- Um die Azure OpenAI API verwenden zu können, muss die Variable `AZURE_OPENAI_API_KEY` in den lokalen Umgebungsvariablen auf den Azure-API-Schlüssel von Oculavis gesetzt werden. Der Schlüssel kann der .dbx Datei mithilfe des zugehörigen Passworts entnommen werden.
- Zur Einfachheit bitte einfach die Docker Compose starten
  - Endpunkt zu Case Generierung ist `http://127.0.0.1:5001/generate_case`
  - HTTP Methode -> POST

### Beispiel JSON:
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