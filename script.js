let SKEY = "lab4"
let MAX = 5

let st = {
	locations: [],
	selectedId: null
}
 
let picked = null
let timer = null

function g(id){
	return document.getElementById(id)
}

function rid(){
	return Math.random().toString(16).slice(2) + Date.now().toString(16)
}

function save(){
	localStorage.setItem(SKEY, JSON.stringify(st))
}

function load(){
	try{
		let t = localStorage.getItem(SKEY)
		if(!t) return false
		let d = JSON.parse(t)
		if(!d || !Array.isArray(d.locations)) return false
		st = d
		if(!st.selectedId && st.locations[0]) st.selectedId = st.locations[0].id
		return true
	}catch(e){
		return false
	}
}

function status(t, isErr){
	let s = g("status")
	s.classList.remove("hide")
	s.classList.remove("statusErr")
	if(isErr) s.classList.add("statusErr")
	s.textContent = t
}

function statusOff(){
	let s = g("status")
	s.classList.add("hide")
	s.textContent = ""
	s.classList.remove("statusErr")
}

function modalOpen(){
	picked = null
	g("inpCity").value = ""
	g("err").classList.add("hide")
	g("err").textContent = ""
	g("sug").classList.add("hide")
	g("sug").innerHTML = ""
	g("back").classList.remove("hide")
	g("modal").classList.remove("hide")
	setTimeout(() => g("inpCity").focus(), 0)
}

function modalClose(){
	g("back").classList.add("hide")
	g("modal").classList.add("hide")
}

function cntCities(){
	let c = 0
	for(let i = 0; i < st.locations.length; i++){
		if(st.locations[i].type === "city") c++
	}
	return c
}

function selLoc(){
	for(let i = 0; i < st.locations.length; i++){
		if(st.locations[i].id === st.selectedId) return st.locations[i]
	}
	return null
}

function pickOnReload(){
	let geo = null

	for(let i = 0; i < st.locations.length; i++){
		if(st.locations[i].type === "geo") geo = st.locations[i]
	}

	if(geo){
		st.selectedId = geo.id
	}else{
		st.selectedId = st.locations[0] ? st.locations[0].id : null
	}
}

function txtCode(c){
	let m = {
		0:"Ясно",
		1:"Преимущественно ясно",
		2:"Переменная облачность",
		3:"Пасмурно",
		45:"Туман",
		48:"Изморозь/туман",
		51:"Морось (слабая)",
		53:"Морось (умеренная)",
		55:"Морось (сильная)",
		61:"Дождь (слабый)",
		63:"Дождь (умеренный)",
		65:"Дождь (сильный)",
		71:"Снег (слабый)",
		73:"Снег (умеренный)",
		75:"Снег (сильный)",
		80:"Ливень (слабый)",
		81:"Ливень (умеренный)",
		82:"Ливень (сильный)",
		95:"Гроза",
		96:"Гроза с градом",
		99:"Гроза с сильным градом"
	}
	return m[c] || ("Код погоды: " + c)
}

function dateRu(s){
	let a = s.split("-")
	let d = new Date(Number(a[0]), Number(a[1]) - 1, Number(a[2]))
	return d.toLocaleDateString("ru-RU", { weekday:"short", day:"2-digit", month:"2-digit" })
}

function renderLocs(){
	let box = g("locList")
	box.innerHTML = ""

	if(!st.locations.length){
		g("emptyBox").classList.remove("hide")
		g("weatherBox").classList.add("hide")
		g("meta").textContent = "—"
		return
	}

	g("emptyBox").classList.add("hide")

	for(let i = 0; i < st.locations.length; i++){
		let x = st.locations[i]
		let name = (x.type === "geo") ? "Текущее местоположение" : x.name
		let on = (x.id === st.selectedId) ? " chipOn" : ""
		let del = ""

		if(x.type === "city"){
			del = `<button class="chipDel" data-del="${x.id}" type="button">×</button>`
		}

		box.innerHTML += `
			<div class="chip${on}" data-id="${x.id}">
				<span class="chipName">${name}</span>
				${del}
			</div>
		`
	}

	let chips = box.querySelectorAll("[data-id]")
	for(let i = 0; i < chips.length; i++){
		chips[i].onclick = function(){
			let id = this.getAttribute("data-id")
			st.selectedId = id
			save()
			renderLocs()
			loadWeather()
		}
	}

	let dels = box.querySelectorAll("[data-del]")
	for(let i = 0; i < dels.length; i++){
		dels[i].onclick = function(e){
			e.stopPropagation()
			let id = this.getAttribute("data-del")
			removeCity(id)
		}
	}
}

function removeCity(id){
	let found = null
	for(let i = 0; i < st.locations.length; i++){
		if(st.locations[i].id === id) found = st.locations[i]
	}
	if(!found) return
	if(found.type !== "city") return

	let arr = []
	for(let i = 0; i < st.locations.length; i++){
		if(st.locations[i].id !== id) arr.push(st.locations[i])
	}
	st.locations = arr

	if(st.selectedId === id){
		let geo = null
		for(let i = 0; i < st.locations.length; i++){
			if(st.locations[i].type === "geo") geo = st.locations[i]
		}
		if(geo) st.selectedId = geo.id
		else st.selectedId = st.locations[0] ? st.locations[0].id : null
	}

	save()
	renderLocs()
	loadWeather()
}

function renderWeather(loc, data){
	let cw = data.current_weather
	let d = data.daily

	let days = d.time.slice(0, 3)
	let codes = d.weathercode.slice(0, 3)
	let mx = d.temperature_2m_max.slice(0, 3)
	let mn = d.temperature_2m_min.slice(0, 3)

	if(loc.type === "geo"){
		g("meta").textContent = "Локация: Текущее местоположение"
	}else{
		g("meta").textContent = "Локация: " + loc.name + (loc.country ? (", " + loc.country) : "")
	}

	g("tempNow").textContent = Math.round(cw.temperature) + "°C"
	g("descNow").textContent = txtCode(cw.weathercode)
	g("windNow").textContent = Math.round(cw.windspeed) + " км/ч"
	g("tMax").textContent = Math.round(mx[0]) + "°C"
	g("tMin").textContent = Math.round(mn[0]) + "°C"

	let out = ""
	for(let i = 0; i < 3; i++){
        let title = ""

        if(i === 0){
            title = "Сегодня"
        }else{
            title = dateRu(days[i])
        }

        out += `
            <div class="day">
                <div class="dayDate">${title}</div>
                <div class="dayTemp">${Math.round(mx[i])}° / ${Math.round(mn[i])}°</div>
                <div class="dayDesc">${txtCode(codes[i])}</div>
            </div>
        `
    }
	g("days").innerHTML = out
}

async function loadWeather(){
	let loc = selLoc()
	if(!loc){
		renderLocs()
		return
	}

	statusOff()
	g("weatherBox").classList.add("hide")
	status("Загрузка прогноза...", false)

	try{
		let u = new URL("https://api.open-meteo.com/v1/forecast")
		u.searchParams.set("latitude", String(loc.lat))
		u.searchParams.set("longitude", String(loc.lon))
		u.searchParams.set("current_weather", "true")
		u.searchParams.set("daily", "weathercode,temperature_2m_max,temperature_2m_min")
		u.searchParams.set("timezone", loc.timezone || "auto")

		let r = await fetch(u.toString())
		if(!r.ok) throw new Error("Не удалось получить прогноз")
		let data = await r.json()

		statusOff()
		g("weatherBox").classList.remove("hide")
		renderWeather(loc, data)
	}catch(e){
		g("weatherBox").classList.add("hide")
		status("Ошибка при получении данных о погоде", true)
	}
}

async function geoStart(){
	if(!("geolocation" in navigator)){
		status("Геолокация не поддерживается. Добавь город вручную.", true)
		modalOpen()
		return
	}

	status("Запрашиваем геолокацию...", false)

	navigator.geolocation.getCurrentPosition(
		(p) => {
			statusOff()
			let lat = p.coords.latitude
			let lon = p.coords.longitude

			let geo = null
			for(let i = 0; i < st.locations.length; i++){
				if(st.locations[i].type === "geo") geo = st.locations[i]
			}

			if(!geo){
				geo = { id: rid(), type:"geo", name:"Текущее местоположение", lat:lat, lon:lon, timezone:"auto" }
				st.locations.unshift(geo)
			}else{
				geo.lat = lat
				geo.lon = lon
			}

			st.selectedId = geo.id
			save()
			renderLocs()
			loadWeather()
		},
		() => {
			status("Доступ к геолокации отклонён. Добавь город вручную.", true)
			renderLocs()
			modalOpen()
		},
		{ enableHighAccuracy:false, timeout:8000 }
	)
}

async function suggest(q){
	let u = new URL("https://geocoding-api.open-meteo.com/v1/search")
	u.searchParams.set("name", q)
	u.searchParams.set("count", "6")
	u.searchParams.set("language", "ru")
	u.searchParams.set("format", "json")

	let r = await fetch(u.toString())
	if(!r.ok) return []
	let d = await r.json()
	if(!Array.isArray(d.results)) return []
	return d.results
}

function renderSug(items){
	let box = g("sug")
	box.innerHTML = ""

	if(!items.length){
		box.classList.add("hide")
		return
	}

	box.classList.remove("hide")

	for(let i = 0; i < items.length; i++){
		let it = items[i]
		let meta = []
		if(it.admin1) meta.push(it.admin1)
		if(it.country) meta.push(it.country)

		box.innerHTML += `
			<div class="sugItem"
				data-name="${(it.name || "").replace(/"/g, "&quot;")}"
				data-lat="${it.latitude}"
				data-lon="${it.longitude}"
				data-country="${(it.country || "").replace(/"/g, "&quot;")}"
				data-admin1="${(it.admin1 || "").replace(/"/g, "&quot;")}"
				data-timezone="${(it.timezone || "").replace(/"/g, "&quot;")}">
				<div><div class="sugName">${it.name}</div></div>
				<div class="sugMeta">${meta.join(", ")}</div>
			</div>
		`
	}

	let rows = box.querySelectorAll(".sugItem")
	for(let i = 0; i < rows.length; i++){
		rows[i].onclick = function(){
			picked = {
				name: this.getAttribute("data-name"),
				lat: Number(this.getAttribute("data-lat")),
				lon: Number(this.getAttribute("data-lon")),
				country: this.getAttribute("data-country") || "",
				admin1: this.getAttribute("data-admin1") || "",
				timezone: this.getAttribute("data-timezone") || "auto"
			}

			g("inpCity").value = [picked.name, picked.admin1, picked.country].filter(Boolean).join(", ")
			g("err").classList.add("hide")
			g("err").textContent = ""
			g("sug").classList.add("hide")
			g("sug").innerHTML = ""
		}
	}
}

function addPicked(){
	let e = g("err")
	e.classList.add("hide")
	e.textContent = ""

	if(cntCities() >= MAX){
		e.textContent = "Нельзя добавить больше 5 городов."
		e.classList.remove("hide")
		return
	}

	if(!picked){
		e.textContent = "Выберите город из списка."
		e.classList.remove("hide")
		return
	}

	for(let i = 0; i < st.locations.length; i++){
		let x = st.locations[i]
		if(x.type === "city"){
			if(Math.abs(x.lat - picked.lat) < 0.0001 && Math.abs(x.lon - picked.lon) < 0.0001){
				e.textContent = "Этот город уже добавлен."
				e.classList.remove("hide")
				return
			}
		}
	}

	st.locations.push({
		id: rid(),
		type: "city",
		name: picked.name,
		lat: picked.lat,
		lon: picked.lon,
		country: picked.country,
		admin1: picked.admin1,
		timezone: picked.timezone || "auto"
	})

	st.selectedId = st.locations[st.locations.length - 1].id
	save()
	renderLocs()
	modalClose()
	loadWeather()
}

g("btnRefresh").onclick = function(){
	loadWeather()
}

g("btnAdd").onclick = function(){
	if(cntCities() >= MAX){
		status("Лимит: 5 добавленных городов.", true)
		return
	}
	modalOpen()
}

g("btnEmptyAdd").onclick = function(){
	if(cntCities() >= MAX){
		status("Лимит: 5 добавленных городов.", true)
		return
	}
	modalOpen()
}

g("btnClose").onclick = modalClose
g("btnCancel").onclick = modalClose
g("back").onclick = modalClose

g("btnOk").onclick = function(){
	addPicked()
}

g("inpCity").oninput = function(){
	picked = null
	g("err").classList.add("hide")
	g("err").textContent = ""

	let q = this.value.trim()

	if(q.length < 2){
		g("sug").classList.add("hide")
		g("sug").innerHTML = ""
		return
	}

	if(timer) clearTimeout(timer)
	timer = setTimeout(async () => {
		let items = await suggest(q)
		renderSug(items)
	}, 250)
}

;(function(){
	let ok = load()

	if(ok && st.locations.length){
		pickOnReload()
		save()
		renderLocs()
		loadWeather()
	}else{
		renderLocs()
		geoStart()
	}
})()

