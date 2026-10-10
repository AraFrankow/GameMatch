import base64
import sys
import json
import numpy as np
import cv2
from deepface import DeepFace

try:
    if len(sys.argv) < 2:
        print(json.dumps({"exito": False, "message": "No se recibió ninguna imagen."}))
        sys.exit(0)

    imagen_raw = sys.argv[1]

    if ',' in imagen_raw:
        imagen_raw = imagen_raw.split(',')[1]
    img_bytes = base64.b64decode(imagen_raw)
    nparr = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        print(json.dumps({"exito": False, "message": "No se pudo interpretar el formato de la foto."}))
        sys.exit(0)

    # Analizar edad con DeepFace (enforce_detection=False evita que crashée si la luz es mala)
    resultado = DeepFace.analyze(img, actions=['age'], enforce_detection=False)

    edad = resultado[0]['age']

    print(json.dumps({"exito": True, "edad": edad}))

except Exception as e:
    print(json.dumps({"exito": False, "message": f"Error en Python: {str(e)}"}))