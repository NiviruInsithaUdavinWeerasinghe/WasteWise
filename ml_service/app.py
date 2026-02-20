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

        return jsonify({
            "top_prediction": results[0],
            "breakdown": results
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(port=5000, debug=True)