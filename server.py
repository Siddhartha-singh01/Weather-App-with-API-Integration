import os
from flask import Flask, request, jsonify
import requests
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

OWM_KEY = os.environ.get('OPENWEATHER_API_KEY')

@app.get('/api/health')
def health():
    return jsonify({"status":"ok"})

@app.get('/api/geocode')
def geocode():
    q = request.args.get('location','')
    if not q:
        return jsonify({"error":"location is required"}), 400
    if OWM_KEY:
        u = f"https://api.openweathermap.org/geo/1.0/direct?q={requests.utils.quote(q)}&limit=1&appid={OWM_KEY}"
        r = requests.get(u, timeout=15)
        if r.status_code == 200:
            j = r.json()
            if j:
                return jsonify({"lat": j[0]['lat'], "lon": j[0]['lon'], "name": j[0]['name']})
    # Fallback to Open-Meteo geocoding (no key required)
    mu = f"https://geocoding-api.open-meteo.com/v1/search?name={requests.utils.quote(q)}&count=1&language=en&format=json"
    mr = requests.get(mu, timeout=15)
    if mr.status_code != 200:
        return jsonify({"error":"geocoding failed"}), mr.status_code
    mj = mr.json()
    res = (mj.get('results') or [])
    if not res:
        return jsonify({"error":"location not found"}), 404
    first = res[0]
    name = f"{first.get('name','')}" + (f", {first.get('country','')}" if first.get('country') else '')
    return jsonify({"lat": first.get('latitude'), "lon": first.get('longitude'), "name": name})

@app.get('/api/onecall')
def onecall():
    lat = request.args.get('lat')
    lon = request.args.get('lon')
    if not lat or not lon:
        return jsonify({"error":"lat and lon required"}), 400
    if not OWM_KEY:
        return jsonify({"error":"OPENWEATHER_API_KEY not set"}), 500
    u = f"https://api.openweathermap.org/data/3.0/onecall?lat={lat}&lon={lon}&appid={OWM_KEY}&units=metric"
    r = requests.get(u, timeout=20)
    if r.status_code != 200:
        try:
            msg = r.json().get('message','onecall failed')
        except Exception:
            msg = 'onecall failed'
        return jsonify({"error": msg}), r.status_code
    return jsonify(r.json())

@app.get('/api/soil')
def soil():
    lat = request.args.get('lat')
    lon = request.args.get('lon')
    if not lat or not lon:
        return jsonify({"error":"lat and lon required"}), 400
    u = f"https://rest.isric.org/soilgrids/v2.0/properties/query?lat={lat}&lon={lon}&property=phh2o&depth=0-5cm&value=mean"
    r = requests.get(u, timeout=20)
    if r.status_code != 200:
        return jsonify({"error":"soil fetch failed"}), r.status_code
    j = r.json()
    try:
        layers = j.get('properties',{}).get('layers',[])
        layer = next((l for l in layers if l.get('name')=='phh2o'), None)
        v = layer.get('depths',[{}])[0].get('values',{}).get('mean') if layer else None
        if v is None:
            return jsonify({"error":"soil pH not available"}), 404
        return jsonify({"ph": v})
    except Exception:
        return jsonify({"error":"soil parse error"}), 500

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5501)
