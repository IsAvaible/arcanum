# LLM Prototype
### auf Basis von Flask und Langchain

### Requirements
- Getestet mit Python 3.11.9, am besten genau diese benutzen
  - Es könnte sein, dass höhere/niedrige Versionen zurzeit nicht funktionieren
- Um PDF2Image (OCR) zu benutzen, wird "Poppler" und "PyTesseract" benötigt
  - Tesseract -> https://digi.bib.uni-mannheim.de/tesseract/tesseract-ocr-w64-setup-5.4.0.20240606.exe
  - Poppler -> https://github.com/oschwartz10612/poppler-windows/releases/tag/v24.08.0-0
  - In der .env Datei dann den Pfad der Tesseract Exe hinterlegen
    - Oft `C:\Program Files\Tesseract-OCR\tesseract.exe`

- Für die Dependencies muss "pip" installiert sein
  - https://phoenixnap.com/kb/install-pip-windows 
- Dann kann man mit einem Terminal/CMD in den llm_prototype Ordner wechseln und folgenden Befehl ausführen
  - `pip install -r .\requirements.txt`
  - damit sollten alle benötigten Dependencies installiert werden

#### OpenAI Whisper (Lokal)
- Damit Whisper die GPU benutzt, nach Installieren aller Dependencies folgenden Befehl ausführen:
  - `pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118`
  - `pip install -U openai-whisper`
  - Wichtig ist, dass das Model zurzeit auf "large" eingestellt ist, man kann es aber auch auf andere Größen setzen
    - https://github.com/openai/whisper?tab=readme-ov-file#available-models-and-languages

## Anwendung
- Es gibt 2 Möglichkeiten, einmal Ollama und einmal mit der OpenAI API
- Meinen OPENAI_API_KEY werde ich nicht mit pushen, wer Zugriff haben möchte, kann mich gerne fragen
- Da wir noch kein GUI haben, habe ich ein kleines programmiert um ein paar Funktionen zu testen
- Wer IntelliJ benutzt kann einfach die `main.py` starten und dann einfach auf diesen Link gehen `http://127.0.0.1:5000/`
- Dort kann man dann zwischen Ollama und OpenAI API auswählen


#### Ollama
- Ollama runterladen und starten -> https://ollama.com/
- Hier ist eine Liste von Models die man benutzen kann https://ollama.com/library
  - Bspw kann man folgendes benutzen: https://ollama.com/library/llama3.1
  - Man sieht auf der Seite verschiedene Modellgrößen, diese haben alle eine andere Speichergröße
  - Damit Ollama halbwegs gut funktioniert, sollte man eine Modellgröße nehmen die zum GPU Speicher passt
  - Ich hab 4 GB VRAM, deswegen würde bei mir gerade noch das 8 Billionen Parameter Modell funktionieren
  - Dann Terminal öffnen und folgenden Befehl eingeben `ollama pull llama3.1:8b`
  - Ollama lädt dann das Model runter und man kann es mit dem Prototypen testen

### Chats
- Chats und deren Kontext werden in Sessions gespeichert, da wir noch keine richtige DB zur Verfügung haben
- Ich habe 4 System Prompts geschrieben, um ein paar Funktionalitäten zu testen
  - eins soll immer vordefiniertes und strukturiertes JSON ausgeben
  - eins soll immer JSON ausgeben
  - eins soll immer einen normalen Text ausgeben
  - eins hat keine Forderungen
- Zurzeit können PDF, HTML und Text und Audio Dateien benutzt werden, man kann mehrere auf einmal auswählen.
  - Ich habe 4 verschiedene PDF Bibliotheken implementiert, um zu schauen, welche am Besten ist
    - Meine Empfehlung PDF Plumber
- Die Chat Historie wird über den Chat ID Parameter gespeichert, so kann man ganz einfach einen neuen Chat starten
- Wenn man keine Nachricht eingibt, dann wird standardmäßig folgende Nachricht benutzt:
  - `Please create metadata for a new case based on the information provided!`







