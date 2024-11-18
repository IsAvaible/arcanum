


def save_debug(datei_name, parameter_dict):
    with open(datei_name, 'w', encoding="utf-8") as file:
        for schluessel, wert in parameter_dict.items():
            file.write(f"{schluessel}={wert}\n")
    print(f"Parameter erfolgreich in {datei_name} gespeichert.")