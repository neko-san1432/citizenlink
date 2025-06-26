import pandas as pd
import numpy as np
import folium
from sklearn.cluster import KMeans

# Load your location data (make sure your CSV has these columns)
df = pd.read_csv("../mock/knn_location_points.csv")  # 👈 change to your path if needed
assert 'Latitude' in df.columns and 'Longitude' in df.columns, "CSV must contain Latitude and Longitude columns."

# Parameters
NUM_CLUSTERS = 5  # 👈 change this to increase/decrease number of territories

# Step 1: K-Means clustering to form territories
kmeans = KMeans(n_clusters=NUM_CLUSTERS, random_state=42)
df['Cluster'] = kmeans.fit_predict(df[['Latitude', 'Longitude']])

# Step 2: Assign colors for each cluster
color_palette = ["#0077ff", "#28a745", "#ffc107", "#dc3545", "#6610f2", "#17a2b8", "#ff66cc", "#9933ff"]
cluster_colors = {i: color_palette[i % len(color_palette)] for i in range(NUM_CLUSTERS)}

# Step 3: Create map
map_center = [df["Latitude"].mean(), df["Longitude"].mean()]
m = folium.Map(location=map_center, zoom_start=15, tiles="cartodbpositron")

# Step 4: Add clustered points to map
for _, row in df.iterrows():
    lat, lon = row['Latitude'], row['Longitude']
    cluster_id = row['Cluster']
    color = cluster_colors[cluster_id]
    
    tooltip = f"Cluster: {cluster_id}<br>Lat: {lat:.5f}<br>Lon: {lon:.5f}"
    popup_content = f"""
    <b>Location Info</b><br>
    Cluster: {cluster_id}<br>
    Latitude: {lat}<br>
    Longitude: {lon}
    """
    
    folium.Circle(
        location=[lat, lon],
        radius=5,
        color=color,
        fill=True,
        fill_color=color,
        fill_opacity=0.6,
        tooltip=tooltip,
        popup=folium.Popup(popup_content, max_width=300)
    ).add_to(m)

# Step 5: Add legend
legend_html = """
<div style='position: fixed; bottom: 50px; left: 50px; width: 170px; z-index: 1000;
    background-color: white; padding: 10px; border:2px solid grey; border-radius:8px;
    box-shadow: 2px 2px 6px rgba(0,0,0,0.3); font-size: 14px;'>
<b>Cluster Territories</b><br>
"""
for i in range(NUM_CLUSTERS):
    legend_html += f"<i style='background:{cluster_colors[i]}; width:12px; height:12px; display:inline-block; margin-right:6px;'></i>Cluster {i}<br>"
legend_html += "</div>"
m.get_root().html.add_child(folium.Element(legend_html))

# Step 6: Save map to HTML
m.save("heatmap.html")
print("✅ Map saved to 'heatmap.html'")
