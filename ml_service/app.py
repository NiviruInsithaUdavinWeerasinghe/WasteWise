import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.image import img_to_array
from PIL import Image
import io
import json
import google.generativeai as genai
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure Gemini API
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise ValueError("GEMINI_API_KEY not found in environment variables")

# Log masked key for verification (safe for logs)
print(f"Using API Key: {api_key[:8]}...{api_key[-4:]}")

genai.configure(api_key=api_key)
vision_model = genai.GenerativeModel('gemini-flash-latest')

app = Flask(__name__)
CORS(app)

print("Loading model...")
# UPDATE: Point this to your new fine-tuned model file
model = load_model('wastewise_model_resnet_finetuned.keras')

class_names = [
    'Acrylic', 'Artificial_fur', 'Artificial_leather', 'Blended', 'Chenille', 
    'Corduroy', 'Cotton', 'Crepe', 'Denim', 'Felt', 'Fleece', 'Leather', 
    'Linen', 'Lut', 'Nylon', 'Polyester', 'Satin', 'Silk', 'Suede', 
    'Terrycloth', 'Unclassified', 'Utilities', 'Velvet', 'Viscose', 'Wool'
]
print("Model loaded!")

def prepare_image(image, target_size):
    if image.mode != "RGB":
        image = image.convert("RGB")
    image = image.resize(target_size)
    image = img_to_array(image)
    image = np.expand_dims(image, axis=0)
    image = image / 255.0
    return image

@app.route("/predict", methods=["POST"])
def predict():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    
    try:
        image = Image.open(io.BytesIO(file.read()))
        processed_image = prepare_image(image, target_size=(224, 224))
        
        prediction = model.predict(processed_image)[0]
        
        results = []
        for i, score in enumerate(prediction):
            results.append({
                "material": class_names[i],
                "confidence": float(score)
            })
            
        results.sort(key=lambda x: x["confidence"], reverse=True)

        # ====== Gemini AI Integration for Quality Grade ======
        try:
            prompt = """Analyze this image of waste fabric/material. Estimate the quality grade strictly based on these rules:
- 'Grade A': Clean, high-quality fabric off-cuts, pristine condition, no heavy fraying, zero stains, or tears. (Clean roll ends and off-cuts are Grade A).
- 'Grade B': Noticeable edge fraying, slight marks, or minor discoloration, but moderately usable.
- 'Grade C': Heavily contaminated, dirty, stained, or shredded.
Return ONLY a valid JSON object exactly like this: {"quality_grade": "Grade A"}."""
            
            # Use request_options to set a reasonable timeout (e.g., 10 seconds)
            # to prevent the frontend from hanging forever if the API is slow.
            from google.api_core import retry
            response = vision_model.generate_content(
                [prompt, image],
            )
            content_text = response.text.replace("```json", "").replace("```", "").strip()
            print("Gemini Raw Response:", content_text)
            grade_data = json.loads(content_text)
            quality_grade = grade_data.get("quality_grade", "Grade B")
        except Exception as e:
            error_msg = str(e)
            print("Gemini Vision Error:", error_msg)
            with open("gemini_error.log", "w") as f:
                f.write(error_msg)
            quality_grade = f"FAIL: {error_msg[:12]}"  # Truncate to fit UI
        # =====================================================

        return jsonify({
            "top_prediction": results[0],
            "breakdown": results,
            "quality_grade": quality_grade
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 7860))
    app.run(host="0.0.0.0", port=port, debug=False)