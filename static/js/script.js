// Select elements
const showDetails = document.querySelector(".showDetails");
const fullAddress = document.querySelector(".fullAddress");
const formattedAddress = document.querySelector('.formattedAddress');
const weatherInfo = document.querySelector('.weatherInfo');
const details = document.getElementById('details');
const diseaseDetectionBtn = document.getElementById('diseaseDetectionBtn');
const soilMoistureBtn = document.getElementById('soilMoistureBtn');
const cropYieldBtn = document.getElementById('cropYieldBtn');
const showRecommendedBtn = document.getElementById('showRecommended');
const showNotRecommendedBtn = document.getElementById('showNotRecommended');

// API endpoint and keys
const apiEndpoint = "https://api.opencagedata.com/geocode/v1/json";
const apiKey = "5682020787b7446288248d0011ce7348";
const weatherApiUrl = "https://api.open-meteo.com/v1/forecast"; // Open-Meteo API endpoint

// Function to recommend crops based on weather data
function recommendCrops(temperature, humidity, precipitation) {
    let recommendations = {
        recommended: [],
        notRecommended: [],
        advice: ""
    };

    // Example logic
    if (temperature > 30) {
        recommendations.recommended.push("Corn", "Rice", "Sorghum");
        recommendations.notRecommended.push("Wheat", "Barley");
    } else if (temperature < 15) {
        recommendations.recommended.push("Wheat", "Barley", "Peas");
        recommendations.notRecommended.push("Corn", "Rice");
    }

    if (humidity > 80) {
        recommendations.recommended.push("Rice", "Sugarcane");
        recommendations.notRecommended.push("Potatoes", "Onions");
    }

    if (precipitation > 10) {
        recommendations.recommended.push("Rice", "Sugarcane");
        recommendations.notRecommended.push("Cotton", "Tomatoes");
    }

    if (precipitation === 0 && temperature > 25) {
        recommendations.advice = "It's very dry, you might want to wait for some rain before planting.";
    }

    return recommendations;
}

// Function to display crop recommendations with images
function displayRecommendations(recommendations) {
    // Check if the recommendation list already exists and remove it if it does
    const existingRecommendationDiv = document.getElementById('cropLists');
    if (existingRecommendationDiv) {
        existingRecommendationDiv.innerHTML = ''; // Clear existing content
    }

    // Helper function to get the image source for each crop
    function getImageSrc(crop) {
        const cropImages = {
            "Corn": "path/to/corn_image.jpg",
            "Rice": "path/to/rice_image.jpg",
            "Sorghum": "path/to/sorghum_image.jpg",
            "Wheat": "path/to/wheat_image.jpg",
            "Barley": "path/to/barley_image.jpg",
            "Peas": "path/to/peas_image.jpg",
            "Sugarcane": "path/to/sugarcane_image.jpg",
            "Potatoes": "path/to/potatoes_image.jpg",
            "Onions": "path/to/onions_image.jpg",
            "Cotton": "path/to/cotton_image.jpg",
            "Tomatoes": "path/to/tomatoes_image.jpg"
        };
        return cropImages[crop] || "path/to/default_image.jpg"; // Default image if crop is not found
    }

    // Create the table rows with images
    const createTableRows = (crops) => {
        return crops.map(crop => 
            `<li>
                <img src="${getImageSrc(crop)}" alt="${crop}" style="width:50px; height:50px; vertical-align: middle;"> ${crop}
            </li>`
        ).join('');
    };

    // Create a new div to hold the crop recommendations
    const recommendationDiv = document.createElement('div');
    recommendationDiv.id = 'cropLists';
    recommendationDiv.innerHTML = `
        <div id="recommendedCrops" style="display: none;">
            <h3>Recommended Crops</h3>
            <ul style="list-style-type: none; padding: 0;">${createTableRows(recommendations.recommended)}</ul>
        </div>
        <div id="notRecommendedCrops" style="display: none;">
            <h3>Not Recommended Crops</h3>
            <ul style="list-style-type: none; padding: 0;">${createTableRows(recommendations.notRecommended)}</ul>
        </div>
        ${recommendations.advice ? `<p style="margin-top: 20px;">${recommendations.advice}</p>` : ''}
    `;

    // Append the recommendations after the weather info
    details.appendChild(recommendationDiv);
}


// API to get user address
const getUserCurrentAddress = async (latitude, longitude) => {
    let query = `${latitude},${longitude}`;
    let apiUrl = `${apiEndpoint}?key=${apiKey}&q=${query}&pretty=1`;

    try {
        const res = await fetch(apiUrl);
        if (!res.ok) {
            throw new Error(`HTTP error! Status: ${res.status}`);
        }
        const data = await res.json();

        const components = data.results[0].components;
        const city = components.city || components.town || components.village || "Unknown city";
        const state = components.state || "Unknown state";
        const postcode = components.postcode || "Unknown postcode";
        const country = components.country || "Unknown country";

        fullAddress.textContent = `User address: ${city}, ${postcode}, ${state}, ${country}`;
        formattedAddress.textContent = `User full address: ${data.results[0].formatted || "Unknown address"}`;
        
        // Get weather information
        getWeatherData(latitude, longitude);

    } catch (error) {
        console.log("Error fetching address:", error);
    }
};

// API to get weather data from Open-Meteo
const getWeatherData = async (latitude, longitude) => {
    let weatherApiParams = new URLSearchParams({
        latitude: latitude,
        longitude: longitude,
        hourly: "temperature_2m,relative_humidity_2m,precipitation"
    });
    
    let weatherApiFullUrl = `${weatherApiUrl}?${weatherApiParams.toString()}`;

    try {
        const res = await fetch(weatherApiFullUrl);
        if (!res.ok) {
            throw new Error(`HTTP error! Status: ${res.status}`);
        }
        const weatherData = await res.json();
        console.log(weatherData); // Log the entire response

        // Check if 'hourly' data exists in the response
        if (weatherData.hourly) {
            const temperature = weatherData.hourly.temperature_2m[0];
            const humidity = weatherData.hourly.relative_humidity_2m[0];
            const precipitation = weatherData.hourly.precipitation[0];

            weatherInfo.textContent = `
                Current temperature: ${temperature}°C,
                Humidity: ${humidity}%,
                Precipitation: ${precipitation}mm
            `;
            
            // Recommend crops based on weather data
            const recommendations = recommendCrops(temperature, humidity, precipitation);
            displayRecommendations(recommendations);
            details.style.display = 'block'; // Show the details
        } else {
            weatherInfo.textContent = "Weather data not available.";
        }
    } catch (error) {
        console.log("Error fetching weather data:", error);
    }
};

// Function to handle geolocation success
const onGeoSuccess = (position) => {
    const { latitude, longitude } = position.coords;

    showDetails.textContent = `Latitude: ${latitude}, Longitude: ${longitude}`;

    // Fetch user's current address using latitude and longitude
    getUserCurrentAddress(latitude, longitude);
};

// Function to handle geolocation errors
const onGeoError = (error) => {
    console.error('Geolocation Error:', error.message);
    showDetails.textContent = `Error getting location: ${error.message}`;
};

// Get geolocation
const getUserLocation = () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(onGeoSuccess, onGeoError);
    } else {
        showDetails.textContent = "Geolocation is not supported by this browser.";
    }
};

// Event listener for geolocation button
document.querySelector(".geoBtn").addEventListener("click", getUserLocation);

// Show the crop yield form when the button is clicked
cropYieldBtn.addEventListener('click', () => {
    document.getElementById('cropYieldForm').style.display = 'block';
});

// Function to calculate crop yield
function calculateYield() {
    const cropType = document.getElementById('cropType').value;
    const soilQuality = document.getElementById('soilQuality').value;
    const fertilizerUsed = document.getElementById('fertilizerUsed').value;
    const waterSupply = document.getElementById('waterSupply').value;

    let yieldEstimate;

    // Example logic for yield calculation
    if (cropType === 'corn') {
        yieldEstimate = (fertilizerUsed * 1.2) + (waterSupply * 0.8);
    } else if (cropType === 'wheat') {
        yieldEstimate = (fertilizerUsed * 1.1) + (waterSupply * 0.9);
    } else if (cropType === 'rice') {
        yieldEstimate = (fertilizerUsed * 1.3) + (waterSupply * 0.7);
    }

    // Display the result
    document.getElementById('yieldResult').textContent = `Estimated yield for ${cropType}: ${yieldEstimate.toFixed(2)} tons/ha`;
}

// Handle soil moisture analysis
const analyzeSoilBtn = document.getElementById('analyzeSoilBtn');
const soilImageInput = document.getElementById('soilImageInput');
const soilMoistureResult = document.getElementById('soilMoistureResult');

// Dummy function to simulate soil moisture detection
function analyzeSoilMoisture(image) {
    // This function would normally send the image to a server or run an analysis
    // Here, we'll just simulate a result
    const simulatedMoistureLevel = Math.random() * 100; // Random moisture level
    return simulatedMoistureLevel.toFixed(2); // Return as a percentage
}

analyzeSoilBtn.addEventListener('click', () => {
    const soilImage = soilImageInput.files[0];
    if (soilImage) {
        const moistureLevel = analyzeSoilMoisture(soilImage);
        soilMoistureResult.textContent = `Estimated Soil Moisture Level: ${moistureLevel}%`;
    } else {
        soilMoistureResult.textContent = "Please upload an image of the soil to analyze.";
    }
});

// Handle crop disease detection
// const cropDiseaseImage = document.getElementById('cropDiseaseImage');
// const uploadImageBtn = document.getElementById('uploadImageBtn');
// const diseaseDetectionResult = document.getElementById('diseaseDetectionResult');

// // Function to handle the image upload
// function handleImageUpload(event) {
//     const file = event.target.files[0];
//     if (file) {
//         const reader = new FileReader();
//         reader.onload = function(e) {
//             const imageSrc = e.target.result;
//             detectCropDisease(imageSrc); // Call the function to detect crop disease
//         };
//         reader.readAsDataURL(file);
//     }
// }

// // Function to detect crop disease (this would be more complex in a real application)
// function detectCropDisease(imageSrc) {
//     // Placeholder for image processing logic
//     // In a real-world application, you might send the image to a backend server
//     // that runs a machine learning model to detect crop diseases.
    
//     // For now, let's assume it detects a disease based on a simple condition:
//     const dummyResult = "Disease detected: Blight";
    
//     diseaseDetectionResult.innerHTML = `
//         <img src="${imageSrc}" alt="Uploaded Crop Image" style="width:200px; height:auto; margin-top:20px;">
//         <p>${dummyResult}</p>
//     `;
// }

// // Event listener for the upload button
// uploadImageBtn.addEventListener('click', () => {
//     cropDiseaseImage.click(); // Trigger the file input click
// });

// Event listener for when an image is selected
// cropDiseaseImage.addEventListener('change', handleImageUpload);

// Event listeners for showing crop recommendations
showRecommendedBtn.addEventListener('click', () => {
    const recommendedCrops = document.getElementById('recommendedCrops');
    recommendedCrops.style.display = recommendedCrops.style.display === 'none' ? 'block' : 'none';
});

showNotRecommendedBtn.addEventListener('click', () => {
    const notRecommendedCrops = document.getElementById('notRecommendedCrops');
    notRecommendedCrops.style.display = notRecommendedCrops.style.display === 'none' ? 'block' : 'none';
});

// Function to handle the image upload and send it to the backend for prediction
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const formData = new FormData();
        formData.append('file', file);

        fetch('http://localhost:5000/predict', {
            method: 'POST',
            body: formData,
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                diseaseDetectionResult.textContent = `Error: ${data.error}`;
            } else {
                diseaseDetectionResult.innerHTML = `
                    <img src="${URL.createObjectURL(file)}" alt="Uploaded Crop Image" style="width:200px; height:auto; margin-top:20px;">
                    <p>Disease detected: ${data.prediction}</p>
                `;
            }
            diseaseDetectionResult.style.animation = 'fadeIn 1s';
        })
        .catch(error => {
            diseaseDetectionResult.textContent = `Error: ${error.message}`;
            diseaseDetectionResult.style.animation = 'fadeIn 1s';
        });
    }
}

// Event listener for the image upload button
uploadImageBtn.addEventListener('click', () => {
    cropDiseaseImage.click();
});

// Event listener for when an image is selected
cropDiseaseImage.addEventListener('change', handleImageUpload);