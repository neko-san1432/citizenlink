from flask import Flask, jsonify
from sklearn.neighbors import NearestNeighbors
import numpy as np

app = Flask(__name__)

# Sample data: latitude, longitude
complaints = [
    {"lat": 14.6, "lon": 120.98},
    {"lat": 14.61, "lon": 120.99},
    {"lat": 14.62, "lon": 120.975},
    {"lat": 14.63, "lon": 120.97},
]

@app.route('/knn_heatmap')
def knn_heatmap():
    coords = np.array([[c["lat"], c["lon"]] for c in complaints])
    
    # KNN: Find number of complaints in proximity
    nbrs = NearestNeighbors(n_neighbors=3, algorithm='ball_tree').fit(coords)
    distances, indices = nbrs.kneighbors(coords)
    
    results = []
    for i, point in enumerate(coords):
        intensity = sum(distances[i])  # or use len(indices[i]) or custom function
        results.append({
            "lat": point[0],
            "lon": point[1],
            "intensity": 1 / (intensity + 0.001)  # higher intensity = closer cluster
        })

    return jsonify(results)

if __name__ == '__main__':
    app.run(debug=True)
