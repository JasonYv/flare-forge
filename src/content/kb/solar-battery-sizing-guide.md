---
title: "Solar Battery Sizing Guide: How to Calculate Off-Grid Storage Capacity"
summary: "A step-by-step framework for sizing battery banks in solar off-grid systems — from solar home systems to commercial telecom backup. Includes Peukert correction and tropical climate adjustments."
category: "sizing"
publishedAt: 2026-04-05
tags: ["solar", "sizing", "off-grid", "guide"]
relatedProducts: ["6-cnf-100"]
---

## The five-step sizing framework

### Step 1: Calculate daily energy use

Sum the wattage × hours of every load:

```
Daily Wh = Σ (load_watts × usage_hours)
```

Example: 4 LED lights (10W × 5h) + phone charger (5W × 4h) + small TV (40W × 3h) + fridge (50W × 24h × 0.5 duty) = 200 + 20 + 120 + 600 = **940 Wh/day**

### Step 2: Apply system inefficiencies

```
Adjusted Wh = Daily Wh / (battery efficiency × inverter efficiency × wiring efficiency)
```

Typical: 0.85 × 0.92 × 0.97 = 0.76 system efficiency.

940 Wh / 0.76 = **1237 Wh/day required from battery**

### Step 3: Choose autonomy days

How many cloudy days the system must support without solar input:

| Climate | Typical Autonomy |
|---|---|
| Equatorial (consistent sun) | 1–2 days |
| Tropical (wet/dry seasons) | 2–3 days |
| Mid-latitude (seasonal) | 3–5 days |
| Critical telecom/medical | 5–7 days |

For a tropical home system with 2 days autonomy:

```
Storage required = 1237 Wh × 2 = 2474 Wh
```

### Step 4: Apply depth-of-discharge limit

Lead-acid VRLA cycle life depends on DoD:

| Max DoD | Cycle Life |
|---|---|
| 30% | 2000+ cycles |
| 50% | 1200 cycles |
| 80% | 600 cycles |

For multi-year service life, design to 50% DoD (the sweet spot of cycle life vs. cost).

```
Battery capacity required = 2474 Wh / 0.50 = 4948 Wh
```

### Step 5: Calculate battery quantity

For a 12V system using 100Ah batteries (1200 Wh each):

```
Quantity = 4948 / 1200 = 4.1 → round up to 5 batteries (12V parallel)
```

For 24V or 48V systems, divide quantity by voltage multiplier (4 batteries → 24V 200Ah, 8 batteries → 48V 200Ah).

## Tropical climate adjustments

Capacity drops in heat — counterintuitively, batteries discharge *more* power but *age* faster at high temperature. For tropical deployments:

- **Derate capacity 10%** if average ambient > 35°C
- **Derate float life 50%** at 45°C vs 25°C (Arrhenius equation)
- **Use VRLA gel** rather than AGM for daily cycling in heat

## Quick reference: AltusVolt 6-CNF series

| Model | Capacity | Recommended System |
|---|---|---|
| 6-CNF-38 | 38Ah | 50W panel, lighting only |
| 6-CNF-65 | 65Ah | 100W panel, lights + phone |
| 6-CNF-100 | 100Ah | 200W panel, small fridge or TV |
| 6-CNF-150 | 150Ah | 300W panel, fridge + multiple loads |
| 6-CNF-200 | 200Ah | 500W+ panel, full home system |

For accurate sizing on a specific deployment, [contact our solar engineering team](/contact).
