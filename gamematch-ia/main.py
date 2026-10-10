import os
import base64
import cv2
import numpy as np
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from deepface import DeepFace

app = FastAPI(title="GameMatch IA Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TEMP_DIR = "temp"
os.makedirs(TEMP_DIR, exist_ok=True)

class ImagenRequest(BaseModel):
    imagen: str

@app.get("/")
def home():
    return {"status": "Servidor de IA Activo"}

@app.post("/api/usuarios/verificar-edad")
async def verificar_edad(data: ImagenRequest):
    temp_path = os.path.join(TEMP_DIR, "temp_verificacion.jpg")

    try:
        # 1. Decodificar la imagen Base64
        string_base64 = data.imagen
        if "," in string_base64:
            string_base64 = string_base64.split(",")[1]

        img_bytes = base64.b64decode(string_base64)
        
        # Convertir a matriz de OpenCV para análisis directo en memoria
        nparr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            return {"exito": False, "error": "Imagen no válida o corrupta."}

        with open(temp_path, "wb") as buffer:
            buffer.write(img_bytes)

        # 2. Control de cámara tapada u oscuridad total (brillo promedio)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        brillo_promedio = float(np.mean(gray))

        if brillo_promedio < 15:
            print("⚠️ Cámara tapada o con extrema oscuridad.")
            return {
                "exito": False,
                "error": "No se detectó ningún rostro. Asegúrate de despejar la cámara y tener iluminación."
            }

        # 3. Analizar la imagen con DeepFace
        analysis = DeepFace.analyze(
            img_path=temp_path,
            actions=['age'],
            enforce_detection=False,
            detector_backend='ssd'
        )

        if isinstance(analysis, list):
            analysis = analysis[0]

        # 4. Validar si realmente se recortó un rostro o si tomó toda la imagen
        img_h, img_w, _ = img.shape
        region = analysis.get('region', {})
        reg_w = region.get('w', img_w)
        reg_h = region.get('h', img_h)

        # Si el recuadro 'region' ocupa más del 95% del total de la pantalla, NO halló facciones
        if reg_w >= img_w * 0.95 and reg_h >= img_h * 0.95:
            print("⚠️ No se identificaron facciones humanas en la foto.")
            return {
                "exito": False,
                "error": "No se detectó ningún rostro claro en la cámara. Asegúrate de enfocar bien tu cara."
            }

        # 5. Rostro confirmado: estimación de edad exitosa
        edad_estimada = int(analysis.get('age', 0))
        es_mayor = edad_estimada >= 18

        print(f"Rostro verificado correctamente. Edad estimada: {edad_estimada} años.")

        return {
            "exito": True,
            "edad_estimada": edad_estimada,
            "es_mayor_de_edad": es_mayor
        }

    except Exception as e:
        print("Error inesperado en el servidor de IA:", str(e))
        return {
            "exito": False,
            "error": f"Error al procesar la imagen: {str(e)}"
        }
    finally:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass