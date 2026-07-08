# LHMTM

**Local Hydrological Mass Transport Monitor**

An instrument panel for people who saw ordinary streamgage telemetry and decided
that the main failure mode was insufficient SI aggression.

LHMTM acquires a geodetic vector, searches USGS hydrological telemetry near that
position, selects a control volume, and renders the result as:

- volumetric fluid discharge in `m³·s⁻¹`
- DIHYDROGEN MONOXIDE mass transport rate in `kg·s⁻¹`
- surface elevation relative to datum in `m`
- aqueous thermal state in `K`
- dissolved oxygen concentration in `kg·m⁻³`
- electrolytic conductance in `S·m⁻¹`
- atmospheric DIHYDROGEN MONOXIDE deposition in `kg·m⁻²`
- hydrographic return field trend diagnostics

The app can also be aimed manually at a USGS monitoring location identifier such
as `USGS-01646500`.

The source network is the public USGS hydrological API estate:

- `https://api.waterdata.usgs.gov/ogcapi/v0/collections/continuous`
- `https://api.waterdata.usgs.gov/ogcapi/v0/collections/monitoring-locations`
- `https://waterservices.usgs.gov/nwis/iv/`

No friendly units.

No casual nouns.

Only the transport of DIHYDROGEN MONOXIDE through an administratively plausible
control volume.
