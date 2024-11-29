# LLM Prototype
### based on Flask + Langchain + Azure OpenAI

### Environment Setup
- Um auf SCIEBO zugreifen zu können, muss hier https://fh-aachen.sciebo.de/settings/personal?sectionid=security ein Token erstellt werden und `NEXTCLOUD_USERNAME` und `NEXTCLOUD_PASSWORD` lokal als Umgebungsvariable hinterlegt werden.
- Um die Azure OpenAI API verwenden zu können, muss die Variable "AZURE_OPENAI_API_KEY" in den lokalen PC-Umgebungsvariablen auf den Azure-API-Schlüssel von Oculavis gesetzt werden. Der Schlüssel kann der .dbx Datei mithilfe des zugehörigen Passworts entnommen werden.
- Falls du das Projekt schon vor der Integration von Azure OpenAI API ausgeführt hast, musst du ebenfalls den .chromadb Ordner vor der ersten Ausführung des Codes löschen.