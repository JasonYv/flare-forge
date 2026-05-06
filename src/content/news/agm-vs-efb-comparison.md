---
title: "AGM vs EFB: Which Start-Stop Battery Should You Spec?"
summary: "Both AGM and EFB are upgrades from conventional flooded for start-stop vehicles. The right choice depends on system architecture, climate, and total cost of ownership math. Here's the decision framework."
coverImage: "/images/hero/hero-agm.webp"
category: "guide"
author: "AltusVolt Engineering"
publishedAt: 2026-04-08
tags: ["agm", "efb", "start-stop", "guide", "technical"]
---

## The TL;DR for distributors

If you only remember three rules:

1. **AGM** is required for vehicles with regenerative braking (regen) and high electrical loads
2. **EFB** is sufficient for entry-level start-stop without regen, at ~50% lower cost
3. **Conventional flooded** in a start-stop vehicle will fail in 12–18 months — never substitute

Now the details.

## What changed when start-stop arrived

A conventional vehicle starts the engine maybe 4–6 times per day. A start-stop vehicle does it 50–100+ times per day. Each engine start draws 300–700 amps for 1–2 seconds, then the alternator recharges the battery during driving.

Conventional flooded batteries are designed for this old duty cycle: a deep crank, then long float charging. Force them to handle 100 daily cranks and they fail through:

- **Plate sulfation** during the off-engine periods (battery is partially discharged)
- **Vibration damage** to fragile plate active material
- **Acid stratification** from frequent low-rate charging

## EFB: the carbon upgrade

**Enhanced Flooded Battery (EFB)** technology adds carbon and graphite to the negative active material. This dramatically improves Partial State of Charge (PSoC) tolerance — the battery can sit at 80% charged without sulfating. EFB delivers:

- **2× cycle life** of conventional flooded in start-stop duty
- **Improved charge acceptance** (faster recharge between engine starts)
- **Lower cost** than AGM (~25% premium over conventional)
- **Tropical climate friendly** — less heat-sensitive than AGM

EFB is right for: entry-level start-stop without regenerative braking. Markets like India, Latin America, and parts of Southeast Asia where AGM is cost-prohibitive.

## AGM: the immobilized electrolyte upgrade

**Absorbent Glass Mat (AGM)** technology takes a fundamentally different approach. The electrolyte is absorbed into fiberglass mats between the plates instead of free-flooding the case. This delivers:

- **3–4× cycle life** of conventional flooded in start-stop duty
- **Spill-proof and orientation-independent** operation
- **High-rate discharge** for vehicles with high cold-cranking demands
- **Regen brake compatibility** — accepts charge bursts without gassing
- **Vibration resistance** — plates locked in by glass mat compression

AGM is required for: vehicles with regenerative braking, micro-hybrid architecture, high electrical loads (premium European cars, large SUVs, hybrid models). Roughly 80% of European start-stop vehicles since 2019 ship with AGM.

## The decision framework

Use this checklist when speccing for a target vehicle or fleet:

**Choose AGM if:**
- Vehicle has regenerative braking
- It's a premium European model (BMW, Mercedes, Audi, VW)
- It's a micro-hybrid or full hybrid
- Engine displacement > 2.0L (high cranking demand)
- Climate is moderate (not extreme heat above 45°C ambient)

**Choose EFB if:**
- Entry-level start-stop without regen
- Smaller engines (< 2.0L)
- Cost-sensitive market (Latin America, India, Southeast Asia)
- Climate is hot (EFB tolerates heat better than AGM)
- Replacing on a high-mileage vehicle nearing end of life

**Never use conventional flooded** in a start-stop vehicle — even as a "temporary" replacement. It will fail within 12–18 months and may damage the start-stop ECU calibration.

## Cross-references

| Application | AltusVolt Model | Common Equivalents |
|---|---|---|
| 70Ah AGM | AV-AGM-70 (6-QTF-70) | Varta E39, Bosch S5 A08, Exide EK700 |
| 70Ah EFB | AV-EFB-70 (6-QTPE-70) | Varta F22, Bosch S4 E08, Exide EL700 |

Browse the [full AGM Start-Stop series](/agm-batteries/) or [EFB Start-Stop series](/efb-batteries/) for detailed specifications.
