import io
import json
import numpy as np
from PIL import Image
from app import app, MODEL

def test_flask_app():
    print("Testing Flask app endpoints...")
    client = app.test_client()

    # 1. Test /health endpoint
    health_resp = client.get('/health')
    print(f"Health Response Status: {health_resp.status_code}")
    print(f"Health Response Body: {health_resp.get_data(as_text=True)}")
    assert health_resp.status_code == 200
    health_json = health_resp.get_json()
    assert health_json["status"] == "healthy"
    assert health_json["model_loaded"] is True
    assert health_json["model_name"] == "MobileNetV3"

    # 2. Create synthetic test oral teeth image bytes
    img = Image.new('RGB', (400, 300), color=(180, 100, 100))
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='JPEG')
    img_bytes = img_byte_arr.getvalue()

    # 3. Test /predict endpoint with valid image file
    data = {
        'image': (io.BytesIO(img_bytes), 'test_teeth.jpg')
    }
    predict_resp = client.post('/predict', data=data, content_type='multipart/form-data')
    print(f"\nPredict Response Status: {predict_resp.status_code}")
    predict_json = predict_resp.get_json()
    print(f"Predict Response Body:\n{json.dumps(predict_json, indent=2)}")

    assert predict_resp.status_code == 200
    assert predict_json["success"] is True
    assert "diseaseName" in predict_json
    assert "confidence" in predict_json
    assert "prediction" in predict_json
    assert "probabilities" in predict_json
    assert predict_json["modelUsed"] == "mobilenetv3"

    print("\n--- ALL FLASK API TESTS PASSED SUCCESSFULLY! ---")

if __name__ == "__main__":
    test_flask_app()
