# Algorithm Logic Document

## **Stress Buster**

### **1. Day time heat stress risk (algorithm based on maximum temperatures)**
Each crop has specific cardinal temperatures that define limits of growth and development.
The scale will be from 0 to 9, zero means no stress, and 9 is the maximum diurnal heat stress.

**Logic**
---
### **Equation**
- Diurnal heat stress = 0 for (TMAX <= TMaxOptimum)
- Diurnal heat stress = 9 * [(TMAX - TMaxOptimum) / (TMaxLimit - TMaxOptimum)] for (TMaxOptimum < TMAX < TMaxLimit)
- Diurnal heat stress = 9 for (TMAX >= TMaxLimit)
---
Where,
- TMAX = daily maximum air temperature (ºC)
- TMaxOptimum is defined as the maximum temperature for optimum growth
- TMaxLimit is defined as the temperature when the crop does not grow anymore (zero growth)
| **Crop**  | **TMaxOptimum** | **TmaxLimit** |
|-----------|-----------------|---------------|
| Soybean   | 32              | 45            |
| Corn      | 33              | 44            |
| Cotton    | 32              | 38            |
| Rice      | 32              | 38            |
| Wheat     | 25              | 32            |
Diurnal heat stress for soybean = 9 * [(TMAX - 32) / (45 - 32)]
---
### **2. Nighttime heat stress risk (algorithm based on minimum temperatures)**
Warm night temperatures during the flowering and other growth stages lead to yield reductions due to a high rate of cellular respiration and accelerated phenological development.
The scale will be from 0 to 9, zero means no stress, and 9 is the maximum diurnal Night stress.
---
### **Equation**
- Nighttime heat stress = 0 for (TMIN < TMinOptimum)
- Nighttime heat stress = 9 * [(TMIN - TMinOptimum) / (TMinLimit - TMinOptimum)] for (TMinOptimum ≤ TMIN < TMinLimit)
- Nighttime heat stress = 9 for (TMIN ≥ TMinLimit)
---
Where,
- TMIN = daily minimum air temperature (ºC) (Variable obtained from the WTH file)
- TMinOptimum is defined as the maximum daily minimum temperature for optimum growth
- TMinLimit is the minimum temperature at which the crop is significantly affected by night heat stress
| **Crop**  | **TMinOptimum** | **TminLimit** |
|-----------|-----------------|---------------|
| Soybean   | 22              | 28            |
| Corn      | 22              | 28            |
| Cotton    | 20              | 25            |
| Rice      | 22              | 28            |
| Wheat     | 15              | 20            |

Diurnal Night stress for soybean = 9*[(TMAX - 32)/(45-32)]

- If the "Nighttime heat stress" is >9, then use 9.

### **3.Frost stress (algorithm based on minimum temperatures)**

Freezing temperatures prior to maturity can result in yield losses. A killing freeze occurs when temperatures dip to zero degrees Celsius for four hours or 2.2 degrees Celsius for minutes. A killing freeze can still happen with temperatures above zero degrees Celsius, especially in low and unprotected areas when there's no wind.

Calculate frost stress when TMIN is < = 4 °C. If TMIN is more than 4 °C, then there is no frost, frost is zero.

Frost stress = 0 for (TMIN >= TMinNoFrost)

Frost stress = 9*[ABS(TMIN - TMinNoFrost) / ABS(TminFrost - TMinNoFrost)] for (TMIN < TMinNoFrost)

Frost stress = 9 for (TMIN <= TMinFrost)

| **Crop**  | **TMinNoFrost** | **TminFrost** |
|-----------|-----------------|---------------|
| Soyabean  | 4               | -3            |
| Corn      | 4               | -3            |
| Cotton    | 4               | -3            |
| Rice      | NA              | NA            |
| Wheat     | NA              | NA            |

Where,

TMIN= daily minimum air temperature (°C)

TMinNoFrost = is the minimum temperature at which the crop is not affected by Frost stress.

TminFrost = is the minimum temperature at which the crop is significantly affected by Frost stress.

The final equation with the temperatures listed above is,

Frost stress = 9*[ABS(TMIN - 4) / ABS(-3 - 4)]

### **4.Drought risk**

Drought risk can be computed for the previous season and predict whether the current season will be, predict whether the current season will be a Drought risk, in a Drought risk and recommend the biosimulate.

A simplified drought index (DI) can be expressed as:

DI = (P - E) + SM / T

Where:

- (P) = Cumulative rainfall (mm) over a specific period (e.g., growing season).
- (E) = Cumulative evaporation (mm) over the same period. (e.g., growing season).
- (SM) = Soil moisture content (mm or %). (average over the growing season)
- (T) = Average temperature (°C) over the period.

- Rainfall (P):
  - Rainfall is the primary source of water for crops. Insufficient rainfall leads to drought conditions.
- Evaporation(E):
  - Evaporation represents water loss from the soil and crop surface. High evaporation rates increase water stress.
  - Use evapotranspiration (ET) data.

- Soil Moisture (SM):
  - Soil moisture indicates the available water in the root zone. Low soil moisture levels indicate drought stress.
  - Measure soil moisture as volumetric water content (VWC) or as a percentage.

- Temperature (T):
  - High temperatures increase evaporation and transpiration rates, exacerbating drought conditions.
  - Use average daily
- Interpretation of the Drought Index (DI)
  - *DI > 1: No risk
  - *DI = 1: Medium risk
  - DI < 1: Medium risk

## **Yield Booster**

### **5. Yield risk**

For Yield risk, you can have two approaches

1. Gather the yield from the grower for past years and identify if the field is at risk and recommend the biosimulate to increase the yield.

2. Compute the yield risk using the formulae below and recommend the biosimulate.

Yield risk can be calculated based on nitrogen, temperature, rainfall, and the soil's pH. The duration of the growing seasons will be different for different crops.

Typically you can compute the yield risk for the historical periods and decide the recommendation of the biosimulation.

The simple formula is

YR=w1·(GDD– GDD_opt)2+w2·(P–Popt)2+w3·(pH–pHopt)2+w4·(N–Nopt)2

Where:

- (GDD) = Actual Growing Degree Days
- (GDD_opt) = Optimal Growing Degree Days
- (P) = Actual rainfall (mm)
- (P_opt) = Optimal rainfall for growth (mm)
- (pH) = Actual soil pH
- (pH_opt) = Optimal soil pH• (N) = Actual available nitrogen in the soil (kg/ha)
- (N_opt) = Optimal nitrogen availability for soybean (kg/ha)
- (w_1, w_2, w_3, w_4 \) = Weighting factors for each variable, reflecting their relative importance.

Example weighting factors: Here's an example of how weighting factors might be distributed:

- w1 (GDD): 0.3 w2 (Precipitation): 0.3 w3 (pH): 0.2 w4 (Nitrogen): 0.2

- This distribution suggests that GDD and precipitation have a slightly higher impact on yield risk than pH and nitrogen levels

The optimal values for the crop are given below

| Crop Name | GDD optimal | Precipitation Optimal | pH optimal | N Optimal |
|-----------|-------------|----------------------|------------|-----------|
| Soyabean  | 2400-3000   | 450-700 mm          | 6.0-6.8    | 0-0.026 µ/kg |
| Corn      | 2700-3100   | 500-800 mm          | 6.0-6.8    | 0.077-0.154 g/kg |
| Cotton    | 2200-2600   | 700-1300 mm         | 6.0-6.5    | 0.051-0.092 g/kg |
| Rice      | 2000-2500   | 1000-1500 mm        | 5.5-6.5    | 0.051-0.103 g/kg |
| Wheat     | 2000-2500   | 1000-1500 mm        | 5.5-6.5    | 0.051-0.103 g/kg |

Growing Degree Days (GDD) is:

GDD = [(Tmax + Tmin) / 2] - Tbase

Where:

Tmax = Maximum daily temperature
Tmin = Minimum daily temperature
Tbase = Base temperature (threshold for plant growth)

## **Nutrient Booster**

Nutrient biosimulants are usually recommended based on the previous year consumption of nutrient and plan for the current seasons.

### **6. Nitrogen stress**

The biosimulants are recommended for improving nutrient uptake and efficiency and based on the NUE (Nutrient Use Efficiency) (NUE).

Based on the projected yield and taking the nitrogen inputs and rainfall and soil moisture, we can predict whether we need biosimulants.

Generally, NUE for Nitrogen ranges can be categorized as follows:

High NUE: > 40 kg yield / kg N applied

Moderate NUE: 20-40 kg yield / kg N applied

Low NUE: < 20 kg yield / kg N applied

For moderate and Low NUE, we recommend Biosimulants

To compute NUE for nitrogen, this is a formula.

NUE = (Crop yield / Nitrogen applied) * (Rainfall factor) * (Soil moisture factor)

Crop Yield – Projected crop yield kg/ha

Nitrogen applied – Nitrogen applied kg/ha

1. Rainfall factor (RF): RF = 1 if rainfall is optimal RF < 1 if rainfall is below optimal (drought conditions) RF > 1 if rainfall is above optimal (potential leaching)

Example calculation: If optimal rainfall is 600 mm and actual rainfall is 500 mm: RF = 500 / 600 = 0.83

2. Soil moisture factor (SMF): SMF = 1 if soil moisture is optimal SMF < 1 if soil is too dry SMF > 1 if soil is too wet (potential denitrification)

Example calculation: If optimal soil moisture is 25% and actual soil moisture is 20%: SMF = 20 / 25 = 0.8

The Optimal values for soil moisture and precipitation are given below

| Crop Name | Soil moisture optimal | Precipitation Optimal |
|-----------|----------------------|----------------------|
| Soyabean  | 50-70%               | 450-700 mm           |
| Corn      | 50-70%               | 500-800 mm           |
| Cotton    | 50-70%               | 700-1300 mm          |
| Rice      | 80%                  | 1000-1500 mm         |
| Wheat     | 80%                  | 1000-1500 mm         |

### **7. Phosphorus stress**

The biosimulants are recommended for improving nutrient uptake and efficiency and based on the NUE (Phosphorus Use Efficiency (NUE) for Phosphorus.

NUE = (Yield / P applied) * SF  (for Phosphorous)

Where:

Example calculation: If optimal soil moisture is 25% and actual soil moisture is 20%: SMF = 20 / 25 = 0.8

The Optimal values for soil moisture and precipitation and pH are given below

| Crop Name | Soil moisture optimal | Precipitation Optimal | pH optimal |
|-----------|----------------------|----------------------|------------|
| Soyabean  | 50-70%               | 450-700 mm           | 6.0-7.0    |
| Corn      | 50-70%               | 500-800 mm           | 6.0-7.0    |
| Cotton    | 50-70%               | 700-1300 mm          | 6.0-6.5    |
| Rice      | 80%                  | 1000-1500 mm         | 5.5-6.5    |
| Wheat     | 80%                  | 1000-1500 mm         | 6.0-7.0    |