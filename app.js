const qs = s => document.querySelector(s)
const form = qs('#query-form')
const statusEl = qs('#status')
const avgTempEl = qs('#avg-temp')
const totalRainEl = qs('#total-rain')
const soilPhEl = qs('#soil-ph')
const phFallback = qs('#soil-ph-fallback')
const manualPhInput = qs('#manual-ph')
const applyPhBtn = qs('#apply-ph')
const clearPhBtn = qs('#clear-ph')
const weatherFallback = qs('#weather-fallback')
const manualTempInput = qs('#manual-temp')
const manualRainInput = qs('#manual-rain')
const applyWeatherBtn = qs('#apply-weather')
const clearWeatherBtn = qs('#clear-weather')
const suggestionsEl = qs('#suggestions')
const submitBtn = qs('#query-form button[type="submit"]')
let rainChart
let model = {lat:null,lon:null,avgTemp:null,totalRain:null,soilPh:null}
const API_BASE = 'http://127.0.0.1:5501'
let suggestTimer

async function geocodeCity(apiKey, q){
  const u = `${API_BASE}/api/geocode?location=${encodeURIComponent(q)}`
  const r = await fetch(u)
  let j
  try{ j = await r.json() }catch{ j = null }
  if(!r.ok) throw new Error(j?.error || 'Geocoding failed')
  if(typeof j.lat !== 'number') throw new Error('Location not found')
  return {lat:j.lat, lon:j.lon, name:j.name}
}

async function fetchOneCall(apiKey, lat, lon){
  const u = `${API_BASE}/api/onecall?lat=${lat}&lon=${lon}`
  const r = await fetch(u)
  let j
  try{ j = await r.json() }catch{ j = null }
  if(!r.ok) throw new Error(j?.error || 'Weather fetch failed')
  return j
}

async function fetchSoilPh(lat, lon){
  const u = `${API_BASE}/api/soil?lat=${lat}&lon=${lon}`
  const r = await fetch(u)
  let j
  try{ j = await r.json() }catch{ j = null }
  if(!r.ok) throw new Error(j?.error || 'Soil pH fetch failed')
  const v = j?.ph ?? (j?.properties?.layers?.find(l=>l.name==='phh2o')?.depths?.[0]?.values?.mean)
  if(typeof v !== 'number') throw new Error('Soil pH not available')
  return v
}

function computeRainfallDaily(daily){
  if(!Array.isArray(daily)) return {labels:[],data:[],total:0}
  const days = daily.slice(0,7)
  const labels = days.map(d=>new Date(d.dt*1000).toLocaleDateString())
  const data = days.map(d=>{
    if(typeof d.rain === 'number') return d.rain
    const p = d?.summary?.precipitation
    return typeof p === 'number' ? p : 0
  })
  const total = data.reduce((a,b)=>a+b,0)
  return {labels,data,total}
}

function computeAvgTemp(daily){
  if(!Array.isArray(daily)) return 0
  const days = daily.slice(0,7)
  const temps = days.map(d=>{
    const t = d.temp
    if(typeof t?.day === 'number') return t.day
    if(typeof t?.min === 'number' && typeof t?.max === 'number') return (t.min+t.max)/2
    return 0
  })
  const avg = temps.reduce((a,b)=>a+b,0)/temps.length
  return Number(avg.toFixed(1))
}

function scoreRange(x, min, max){
  if(x < min || x > max) return 0
  const mid = (min+max)/2
  const span = (max-min)/2
  return Math.max(0, 1 - Math.abs(x-mid)/span)
}

function recommendCrops(avgTemp, totalRain, soilPh){
  const defs = [
    {name:'Rice', temp:[18,26], rain:[70,200], ph:[5.0,6.5]},
    {name:'Wheat', temp:[10,20], rain:[20,60], ph:[6.0,7.5]},
    {name:'Maize', temp:[20,30], rain:[40,100], ph:[5.5,7.0]},
    {name:'Cotton', temp:[25,35], rain:[10,40], ph:[6.0,8.0]},
    {name:'Soybean', temp:[20,30], rain:[30,90], ph:[6.0,7.5]},
    {name:'Millets', temp:[25,35], rain:[0,30], ph:[5.0,7.5]}
  ]
  const items = defs.map(d=>{
    const sT = scoreRange(avgTemp, d.temp[0], d.temp[1])
    const sR = scoreRange(totalRain, d.rain[0], d.rain[1])
    const sP = scoreRange(soilPh, d.ph[0], d.ph[1])
    return {name:d.name, score:Number(((sT*0.4)+(sR*0.4)+(sP*0.2)).toFixed(2))}
  }).filter(x=>x.score>0.15)
  return items.sort((a,b)=>b.score-a.score)
}

function renderChart(labels, data){
  const ctx = qs('#rainChart')
  if(rainChart) rainChart.destroy()
  if(!labels.length){
    ctx.getContext('2d').clearRect(0,0,ctx.width,ctx.height)
    return
  }
  rainChart = new Chart(ctx,{type:'bar',data:{labels,datasets:[{label:'Rain (mm)',data,backgroundColor:'#22c55e'}]},options:{plugins:{legend:{display:false}},scales:{y:{beginAtZero:true}}}})
}

function renderRecommendations(list){
  const el = qs('#crop-list')
  el.innerHTML = ''
  if(!list.length){
    el.innerHTML = '<li>No strong matches. Adjust pH or check forecast.</li>'
    return
  }
  list.forEach(i=>{
    const li = document.createElement('li')
    const n = document.createElement('div')
    n.textContent = i.name
    const s = document.createElement('div')
    s.className = 'score'
    s.textContent = `Match: ${(i.score*100).toFixed(0)}%`
    li.appendChild(n)
    li.appendChild(s)
    el.appendChild(li)
  })
}

function updateMetrics(){
  avgTempEl.textContent = model.avgTemp!=null?model.avgTemp:'—'
  totalRainEl.textContent = model.totalRain!=null?model.totalRain:'—'
  soilPhEl.textContent = model.soilPh!=null?model.soilPh:'—'
  if(model.avgTemp!=null && model.totalRain!=null && model.soilPh!=null){
    const recs = recommendCrops(model.avgTemp, model.totalRain, model.soilPh)
    renderRecommendations(recs)
  }
}

applyPhBtn.addEventListener('click',()=>{
  const v = parseFloat(manualPhInput.value)
  if(!isNaN(v)){
    model.soilPh = Number(v.toFixed(2))
    updateMetrics()
  }
})

clearPhBtn.addEventListener('click',()=>{
  manualPhInput.value = ''
  model.soilPh = null
  phFallback.classList.add('hidden')
  updateMetrics()
})

applyWeatherBtn.addEventListener('click',()=>{
  const t = parseFloat(manualTempInput.value)
  const r = parseFloat(manualRainInput.value)
  if(!isNaN(t)) model.avgTemp = Number(t.toFixed(1))
  if(!isNaN(r)) model.totalRain = Number(r.toFixed(1))
  if(!isNaN(r)) renderChart(['Manual'], [model.totalRain])
  updateMetrics()
})

clearWeatherBtn.addEventListener('click',()=>{
  manualTempInput.value = ''
  manualRainInput.value = ''
  model.avgTemp = null
  model.totalRain = null
  weatherFallback.classList.add('hidden')
  renderChart([], [])
  updateMetrics()
})

qs('#location').addEventListener('input', e=>{
  const q = e.target.value.trim()
  suggestionsEl.innerHTML = ''
  suggestionsEl.classList.add('hidden')
  if(suggestTimer) clearTimeout(suggestTimer)
  if(q.length < 2) return
  suggestTimer = setTimeout(async ()=>{
    try{
      const u = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=5&language=en&format=json`
      const r = await fetch(u)
      const j = await r.json()
      const list = (j.results||[]).map(x=>({name:x.name, country:x.country}))
      if(!list.length) return
      suggestionsEl.innerHTML = ''
      list.forEach(it=>{
        const li = document.createElement('li')
        li.textContent = `${it.name}${it.country?`, ${it.country}`:''}`
        li.addEventListener('click',()=>{
          qs('#location').value = li.textContent
          suggestionsEl.classList.add('hidden')
        })
        suggestionsEl.appendChild(li)
      })
      suggestionsEl.classList.remove('hidden')
    }catch{}
  }, 250)
})

window.addEventListener('click', e=>{
  if(!suggestionsEl.contains(e.target) && e.target !== qs('#location')){
    suggestionsEl.classList.add('hidden')
  }
})

form.addEventListener('submit', async e=>{
  e.preventDefault()
  const q = qs('#location').value.trim()
  statusEl.textContent = 'Fetching location…'
  submitBtn.setAttribute('disabled','true')
  phFallback.classList.add('hidden')
  try{
    const loc = await geocodeCity('', q)
    model.lat = loc.lat
    model.lon = loc.lon
    statusEl.textContent = 'Fetching weather…'
    try{
      const weather = await fetchOneCall('', loc.lat, loc.lon)
      const rain = computeRainfallDaily(weather.daily)
      const avgT = computeAvgTemp(weather.daily)
      model.avgTemp = avgT
      model.totalRain = Number(rain.total.toFixed(1))
      renderChart(rain.labels, rain.data.map(x=>Number(x.toFixed(1))))
    }catch(err){
      model.avgTemp = null
      model.totalRain = null
      weatherFallback.classList.remove('hidden')
      statusEl.textContent = 'Weather unavailable. Enter temp and rainfall manually.'
    }
    statusEl.textContent = 'Fetching soil pH…'
    try{
      const pH = await fetchSoilPh(loc.lat, loc.lon)
      model.soilPh = Number(pH.toFixed(2))
    }catch(err){
      model.soilPh = null
      phFallback.classList.remove('hidden')
      statusEl.textContent = 'Soil pH unavailable. Enter manually.'
    }
    updateMetrics()
    statusEl.textContent = 'Done.'
  }catch(err){
    statusEl.textContent = 'Error: '+err.message
  }
  submitBtn.removeAttribute('disabled')
  try{ localStorage.setItem('lastLocation', q) }catch{}
})

window.addEventListener('DOMContentLoaded',()=>{
  try{
    const last = localStorage.getItem('lastLocation')
    if(last) qs('#location').value = last
  }catch{}
})
