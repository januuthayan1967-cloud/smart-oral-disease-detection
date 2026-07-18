"""Oral Disease Detection AI Microservice using MobileNetV2."""

import os
import io
import hashlib
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from PIL import Image
import cv2

load_dotenv()

app = Flask(__name__)
CORS(app)

CLASSES = [
    "Dental Calculus",
    "Dental Caries",
    "Gingivitis",
    "Normal Teeth",
    "Mouth Ulcer",
    "Tooth Discoloration",
]

MODEL = None
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.getenv("MODEL_PATH", os.path.join(BASE_DIR, "models", "mymodel_checkpoint.keras"))


def load_model():
    """Load TensorFlow/Keras MobileNetV2 model if available."""
    global MODEL

    resolved_path = MODEL_PATH
    if not os.path.isabs(resolved_path):
        resolved_path = os.path.abspath(os.path.join(BASE_DIR, resolved_path))

    if os.path.exists(resolved_path):
        try:
            import tensorflow as tf

            MODEL = tf.keras.models.load_model(resolved_path)
            print(f"Model loaded from {resolved_path}")
            return True
        except Exception as exc:
            print(f"Failed to load model: {exc}")

    print("No trained model found. Using heuristic fallback prediction.")
    return False


def preprocess_image(image_bytes):
    """Preprocess image using OpenCV and return normalized array."""
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        raise ValueError("Invalid image file")

    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    img = cv2.resize(img, (224, 224))
    img = cv2.GaussianBlur(img, (3, 3), 0)

    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    lab = cv2.cvtColor(img, cv2.COLOR_RGB2LAB)
    lab[:, :, 0] = clahe.apply(lab[:, :, 0])
    img = cv2.cvtColor(lab, cv2.COLOR_LAB2RGB)

    img_array = img.astype(np.float32)
    img_array = np.expand_dims(img_array, axis=0)
    return img_array, img



def heuristic_predict(img):
    """Fallback prediction using image color/texture heuristics when model is unavailable."""
    hsv = cv2.cvtColor(img, cv2.COLOR_RGB2HSV)
    gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)

    mean_brightness = np.mean(gray)
    red_channel = np.mean(img[:, :, 0])
    yellow_score = np.mean((hsv[:, :, 0] > 15) & (hsv[:, :, 0] < 35))
    dark_spots = np.mean(gray < 80)
    edge_density = np.mean(cv2.Canny(gray, 50, 150) > 0)

    scores = {
        "Dental Caries": dark_spots * 100 + (100 - mean_brightness) * 0.2,
        "Dental Calculus": edge_density * 80 + yellow_score * 40,
        "Gingivitis": red_channel * 0.3 + (100 - mean_brightness) * 0.1,
        "Mouth Ulcer": dark_spots * 60 + edge_density * 30,
        "Tooth Discoloration": yellow_score * 100 + (100 - mean_brightness) * 0.15,
        "Normal Teeth": mean_brightness * 0.5 + (1 - dark_spots) * 30,
    }

    image_hash = int(hashlib.md5(gray.tobytes()).hexdigest(), 16)
    for i, disease in enumerate(CLASSES):
        scores[disease] += (image_hash % (i + 3)) * 0.01

    best_class = max(scores, key=scores.get)
    raw_confidence = scores[best_class]
    confidence = min(95.0, max(55.0, raw_confidence))

    return best_class, round(confidence, 2)


def predict(image_bytes):
    """Run model or heuristic prediction."""
    img_array, processed_img = preprocess_image(image_bytes)

    if MODEL is not None:
        predictions = MODEL.predict(img_array, verbose=0)[0]
        class_idx = int(np.argmax(predictions))
        confidence = float(predictions[class_idx] * 100)
        return CLASSES[class_idx], round(confidence, 2)

    return heuristic_predict(processed_img)


@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "healthy",
        "model_loaded": MODEL is not None,
        "classes": CLASSES,
    })


@app.route("/predict", methods=["POST"])
def predict_endpoint():
    if "image" not in request.files:
        return jsonify({"error": "No image file provided"}), 400

    file = request.files["image"]

    if file.filename == "":
        return jsonify({"error": "Empty filename"}), 400

    try:
        image_bytes = file.read()
        Image.open(io.BytesIO(image_bytes)).verify()

        disease_name, confidence = predict(image_bytes)

        return jsonify({
            "success": True,
            "diseaseName": disease_name,
            "confidence": confidence,
            "modelUsed": "mobilenetv2" if MODEL is not None else "heuristic",
        })
    except Exception as exc:
        return jsonify({"error": str(exc)}), 400


@app.route("/classes", methods=["GET"])
def get_classes():
    return jsonify({"classes": CLASSES})


if __name__ == "__main__":
    load_model()
    port = int(os.getenv("PORT", 5001))
    app.run(host="0.0.0.0", port=port, debug=os.getenv("FLASK_ENV") == "development")
