(() => {
  "use strict";

  const DAY_MS = 86400000;
  const KS_PER_S = 0.001;
  const DEFAULT_POSITION = { latitude: 39.7456, longitude: -97.0892, altitude: 335 };
  const SEARCH_RADII_KM = [35, 75, 150, 300, 600];
  const TARGET_CODES = [
    "00060", "00061", "30208", "30209",
    "00065", "00072", "30207", "00062", "30210", "30211", "72019", "72020",
    "00010", "00011", "00300", "00095", "00094", "00400", "00402",
    "63680", "00076", "00070", "00045", "00118", "00119", "00120",
    "00121", "00122", "00123", "00124", "00125", "00126", "00127",
    "00128", "00129", "00193", "00055", "00020", "00025"
  ];

  const ROLE_CODES = {
    discharge: ["30209", "00061", "00060", "30208"],
    stage: ["30207", "00065", "00072"],
    reservoir: ["30211", "00062", "72020"],
    groundwaterDepth: ["30210", "72019"],
    temperature: ["00010", "00011"],
    oxygen: ["00300"],
    conductance: ["00095", "00094", "00402"],
    ph: ["00400"],
    turbidity: ["63680", "00076", "00070"],
    precipTotal: ["00045", "00118", "00119", "00120", "00121", "00122", "00123", "00193"],
    precipRate: ["00124", "00125", "00126", "00127", "00128", "00129"],
    streamVelocity: ["00055"]
  };

  const PARAMETER_REGISTRY = {
    "00060": ["VOLUMETRIC FLUID DISCHARGE", "m³·s⁻¹", convertDischarge],
    "00061": ["VOLUMETRIC FLUID DISCHARGE", "m³·s⁻¹", convertDischarge],
    "30208": ["VOLUMETRIC FLUID DISCHARGE", "m³·s⁻¹", convertDischarge],
    "30209": ["VOLUMETRIC FLUID DISCHARGE", "m³·s⁻¹", convertDischarge],
    "00065": ["GAGE HEIGHT FIELD", "m", convertLength],
    "00072": ["STREAM STAGE FIELD", "m", convertLength],
    "30207": ["GAGE HEIGHT FIELD", "m", convertLength],
    "00062": ["IMPOUNDED SURFACE ELEVATION", "m", convertLength],
    "30210": ["SUBSURFACE PIEZOMETRIC DEPTH", "m", convertLength],
    "30211": ["IMPOUNDED SURFACE ELEVATION", "m", convertLength],
    "72019": ["SUBSURFACE PIEZOMETRIC DEPTH", "m", convertLength],
    "72020": ["PIEZOMETRIC SURFACE ELEVATION", "m", convertLength],
    "00010": ["AQUEOUS THERMAL STATE", "K", convertTemperature],
    "00011": ["AQUEOUS THERMAL STATE", "K", convertTemperature],
    "00300": ["DISSOLVED OXYGEN CONCENTRATION", "kg·m⁻³", convertDissolvedMass],
    "00095": ["ELECTROLYTIC CONDUCTANCE", "S·m⁻¹", convertConductance],
    "00094": ["ELECTROLYTIC CONDUCTANCE", "S·m⁻¹", convertConductance],
    "00402": ["ELECTROLYTIC CONDUCTANCE", "S·m⁻¹", convertConductance],
    "00400": ["HYDROGEN ION ACTIVITY INDEX", "", convertUnitless],
    "63680": ["PARTICULATE OPTICAL OBSCURATION", "", convertUnitless],
    "00076": ["PARTICULATE OPTICAL OBSCURATION", "", convertUnitless],
    "00070": ["PARTICULATE OPTICAL OBSCURATION", "", convertUnitless],
    "00045": ["ATMOSPHERIC DIHYDROGEN MONOXIDE DEPOSITION", "kg·m⁻²", convertPrecipTotal],
    "00118": ["ATMOSPHERIC DIHYDROGEN MONOXIDE DEPOSITION", "kg·m⁻²", convertPrecipTotal],
    "00119": ["ATMOSPHERIC DIHYDROGEN MONOXIDE DEPOSITION", "kg·m⁻²", convertPrecipTotal],
    "00120": ["ATMOSPHERIC DIHYDROGEN MONOXIDE DEPOSITION", "kg·m⁻²", convertPrecipTotal],
    "00121": ["ATMOSPHERIC DIHYDROGEN MONOXIDE DEPOSITION", "kg·m⁻²", convertPrecipTotal],
    "00122": ["ATMOSPHERIC DIHYDROGEN MONOXIDE DEPOSITION", "kg·m⁻²", convertPrecipTotal],
    "00123": ["ATMOSPHERIC DIHYDROGEN MONOXIDE DEPOSITION", "kg·m⁻²", convertPrecipTotal],
    "00193": ["ATMOSPHERIC DIHYDROGEN MONOXIDE DEPOSITION", "kg·m⁻²", convertPrecipTotal],
    "00124": ["ATMOSPHERIC DIHYDROGEN MONOXIDE DEPOSITION FLUX", "kg·m⁻²·s⁻¹", convertPrecipRate],
    "00125": ["ATMOSPHERIC DIHYDROGEN MONOXIDE DEPOSITION FLUX", "kg·m⁻²·s⁻¹", convertPrecipRate],
    "00126": ["ATMOSPHERIC DIHYDROGEN MONOXIDE DEPOSITION FLUX", "kg·m⁻²·s⁻¹", convertPrecipRate],
    "00127": ["ATMOSPHERIC DIHYDROGEN MONOXIDE DEPOSITION FLUX", "kg·m⁻²·s⁻¹", convertPrecipRate],
    "00128": ["ATMOSPHERIC DIHYDROGEN MONOXIDE DEPOSITION FLUX", "kg·m⁻²·s⁻¹", convertPrecipRate],
    "00129": ["ATMOSPHERIC DIHYDROGEN MONOXIDE DEPOSITION FLUX", "kg·m⁻²·s⁻¹", convertPrecipRate],
    "00055": ["CHANNEL BULK FLOW VELOCITY", "m·s⁻¹", convertVelocity],
    "00020": ["ATMOSPHERIC THERMAL STATE", "K", convertTemperature],
    "00025": ["ATMOSPHERIC STATIC PRESSURE FIELD", "kg·m⁻¹·s⁻²", convertPressure]
  };

  const el = {
    acquisitionOverlay: document.getElementById("acquisitionOverlay"),
    overlayStatus: document.getElementById("overlayStatus"),
    siteInput: document.getElementById("siteInput"),
    siteButton: document.getElementById("siteButton"),
    refreshButton: document.getElementById("refreshButton"),
    geodeticStatus: document.getElementById("geodeticStatus"),
    dataStatus: document.getElementById("dataStatus"),
    siteStatus: document.getElementById("siteStatus"),
    transportStatus: document.getElementById("transportStatus"),
    sourceMode: document.getElementById("sourceMode"),
    discharge: document.getElementById("discharge"),
    massTransport: document.getElementById("massTransport"),
    volumePerKs: document.getElementById("volumePerKs"),
    dischargeAge: document.getElementById("dischargeAge"),
    stationName: document.getElementById("stationName"),
    stationId: document.getElementById("stationId"),
    stationDistance: document.getElementById("stationDistance"),
    hydrologicUnit: document.getElementById("hydrologicUnit"),
    siteType: document.getElementById("siteType"),
    datumStatus: document.getElementById("datumStatus"),
    gageHeight: document.getElementById("gageHeight"),
    reservoirElevation: document.getElementById("reservoirElevation"),
    groundwaterDepth: document.getElementById("groundwaterDepth"),
    streamVelocity: document.getElementById("streamVelocity"),
    aqueousTemperature: document.getElementById("aqueousTemperature"),
    oxygen: document.getElementById("oxygen"),
    conductance: document.getElementById("conductance"),
    ph: document.getElementById("ph"),
    turbidity: document.getElementById("turbidity"),
    density: document.getElementById("density"),
    forcingStatus: document.getElementById("forcingStatus"),
    precipTotal: document.getElementById("precipTotal"),
    precipRate: document.getElementById("precipRate"),
    channelCount: document.getElementById("channelCount"),
    telemetryOrigin: document.getElementById("telemetryOrigin"),
    hydrographStatus: document.getElementById("hydrographStatus"),
    hydrographCanvas: document.getElementById("hydrographCanvas"),
    seriesMin: document.getElementById("seriesMin"),
    seriesMax: document.getElementById("seriesMax"),
    seriesDelta: document.getElementById("seriesDelta"),
    seriesSlope: document.getElementById("seriesSlope"),
    tableStatus: document.getElementById("tableStatus"),
    telemetryBody: document.getElementById("telemetryBody")
  };

  const state = {
    position: null,
    dataset: null,
    hydrograph: [],
    animationHandle: 0,
    lastManualSite: ""
  };

  function setText(node, value) {
    node.textContent = value;
  }

  function finite(value) {
    return Number.isFinite(value);
  }

  function numberFrom(value) {
    const parsed = Number(value);
    return finite(parsed) ? parsed : NaN;
  }

  function signMinus(value) {
    return Object.is(value, -0) || value < 0 ? "−" : "";
  }

  function formatNumber(value, decimals = 2) {
    if (!finite(value)) return "--";
    const abs = Math.abs(value);
    return signMinus(value) + abs.toFixed(decimals);
  }

  function formatAdaptive(value, decimals = 3) {
    if (!finite(value)) return "--";
    const abs = Math.abs(value);
    if (abs !== 0 && (abs >= 1000000 || abs < 0.001)) {
      return signMinus(value) + abs.toExponential(decimals).replace("+", "");
    }
    if (abs >= 1000) return formatNumber(value, 1);
    return formatNumber(value, decimals);
  }

  function formatWithUnit(value, unit, decimals = 3) {
    const text = formatAdaptive(value, decimals);
    return unit ? `${text} ${unit}` : text;
  }

  function formatLength(value) {
    return formatWithUnit(value, "m", Math.abs(value) >= 1000 ? 1 : 3);
  }

  function formatAge(date) {
    if (!(date instanceof Date) || !finite(date.getTime())) return "-- ks";
    return formatWithUnit((Date.now() - date.getTime()) / 1000 * KS_PER_S, "ks", 3);
  }

  function formatUtcPhase(date) {
    if (!(date instanceof Date) || !finite(date.getTime())) return "-- ks UTC";
    const midnight = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    return `${formatAdaptive((date.getTime() - midnight) / 1000000, 5)} ks UTC`;
  }

  function sanitizeVisibleText(value) {
    return String(value ?? "--")
      .replace(/\bH2O\b/gi, "DIHYDROGEN MONOXIDE")
      .replace(/\bwater\b/gi, "DIHYDROGEN MONOXIDE");
  }

  function normalizeSiteId(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";
    const compact = raw.replace(/\s+/g, "").toUpperCase();
    if (/^\d+$/.test(compact)) return `USGS-${compact}`;
    if (/^USGS-\d+$/.test(compact)) return compact;
    return compact;
  }

  function numericSiteId(siteId) {
    return String(siteId || "").replace(/^USGS-/i, "");
  }

  function celsiusToKelvin(value) {
    return finite(value) ? value + 273.15 : NaN;
  }

  function fahrenheitToKelvin(value) {
    return finite(value) ? (value - 32) * 5 / 9 + 273.15 : NaN;
  }

  function lowerUnit(unit) {
    return String(unit || "").toLowerCase().replace(/\s+/g, "");
  }

  function convertDischarge(value, unit) {
    const u = lowerUnit(unit);
    if (u.includes("ft^3/s") || u.includes("ft3/s") || u.includes("cfs")) return value * 0.028316846592;
    return value;
  }

  function convertLength(value, unit) {
    const u = lowerUnit(unit);
    if (u === "ft" || u.includes("feet")) return value * 0.3048;
    return value;
  }

  function convertVelocity(value, unit) {
    const u = lowerUnit(unit);
    if (u.includes("ft/sec") || u.includes("ft/s")) return value * 0.3048;
    return value;
  }

  function convertTemperature(value, unit, code) {
    const u = lowerUnit(unit);
    if (code === "00011" || u.includes("degf") || u.includes("°f")) return fahrenheitToKelvin(value);
    if (u === "k" || u.includes("kelvin")) return value;
    return celsiusToKelvin(value);
  }

  function convertDissolvedMass(value, unit) {
    const u = lowerUnit(unit);
    if (u.includes("mg/l") || u.includes("mgperliter")) return value * 0.001;
    if (u.includes("ug/l")) return value * 0.000001;
    return value;
  }

  function convertConductance(value, unit) {
    const u = lowerUnit(unit);
    if (u.includes("us/cm") || u.includes("µs/cm") || u.includes("microsiemens")) return value * 0.0001;
    return value;
  }

  function convertPrecipTotal(value, unit) {
    const u = lowerUnit(unit);
    if (u === "in" || u.includes("inch")) return value * 25.4;
    return value;
  }

  function convertPrecipRate(value, unit) {
    const u = lowerUnit(unit);
    if (u.includes("in/hr")) return value * 25.4 / 3600;
    if (u.includes("mm/hr")) return value / 3600;
    return value;
  }

  function convertPressure(value, unit) {
    const u = lowerUnit(unit);
    if (u.includes("mmhg")) return value * 133.322387415;
    if (u.includes("hpa") || u.includes("mbar")) return value * 100;
    return value;
  }

  function convertUnitless(value) {
    return value;
  }

  function convertObservation(obs) {
    const registry = PARAMETER_REGISTRY[obs.code];
    if (!registry) {
      return {
        label: obs.label || `PARAMETER ${obs.code} TELEMETRY`,
        value: obs.value,
        unit: obs.unit || ""
      };
    }
    return {
      label: registry[0],
      value: registry[2](obs.value, obs.unit, obs.code),
      unit: registry[1]
    };
  }

  function densityOfDhm(tempK) {
    if (!finite(tempK)) return 997;
    const c = tempK - 273.15;
    if (c < -5 || c > 45) return 997;
    return 1000 * (1 - ((c + 288.9414) / (508929.2 * (c + 68.12963))) * (c - 3.9863) ** 2);
  }

  function bboxAround(position, radiusKm) {
    const radiusM = radiusKm * 1000;
    const latSpan = radiusM / 111320;
    const lonSpan = radiusM / (111320 * Math.max(0.18, Math.cos(position.latitude * Math.PI / 180)));
    return [
      clamp(position.longitude - lonSpan, -180, 180).toFixed(5),
      clamp(position.latitude - latSpan, -89.5, 89.5).toFixed(5),
      clamp(position.longitude + lonSpan, -180, 180).toFixed(5),
      clamp(position.latitude + latSpan, -89.5, 89.5).toFixed(5)
    ].join(",");
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function recentInterval(days) {
    const end = new Date();
    const start = new Date(end.getTime() - days * DAY_MS);
    return `${start.toISOString()}/${end.toISOString()}`;
  }

  async function fetchJson(url) {
    const response = await fetch(url, { headers: { accept: "application/geo+json, application/json" } });
    if (!response.ok) throw new Error(`TELEMETRY BUS ${response.status}`);
    return response.json();
  }

  async function fetchText(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`LEGACY TELEMETRY BUS ${response.status}`);
    return response.text();
  }

  function continuousUrl(params) {
    return `https://api.waterdata.usgs.gov/ogcapi/v0/collections/continuous/items?${params.toString()}`;
  }

  async function fetchContinuousByBbox(position, radiusKm, useParameterFilter) {
    const params = new URLSearchParams({
      f: "json",
      limit: "1000",
      bbox: bboxAround(position, radiusKm),
      datetime: recentInterval(4)
    });
    if (useParameterFilter) params.set("parameter_code", TARGET_CODES.join(","));
    const data = await fetchJson(continuousUrl(params));
    return normalizeOgcFeatures(data.features || []);
  }

  async function fetchContinuousBySite(siteId, useParameterFilter) {
    const params = new URLSearchParams({
      f: "json",
      limit: "1000",
      monitoring_location_id: siteId,
      datetime: recentInterval(7)
    });
    if (useParameterFilter) params.set("parameter_code", TARGET_CODES.join(","));
    const data = await fetchJson(continuousUrl(params));
    return normalizeOgcFeatures(data.features || []);
  }

  function normalizeOgcFeatures(features) {
    return features.map((feature) => {
      const props = feature.properties || {};
      const coords = feature.geometry?.coordinates || [];
      return {
        stationId: String(props.monitoring_location_id || ""),
        stationName: "",
        code: String(props.parameter_code || ""),
        label: "",
        value: numberFrom(props.value),
        unit: String(props.unit_of_measure || ""),
        time: new Date(props.time),
        qualifier: props.qualifier || props.approval_status || "",
        source: "OGC",
        latitude: numberFrom(coords[1]),
        longitude: numberFrom(coords[0])
      };
    }).filter((obs) => obs.stationId && obs.code && finite(obs.value) && finite(obs.time.getTime()));
  }

  async function fetchStationMetadata(siteId) {
    try {
      const url = `https://api.waterdata.usgs.gov/ogcapi/v0/collections/monitoring-locations/items/${encodeURIComponent(siteId)}?f=json`;
      const feature = await fetchJson(url);
      return normalizeMetadataFeature(feature);
    } catch (error) {
      console.warn(error);
      return {};
    }
  }

  function normalizeMetadataFeature(feature) {
    const props = feature.properties || {};
    const coords = feature.geometry?.coordinates || [];
    return {
      stationName: props.monitoring_location_name || "",
      siteType: props.site_type || props.site_type_code || "",
      hydrologicUnit: props.hydrologic_unit_code || "",
      latitude: numberFrom(coords[1]),
      longitude: numberFrom(coords[0]),
      altitude: numberFrom(props.altitude),
      agency: props.agency_code || ""
    };
  }

  async function fetchLegacyIv(siteId) {
    const params = new URLSearchParams({
      format: "json",
      sites: numericSiteId(siteId),
      period: "P7D",
      parameterCd: TARGET_CODES.join(","),
      siteStatus: "all"
    });
    const data = await fetchJson(`https://waterservices.usgs.gov/nwis/iv/?${params.toString()}`);
    return normalizeLegacyTimeSeries(data?.value?.timeSeries || []);
  }

  function normalizeLegacyTimeSeries(series) {
    const observations = [];
    for (const item of series) {
      const sourceInfo = item.sourceInfo || {};
      const variable = item.variable || {};
      const code = String(variable.variableCode?.[0]?.value || "");
      const unit = String(variable.unit?.unitCode || "");
      const stationCode = String(sourceInfo.siteCode?.[0]?.value || "");
      const stationId = stationCode.startsWith("USGS-") ? stationCode : `USGS-${stationCode}`;
      const geo = sourceInfo.geoLocation?.geogLocation || {};
      const values = item.values?.[0]?.value || [];
      for (const point of values) {
        observations.push({
          stationId,
          stationName: sourceInfo.siteName || "",
          code,
          label: variable.variableDescription || "",
          value: numberFrom(point.value),
          unit,
          time: new Date(point.dateTime),
          qualifier: point.qualifiers?.join(",") || "",
          source: "NWIS-IV",
          latitude: numberFrom(geo.latitude),
          longitude: numberFrom(geo.longitude)
        });
      }
    }
    return observations.filter((obs) => obs.stationId && obs.code && finite(obs.value) && finite(obs.time.getTime()));
  }

  async function fetchLegacyCandidateSites(position, radiusKm) {
    const params = new URLSearchParams({
      format: "rdb",
      bBox: bboxAround(position, radiusKm),
      hasDataTypeCd: "iv",
      parameterCd: "00060",
      siteStatus: "all"
    });
    const text = await fetchText(`https://waterservices.usgs.gov/nwis/site/?${params.toString()}`);
    return parseRdbSites(text, position);
  }

  function parseRdbSites(text, position) {
    const rows = text.split(/\r?\n/).filter((line) => line && !line.startsWith("#"));
    if (rows.length < 3) return [];
    const headers = rows[0].split("\t");
    return rows.slice(2).map((line) => {
      const cols = line.split("\t");
      const row = Object.fromEntries(headers.map((key, index) => [key, cols[index] || ""]));
      const latitude = numberFrom(row.dec_lat_va);
      const longitude = numberFrom(row.dec_long_va);
      const siteId = `USGS-${row.site_no}`;
      return {
        siteId,
        stationName: row.station_nm || "",
        siteType: row.site_tp_cd || "",
        hydrologicUnit: row.huc_cd || "",
        latitude,
        longitude,
        distanceM: distanceM(position, { latitude, longitude })
      };
    }).filter((site) => site.siteId && finite(site.latitude) && finite(site.longitude))
      .sort((a, b) => a.distanceM - b.distanceM);
  }

  async function acquirePosition() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("GEODETIC SENSOR ABSENT"));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (result) => resolve({
          latitude: result.coords.latitude,
          longitude: result.coords.longitude,
          altitude: finite(result.coords.altitude) ? result.coords.altitude : 0,
          synthetic: false
        }),
        () => reject(new Error("GEODETIC SENSOR REJECTED")),
        { enableHighAccuracy: true, timeout: 14000, maximumAge: 300000 }
      );
    });
  }

  async function loadNearbyDataset(position) {
    for (const radiusKm of SEARCH_RADII_KM) {
      setText(el.overlayStatus, `USGS SEARCH RADIUS: ${radiusKm} km`);
      let observations = [];
      try {
        observations = await fetchContinuousByBbox(position, radiusKm, true);
      } catch (error) {
        console.warn(error);
        try {
          observations = await fetchContinuousByBbox(position, radiusKm, false);
        } catch (fallbackError) {
          console.warn(fallbackError);
        }
      }

      const station = selectBestStation(observations, position);
      if (station) return hydrateDataset(station, position, `OGC / ${radiusKm} km`);

      try {
        const sites = await fetchLegacyCandidateSites(position, radiusKm);
        if (sites[0]) {
          const legacyObservations = await fetchLegacyIv(sites[0].siteId);
          const legacyStation = selectBestStation(legacyObservations, position, sites[0]);
          if (legacyStation) return hydrateDataset(legacyStation, position, `NWIS-IV / ${radiusKm} km`);
        }
      } catch (error) {
        console.warn(error);
      }
    }
    return sampleDataset(position);
  }

  async function loadSiteDataset(siteId) {
    let observations = [];
    try {
      observations = await fetchContinuousBySite(siteId, true);
    } catch (error) {
      console.warn(error);
      try {
        observations = await fetchContinuousBySite(siteId, false);
      } catch (fallbackError) {
        console.warn(fallbackError);
      }
    }
    if (!observations.length) observations = await fetchLegacyIv(siteId);
    const station = selectBestStation(observations, state.position || DEFAULT_POSITION, { siteId });
    if (!station) throw new Error("CONTROL VOLUME TELEMETRY ABSENT");
    return hydrateDataset(station, state.position || station, "SITE OVERRIDE");
  }

  async function hydrateDataset(station, userPosition, mode) {
    const metadata = await fetchStationMetadata(station.stationId);
    const latitude = finite(metadata.latitude) ? metadata.latitude : station.latitude;
    const longitude = finite(metadata.longitude) ? metadata.longitude : station.longitude;
    return {
      mode,
      stationId: station.stationId,
      stationName: metadata.stationName || station.stationName || station.stationId,
      siteType: metadata.siteType || station.siteType || "--",
      hydrologicUnit: metadata.hydrologicUnit || station.hydrologicUnit || "--",
      latitude,
      longitude,
      distanceM: distanceM(userPosition, { latitude, longitude }),
      observations: station.observations,
      latestByCode: latestByCode(station.observations),
      source: station.source || mode
    };
  }

  function selectBestStation(observations, position, seed = {}) {
    if (!observations.length) return null;
    const groups = new Map();
    for (const obs of observations) {
      if (!groups.has(obs.stationId)) {
        groups.set(obs.stationId, {
          stationId: obs.stationId,
          stationName: obs.stationName,
          siteType: seed.siteType || "",
          hydrologicUnit: seed.hydrologicUnit || "",
          latitude: finite(obs.latitude) ? obs.latitude : seed.latitude,
          longitude: finite(obs.longitude) ? obs.longitude : seed.longitude,
          source: obs.source,
          observations: []
        });
      }
      const group = groups.get(obs.stationId);
      group.observations.push(obs);
      if (!group.stationName && obs.stationName) group.stationName = obs.stationName;
      if (!finite(group.latitude) && finite(obs.latitude)) group.latitude = obs.latitude;
      if (!finite(group.longitude) && finite(obs.longitude)) group.longitude = obs.longitude;
    }

    let best = null;
    for (const group of groups.values()) {
      const latest = latestByCode(group.observations);
      const codes = new Set(Object.keys(latest));
      const roleScore = Object.values(ROLE_CODES).reduce((sum, roleCodes) =>
        sum + (roleCodes.some((code) => codes.has(code)) ? 1 : 0), 0);
      const hasDischarge = ROLE_CODES.discharge.some((code) => codes.has(code));
      const hasStage = ROLE_CODES.stage.some((code) => codes.has(code));
      const latestTime = Math.max(...group.observations.map((obs) => obs.time.getTime()));
      const ageHours = (Date.now() - latestTime) / 3600000;
      const dist = distanceM(position, group);
      const score = roleScore * 600 + (hasDischarge ? 1200 : 0) + (hasStage ? 350 : 0) +
        Math.max(0, 168 - ageHours) - (finite(dist) ? dist / 1000 : 200);
      group.score = score;
      if (!best || group.score > best.score) best = group;
    }
    return best;
  }

  function latestByCode(observations) {
    const latest = {};
    for (const obs of observations) {
      const current = latest[obs.code];
      if (!current || obs.time > current.time) latest[obs.code] = obs;
    }
    return latest;
  }

  function latestForRole(dataset, role) {
    for (const code of ROLE_CODES[role] || []) {
      const obs = dataset.latestByCode[code];
      if (obs) return { obs, converted: convertObservation(obs) };
    }
    return null;
  }

  function observationsForRole(dataset, role) {
    const codes = new Set(ROLE_CODES[role] || []);
    return dataset.observations
      .filter((obs) => codes.has(obs.code))
      .map((obs) => ({ obs, converted: convertObservation(obs) }))
      .filter((item) => finite(item.converted.value))
      .sort((a, b) => a.obs.time - b.obs.time);
  }

  function distanceM(a, b) {
    if (!a || !b || !finite(a.latitude) || !finite(a.longitude) || !finite(b.latitude) || !finite(b.longitude)) {
      return NaN;
    }
    const r = 6371008.8;
    const p1 = a.latitude * Math.PI / 180;
    const p2 = b.latitude * Math.PI / 180;
    const dp = (b.latitude - a.latitude) * Math.PI / 180;
    const dl = (b.longitude - a.longitude) * Math.PI / 180;
    const h = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
    return 2 * r * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  }

  function sampleDataset(position) {
    const site = {
      stationId: "USGS-01646500",
      stationName: "POTOMAC RIVER NEAR WASHINGTON, DC LITTLE FALLS PUMP STA",
      siteType: "STREAM",
      hydrologicUnit: "02070010",
      latitude: 38.9498,
      longitude: -77.1272
    };
    const now = Date.now();
    const samples = [];
    for (let index = 0; index < 32; index += 1) {
      const time = new Date(now - (31 - index) * 15 * 60000);
      const pulse = Math.sin(index / 4) * 18 + Math.cos(index / 7) * 9;
      samples.push(makeSample(site, "00060", 1120 + pulse, "ft^3/s", time));
    }
    [
      ["00065", 3.42, "ft"],
      ["00010", 23.7, "deg C"],
      ["00300", 7.8, "mg/l"],
      ["00095", 318, "uS/cm @25C"],
      ["00400", 7.42, "std units"],
      ["63680", 3.1, "FNU"],
      ["00045", 0.02, "in"],
      ["00055", 1.8, "ft/sec"]
    ].forEach(([code, value, unit]) => samples.push(makeSample(site, code, value, unit, new Date(now - 12 * 60000))));

    return {
      mode: "SYNTHETIC FALLBACK",
      stationId: site.stationId,
      stationName: site.stationName,
      siteType: site.siteType,
      hydrologicUnit: site.hydrologicUnit,
      latitude: site.latitude,
      longitude: site.longitude,
      distanceM: distanceM(position, site),
      observations: samples,
      latestByCode: latestByCode(samples),
      source: "SYNTHETIC"
    };
  }

  function makeSample(site, code, value, unit, time) {
    return {
      stationId: site.stationId,
      stationName: site.stationName,
      code,
      label: "",
      value,
      unit,
      time,
      qualifier: "SIM",
      source: "SYNTHETIC",
      latitude: site.latitude,
      longitude: site.longitude
    };
  }

  function paintDataset(dataset) {
    state.dataset = dataset;
    const discharge = latestForRole(dataset, "discharge");
    const temperature = latestForRole(dataset, "temperature");
    const density = densityOfDhm(temperature?.converted.value);
    const dischargeValue = discharge?.converted.value ?? NaN;
    const channelCount = new Set(dataset.observations.map((obs) => obs.code)).size;
    const latestTime = new Date(Math.max(...dataset.observations.map((obs) => obs.time.getTime())));

    setText(el.sourceMode, `SOURCE: ${dataset.mode}`);
    setText(el.siteStatus, `CONTROL VOLUME: ${dataset.stationId}`);
    setText(el.dataStatus, dataset.source === "SYNTHETIC" ? "TELEMETRY BUS: SYNTHETIC" : "TELEMETRY BUS: HOT");
    setText(el.transportStatus, discharge ? "TRANSPORT FIELD: RESOLVED" : "TRANSPORT FIELD: ABSENT");
    setText(el.stationName, sanitizeVisibleText(dataset.stationName));
    setText(el.stationId, dataset.stationId);
    setText(el.stationDistance, formatLength(dataset.distanceM));
    setText(el.hydrologicUnit, sanitizeVisibleText(dataset.hydrologicUnit || "--"));
    setText(el.siteType, sanitizeVisibleText(dataset.siteType || "--"));

    setText(el.discharge, formatWithUnit(dischargeValue, "m³·s⁻¹", 3));
    setText(el.massTransport, formatWithUnit(dischargeValue * density, "kg·s⁻¹", 3));
    setText(el.volumePerKs, formatWithUnit(dischargeValue * 1000, "m³·ks⁻¹", 2));
    setText(el.dischargeAge, discharge ? formatAge(discharge.obs.time) : "-- ks");

    paintRoleMetric(el.gageHeight, dataset, "stage", "m", 3);
    paintRoleMetric(el.reservoirElevation, dataset, "reservoir", "m", 3);
    paintRoleMetric(el.groundwaterDepth, dataset, "groundwaterDepth", "m", 3);
    paintRoleMetric(el.streamVelocity, dataset, "streamVelocity", "m·s⁻¹", 3);
    setText(el.datumStatus, latestForRole(dataset, "stage") || latestForRole(dataset, "reservoir") ? "DATUM: RESOLVED" : "DATUM: SPARSE");

    paintRoleMetric(el.aqueousTemperature, dataset, "temperature", "K", 2);
    paintRoleMetric(el.oxygen, dataset, "oxygen", "kg·m⁻³", 5);
    paintRoleMetric(el.conductance, dataset, "conductance", "S·m⁻¹", 5);
    paintRoleMetric(el.ph, dataset, "ph", "", 3);
    paintRoleMetric(el.turbidity, dataset, "turbidity", "", 3);
    setText(el.density, formatWithUnit(density, "kg·m⁻³", 2));

    paintRoleMetric(el.precipTotal, dataset, "precipTotal", "kg·m⁻²", 3);
    paintRoleMetric(el.precipRate, dataset, "precipRate", "kg·m⁻²·s⁻¹", 7);
    setText(el.forcingStatus, latestForRole(dataset, "precipTotal") || latestForRole(dataset, "precipRate") ? "DEPOSITION FIELD: RESOLVED" : "DEPOSITION FIELD: ABSENT");
    setText(el.channelCount, String(channelCount));
    setText(el.telemetryOrigin, formatUtcPhase(latestTime));

    paintTelemetryTable(dataset);
    paintHydrograph(dataset);
  }

  function paintRoleMetric(node, dataset, role, unit, decimals) {
    const item = latestForRole(dataset, role);
    setText(node, item ? formatWithUnit(item.converted.value, unit || item.converted.unit, decimals) : `--${unit ? ` ${unit}` : ""}`);
  }

  function paintTelemetryTable(dataset) {
    const rows = Object.values(dataset.latestByCode)
      .sort((a, b) => {
        const knownA = PARAMETER_REGISTRY[a.code] ? 0 : 1;
        const knownB = PARAMETER_REGISTRY[b.code] ? 0 : 1;
        return knownA - knownB || a.code.localeCompare(b.code);
      });

    el.telemetryBody.replaceChildren();
    for (const obs of rows) {
      const converted = convertObservation(obs);
      const tr = document.createElement("tr");
      [
        sanitizeVisibleText(converted.label || obs.label || `PARAMETER ${obs.code}`),
        obs.code,
        formatWithUnit(converted.value, converted.unit, decimalsForUnit(converted.unit)),
        formatAge(obs.time),
        sanitizeVisibleText(obs.qualifier || obs.source || "--")
      ].forEach((text) => {
        const td = document.createElement("td");
        td.textContent = text;
        tr.appendChild(td);
      });
      el.telemetryBody.appendChild(tr);
    }
    setText(el.tableStatus, `REGISTER: ${rows.length} CHANNELS`);
  }

  function decimalsForUnit(unit) {
    if (unit === "kg·m⁻²·s⁻¹" || unit === "S·m⁻¹" || unit === "kg·m⁻³") return 6;
    if (unit === "K") return 2;
    if (!unit) return 3;
    return 3;
  }

  function paintHydrograph(dataset) {
    const series = observationsForRole(dataset, "discharge");
    state.hydrograph = series.map((item) => ({
      time: item.obs.time.getTime(),
      value: item.converted.value
    }));

    if (state.hydrograph.length < 2) {
      setText(el.hydrographStatus, "SERIES: ABSENT");
      setText(el.seriesMin, "-- m³·s⁻¹");
      setText(el.seriesMax, "-- m³·s⁻¹");
      setText(el.seriesDelta, "-- m³·s⁻¹");
      setText(el.seriesSlope, "-- m³·s⁻²");
      drawHydrograph(performance.now());
      return;
    }

    const values = state.hydrograph.map((point) => point.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const delta = values[values.length - 1] - values[0];
    const elapsedS = Math.max(1, (state.hydrograph[state.hydrograph.length - 1].time - state.hydrograph[0].time) / 1000);

    setText(el.hydrographStatus, `SERIES: ${state.hydrograph.length} OBSERVATIONS`);
    setText(el.seriesMin, formatWithUnit(min, "m³·s⁻¹", 3));
    setText(el.seriesMax, formatWithUnit(max, "m³·s⁻¹", 3));
    setText(el.seriesDelta, formatWithUnit(delta, "m³·s⁻¹", 3));
    setText(el.seriesSlope, formatWithUnit(delta / elapsedS, "m³·s⁻²", 7));
    drawHydrograph(performance.now());
  }

  function drawHydrograph(timestamp) {
    const canvas = el.hydrographCanvas;
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const width = Math.max(1, Math.floor(rect.width * dpr));
    const height = Math.max(1, Math.floor(rect.height * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const pad = 26;
    const graphW = Math.max(1, w - pad * 2);
    const graphH = Math.max(1, h - pad * 2);

    ctx.strokeStyle = "rgba(114, 247, 242, 0.18)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 6; i += 1) {
      const y = pad + graphH * i / 6;
      ctx.beginPath();
      ctx.moveTo(pad, y);
      ctx.lineTo(pad + graphW, y);
      ctx.stroke();
    }

    if (state.hydrograph.length < 2) {
      ctx.fillStyle = "rgba(255, 204, 98, 0.82)";
      ctx.font = "12px IBM Plex Mono, Consolas, monospace";
      ctx.fillText("DISCHARGE SERIES ABSENT", pad, h / 2);
      ctx.restore();
      return;
    }

    const values = state.hydrograph.map((point) => point.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const span = Math.max(0.000001, maxValue - minValue);
    const firstTime = state.hydrograph[0].time;
    const lastTime = state.hydrograph[state.hydrograph.length - 1].time;
    const timeSpan = Math.max(1, lastTime - firstTime);

    const points = state.hydrograph.map((point) => ({
      x: pad + ((point.time - firstTime) / timeSpan) * graphW,
      y: pad + (1 - (point.value - minValue) / span) * graphH
    }));

    const gradient = ctx.createLinearGradient(0, pad, 0, pad + graphH);
    gradient.addColorStop(0, "rgba(141, 255, 122, 0.24)");
    gradient.addColorStop(1, "rgba(141, 255, 122, 0.01)");

    ctx.beginPath();
    ctx.moveTo(points[0].x, pad + graphH);
    for (const point of points) ctx.lineTo(point.x, point.y);
    ctx.lineTo(points[points.length - 1].x, pad + graphH);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.beginPath();
    points.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.strokeStyle = "rgba(141, 255, 122, 0.95)";
    ctx.lineWidth = 2;
    ctx.shadowColor = "rgba(141, 255, 122, 0.35)";
    ctx.shadowBlur = 12;
    ctx.stroke();
    ctx.shadowBlur = 0;

    const phase = (timestamp / 2200) % 1;
    for (let i = 0; i < 5; i += 1) {
      const t = (phase + i / 5) % 1;
      const index = Math.min(points.length - 2, Math.floor(t * (points.length - 1)));
      const local = t * (points.length - 1) - index;
      const a = points[index];
      const b = points[index + 1];
      const x = a.x + (b.x - a.x) * local;
      const y = a.y + (b.y - a.y) * local;
      ctx.beginPath();
      ctx.arc(x, y, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 204, 98, 0.78)";
      ctx.fill();
    }

    ctx.fillStyle = "rgba(255, 204, 98, 0.86)";
    ctx.font = "11px IBM Plex Mono, Consolas, monospace";
    ctx.fillText(formatWithUnit(maxValue, "m³·s⁻¹", 3), pad, pad - 8);
    ctx.fillText(formatWithUnit(minValue, "m³·s⁻¹", 3), pad, pad + graphH + 16);
    ctx.restore();
  }

  function animateHydrograph(timestamp) {
    drawHydrograph(timestamp);
    state.animationHandle = requestAnimationFrame(animateHydrograph);
  }

  async function initialize(options = {}) {
    el.acquisitionOverlay.classList.add("active");
    setText(el.overlayStatus, "GEODETIC VECTOR SOLUTION PENDING");
    setText(el.dataStatus, "TELEMETRY BUS: COLD");
    setText(el.siteStatus, "CONTROL VOLUME: UNRESOLVED");

    try {
      let dataset;
      if (options.siteId) {
        setText(el.geodeticStatus, "GEODETIC LOCK: BYPASSED");
        setText(el.overlayStatus, "SITE-SPECIFIC CONTROL VOLUME REQUESTED");
        dataset = await loadSiteDataset(options.siteId);
      } else {
        let position;
        try {
          if (new URLSearchParams(window.location.search).has("synthetic")) {
            throw new Error("SYNTHETIC VECTOR REQUESTED");
          }
          position = await acquirePosition();
          setText(el.geodeticStatus, "GEODETIC LOCK: TRUE");
        } catch (error) {
          console.warn(error);
          position = { ...DEFAULT_POSITION, synthetic: true };
          setText(el.geodeticStatus, "GEODETIC LOCK: FALLBACK");
        }
        state.position = position;
        dataset = await loadNearbyDataset(position);
      }
      paintDataset(dataset);
    } catch (error) {
      console.warn(error);
      setText(el.geodeticStatus, "GEODETIC LOCK: DEGRADED");
      paintDataset(sampleDataset(state.position || DEFAULT_POSITION));
    }

    window.setTimeout(() => {
      el.acquisitionOverlay.classList.remove("active");
    }, 450);
  }

  function bindControls() {
    el.refreshButton.addEventListener("click", () => {
      const siteId = state.lastManualSite || "";
      initialize(siteId ? { siteId } : {});
    });
    el.siteButton.addEventListener("click", () => {
      const siteId = normalizeSiteId(el.siteInput.value);
      if (!siteId) {
        state.lastManualSite = "";
        initialize();
        return;
      }
      state.lastManualSite = siteId;
      el.siteInput.value = siteId;
      initialize({ siteId });
    });
    el.siteInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") el.siteButton.click();
    });
    window.addEventListener("resize", () => drawHydrograph(performance.now()));
  }

  bindControls();
  state.animationHandle = requestAnimationFrame(animateHydrograph);
  initialize();
})();
