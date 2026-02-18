import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.image import img_to_array
from PIL import Image
import io

app = Flask(__name__)
CORS(app)

print("Loading model...")
model = load_model('wastewise_model.h5')
# MAKE SURE THESE MATCH YOUR FOLDER NAMES EXACTLY (Alphabetical Order)
class_names = ['cotton', 'denim', 'polyester', 'silk_satin'] 
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
        
        # Get raw probabilities (e.g., [0.1, 0.8, 0.05, 0.05])
        prediction = model.predict(processed_image)[0]
        
        # Create a list of all materials with their scores
        results = []
        for i, score in enumerate(prediction):
            results.append({
                "material": class_names[i],
                "confidence": float(score)
            })
            
        # Sort them: Highest confidence first
        results.sort(key=lambda x: x["confidence"], reverse=True)

        return jsonify({
            "top_prediction": results[0],
            "breakdown": results # Send ALL probabilities back to React
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(port=5000, debug=True)