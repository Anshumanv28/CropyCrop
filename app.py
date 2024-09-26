from flask import Flask, request, jsonify, render_template
from werkzeug.utils import secure_filename
import os
from flask_cors import CORS
import tensorflow as tf
from tensorflow.keras.preprocessing import image
import numpy as np
import json

app = Flask(__name__)
CORS(app)

# Directory to save uploaded files
UPLOAD_FOLDER = 'uploads/'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Allowed file extensions for image uploads
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

# Load the trained model once when the app starts
model = tf.keras.models.load_model('crop_disease_final_model.keras')

# Load the class indices (mapping of class names to indices)
with open('class_indices.json', 'r') as f:
    class_indices = json.load(f)

# Invert the dictionary to map indices to class names
class_labels = {v: k for k, v in class_indices.items()}

# Function to check if the uploaded file has a valid extension
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Function to save the uploaded file
def save_uploaded_file(file):
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)  # Secure the filename
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)  # File path
        file.save(file_path)  # Save the file to the uploads directory
        return file_path  # Return the file path for later use
    return None

# Function to predict the disease from an image using the loaded model
def predict_disease_from_image(image_path):
    # Load and preprocess the image
    img = image.load_img(image_path, target_size=(128, 128))  # Resize the image to the required size
    img_array = image.img_to_array(img)  # Convert image to numpy array
    img_array = np.expand_dims(img_array, axis=0)  # Add batch dimension (1, 128, 128, 3)
    img_array = img_array / 255.0  # Normalize the image (same as during training)

    # Predict using the loaded model
    predictions = model.predict(img_array)
    predicted_class = np.argmax(predictions, axis=1)  # Get the index of the class with the highest probability

    # Get the corresponding disease label
    disease_label = class_labels.get(predicted_class[0], "Unknown disease")
    
    return disease_label

# Serve the index.html as the homepage
@app.route('/')
def index():
    return render_template('index.html')

# Route for handling image uploads and predicting the disease
@app.route('/predict', methods=['POST'])
def predict():
    # Check if the POST request contains a file part
    if 'file' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400

    file = request.files['file']

    # Check if a file was selected
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400

    # Save the uploaded file
    file_path = save_uploaded_file(file)
    if file_path is None:
        return jsonify({"error": "Invalid file format"}), 400

    # Use the saved file to predict the disease
    prediction = predict_disease_from_image(file_path)

    # Return the prediction as JSON
    return jsonify({"prediction": prediction})

# Main entry point of the application
if __name__ == '__main__':
    # Ensure the uploads folder exists; create it if it doesn't
    if not os.path.exists(UPLOAD_FOLDER):
        os.makedirs(UPLOAD_FOLDER)
    
    # Run the Flask app in debug mode
    app.run(debug=True)
