"""Test analytic source-inversion algorithm with synthetic leak scenario.

Simulates a known gas leak source, generates sensor readings via the
Gaussian plume model, then runs coarse search + full inversion to
verify the algorithm recovers the source location.
"""

import math
import sys
import time

from algorithm.inversion.plume_losses import gaussian_plume_predict
from algorithm.inversion.grid_search import run_coarse_search
from algorithm.inversion.inversion_dataset import normalize_inversion_payload
from algorithm.inversion.source_inversion import run_two_stage_inversion


# --- Scenario parameters ---
TRUE_SOURCE = {"x": 520, "y": 310}
WIND_SPEED = 1.5
WIND_DIRECTION = 90  # screen coords: blows south (y+)
EMISSION_RATE = 50.0
MAP_METERS_PER_UNIT = 0.5

# --- Sensor positions (downwind + some upwind for testing) ---
SENSOR_POSITIONS = [
    {"x": 510, "y": 340, "id": "TW-01", "priority": 3},   # near, slightly downwind
    {"x": 530, "y": 380, "id": "TW-02", "priority": 2},   # downwind
    {"x": 500, "y": 430, "id": "PA-01", "priority": 2},   # far downwind
    {"x": 540, "y": 360, "id": "PA-02", "priority": 1},   # downwind crosswind
    {"x": 460, "y": 350, "id": "TK-01", "priority": 1},   # downwind crosswind left
    {"x": 580, "y": 370, "id": "TK-02", "priority": 1},   # downwind crosswind right
    {"x": 510, "y": 480, "id": "PA-03", "priority": 1},   # far downwind
    {"x": 480, "y": 280, "id": "TK-03", "priority": 0},   # upwind (should be ~0)
    {"x": 520, "y": 250, "id": "TK-04", "priority": 0},   # upwind (should be ~0)
    {"x": 560, "y": 310, "id": "PB-01", "priority": 2},   # crosswind right
]


def generate_time_series_readings(source, sensors, wind_speed, wind_direction, emission_rate, frame_count=30, dt=10.0):
    """Generate time-series sensor readings simulating a transient leak.

    Gas travels from source at wind speed. Each sensor sees concentration
    build up after the gas front arrives, approaching steady-state.
    """
    readings = []
    for sensor in sensors:
        distance_m = math.hypot(sensor["x"] - source["x"], sensor["y"] - source["y"]) * MAP_METERS_PER_UNIT
        arrival_time = distance_m / max(wind_speed, 0.5)
        steady_state = gaussian_plume_predict(
            source["x"], source["y"],
            sensor["x"], sensor["y"],
            wind_speed, wind_direction, emission_rate,
        )
        series = []
        for frame_idx in range(frame_count):
            t = frame_idx * dt
            if t < arrival_time:
                conc = 0.0
            else:
                elapsed = t - arrival_time
                buildup = min(1.0, elapsed / max(arrival_time, 1.0))
                conc = steady_state * buildup
            series.append({
                "frameIndex": frame_idx,
                "timeSec": round(frame_idx * dt, 1),
                "concentration": round(max(0, conc), 4),
            })
        peak = max(item["concentration"] for item in series)
        readings.append({
            "id": sensor["id"],
            "priority": sensor["priority"],
            "x": sensor["x"],
            "y": sensor["y"],
            "mapPoint": {"x": sensor["x"], "y": sensor["y"]},
            "sampledSeries": series,
            "sampledPeak": round(peak, 4),
        })
    return readings


def build_coarse_search_payload(sensors, wind_speed, wind_direction, current_frame_index=20):
    """Build a coarse search API payload."""
    return {
        "gas": {"gasId": "NH3", "id": "NH3", "warningThreshold": 25, "dangerThreshold": 50},
        "scenario": {"windSpeed": wind_speed, "windDirection": wind_direction},
        "sensors": sensors,
        "currentFrameIndex": current_frame_index,
        "frameTimeSec": current_frame_index * 10,
        "config": {
            "topK": 4,
            "gridStep": 25,
            "candidateRadius": 45,
            "supportRadius": 140,
            "mergeDistance": 80,
            "minObservationThreshold": 0.01,
        },
    }


def build_inversion_payload(sensors, coarse_result, wind_speed, wind_direction, current_frame_index=20):
    """Build a full inversion API payload."""
    return {
        "refinementInput": {
            "gas": {"gasId": "NH3", "id": "NH3", "warningThreshold": 25, "dangerThreshold": 50},
            "scenario": {"windSpeed": wind_speed, "windDirection": wind_direction},
            "refinementConfig": {"topK": 4, "animationSteps": 15, "minSignalThreshold": 0.01},
            "frameContext": {"currentFrameIndex": current_frame_index},
        },
        "observationPayload": {
            "sensors": sensors,
            "scenario": {"windSpeed": wind_speed, "windDirection": wind_direction},
            "timeline": {"currentFrameIndex": current_frame_index, "currentTimeSec": current_frame_index * 10},
        },
        "coarseSearchResult": coarse_result,
        "sourceMapPoint": TRUE_SOURCE,
    }


def distance(a, b):
    return math.hypot(a["x"] - b["x"], a["y"] - b["y"])


def run_scenario(scenario_name, true_source, wind_speed, wind_direction, emission_rate, sensors):
    """Run a single test scenario and print results."""
    global TRUE_SOURCE, WIND_SPEED, WIND_DIRECTION, EMISSION_RATE, SENSOR_POSITIONS
    TRUE_SOURCE = true_source
    WIND_SPEED = wind_speed
    WIND_DIRECTION = wind_direction
    EMISSION_RATE = emission_rate
    SENSOR_POSITIONS = sensors

    print("=" * 60)
    print(f"Scenario: {scenario_name}")
    print("=" * 60)
    print(f"\nTrue source: ({true_source['x']}, {true_source['y']})")
    print(f"Wind: speed={wind_speed} m/s, direction={wind_direction} deg")
    print(f"Emission rate: {emission_rate}")
    print(f"Sensors: {len(sensors)}")

    # Generate time-series readings
    sensor_readings = generate_time_series_readings(
        TRUE_SOURCE, SENSOR_POSITIONS, WIND_SPEED, WIND_DIRECTION, EMISSION_RATE
    )

    print("\n--- Sensor Readings ---")
    for s in sensor_readings:
        peak = s["sampledPeak"]
        arrival = next((item["timeSec"] for item in s["sampledSeries"] if item["concentration"] > 0), None)
        print(f"  {s['id']:8s} at ({s['x']:4d}, {s['y']:4d})  peak={peak:.4f}  arrival={arrival}s")

    # Step 1: Coarse search
    print("\n" + "=" * 60)
    print("Stage 1: Coarse Grid Search")
    print("=" * 60)
    t0 = time.time()
    coarse_payload = build_coarse_search_payload(sensor_readings, WIND_SPEED, WIND_DIRECTION, current_frame_index=20)
    coarse_result = run_coarse_search(coarse_payload)
    t1 = time.time()

    print(f"  Time: {t1 - t0:.3f}s")
    print(f"  Candidates: {len(coarse_result['candidateRegions'])}")
    for region in coarse_result["candidateRegions"]:
        dist = distance(region["center"], TRUE_SOURCE)
        print(
            f"    #{region['rank']} center=({region['center']['x']:.0f}, {region['center']['y']:.0f}) "
            f"score={region['score']:.4f} error={region['error']:.4f} "
            f"support={region['supportCount']} dist_to_true={dist:.1f}"
        )

    # Check if true source is within any candidate region
    in_region = False
    for region in coarse_result["candidateRegions"]:
        if distance(region["center"], TRUE_SOURCE) <= region["radius"]:
            in_region = True
            print(f"  >> True source is within candidate region #{region['rank']}")
            break
    if not in_region:
        min_dist = min(distance(r["center"], TRUE_SOURCE) for r in coarse_result["candidateRegions"])
        print(f"  !! True source NOT in any candidate region (closest: {min_dist:.1f} px)")

    # Step 2: Full inversion
    print("\n" + "=" * 60)
    print("Stage 2: Full Analytic Inversion (topK refinement)")
    print("=" * 60)
    inversion_payload = build_inversion_payload(sensor_readings, coarse_result, WIND_SPEED, WIND_DIRECTION, current_frame_index=20)
    normalized_dataset = normalize_inversion_payload(inversion_payload)
    print(f"  Active sensors for inversion: {len(normalized_dataset.get('activeSensors', []))}")

    t2 = time.time()
    inversion_result = run_two_stage_inversion(normalized_dataset)
    t3 = time.time()

    print(f"  Time: {t3 - t2:.3f}s")
    print(f"  Total time: {t3 - t0:.3f}s")

    estimated = inversion_result["estimatedSource"]
    error = None
    if estimated:
        est_point = estimated["mapPoint"]
        error = distance(est_point, TRUE_SOURCE)
        print(f"\n  Estimated source: ({est_point['x']:.1f}, {est_point['y']:.1f})")
        print(f"  Confidence radius: {estimated['radius']:.1f}")
        print(f"  Source match error: {error:.2f} px ({error * MAP_METERS_PER_UNIT:.1f} m)")
        print(f"  Matched (<=15px): {inversion_result['errorMetrics']['matched']}")
    else:
        print("  !! No estimated source returned")

    em = inversion_result["errorMetrics"]
    print(f"\n  Final loss: {em['finalLoss']:.4f}")
    print(f"  Optimizer converged: {em['optimizerConverged']}")
    print(f"  Optimizer iterations: {em['optimizerIterations']}")
    print(f"  Active sensors: {em['activeSensorCount']}")
    print(f"  Candidates refined: topK={inversion_payload['refinementInput']['refinementConfig']['topK']}")

    # Loss history summary
    lh = inversion_result["lossHistory"]
    if lh:
        print(f"\n  Loss history: [{', '.join(f'{v:.4f}' for v in lh[:5])}{'...' if len(lh) > 5 else ''}]")
        print(f"  Loss reduction: {lh[0]:.4f} -> {lh[-1]:.4f} ({(1 - lh[-1]/max(lh[0], 1e-9))*100:.1f}%)")

    # Summary
    print("\n" + "=" * 60)
    print("Summary")
    print("=" * 60)
    if estimated:
        error_m = error * MAP_METERS_PER_UNIT
        if error_m < 10:
            print(f"  PASS: Source located within {error_m:.1f}m (excellent)")
        elif error_m < 25:
            print(f"  PASS: Source located within {error_m:.1f}m (good)")
        elif error_m < 50:
            print(f"  WARN: Source located within {error_m:.1f}m (acceptable)")
        else:
            print(f"  FAIL: Source error {error_m:.1f}m (too large)")
    else:
        print("  FAIL: No source estimated")

    if estimated:
        return estimated, error
    return None, None


SCENARIOS = [
    {
        "name": "South wind, leak at tower area",
        "source": {"x": 520, "y": 310},
        "wind_speed": 1.5, "wind_direction": 90, "emission": 50.0,
        "sensors": [
            {"x": 510, "y": 340, "id": "TW-01", "priority": 3},
            {"x": 530, "y": 380, "id": "TW-02", "priority": 2},
            {"x": 500, "y": 430, "id": "PA-01", "priority": 2},
            {"x": 540, "y": 360, "id": "PA-02", "priority": 1},
            {"x": 460, "y": 350, "id": "TK-01", "priority": 1},
            {"x": 580, "y": 370, "id": "TK-02", "priority": 1},
            {"x": 510, "y": 480, "id": "PA-03", "priority": 1},
            {"x": 480, "y": 280, "id": "TK-03", "priority": 0},
            {"x": 520, "y": 250, "id": "TK-04", "priority": 0},
            {"x": 560, "y": 310, "id": "PB-01", "priority": 2},
        ],
    },
    {
        "name": "East wind, leak at tank farm",
        "source": {"x": 170, "y": 310},
        "wind_speed": 2.0, "wind_direction": 0, "emission": 40.0,
        "sensors": [
            {"x": 220, "y": 300, "id": "TK-01", "priority": 3},
            {"x": 280, "y": 320, "id": "TK-02", "priority": 2},
            {"x": 350, "y": 310, "id": "PA-01", "priority": 2},
            {"x": 250, "y": 350, "id": "TK-03", "priority": 1},
            {"x": 200, "y": 280, "id": "TK-04", "priority": 1},
            {"x": 420, "y": 300, "id": "PA-02", "priority": 1},
            {"x": 150, "y": 350, "id": "TK-05", "priority": 0},
            {"x": 100, "y": 310, "id": "TK-06", "priority": 0},
        ],
    },
    {
        "name": "SE wind, leak at production area",
        "source": {"x": 450, "y": 150},
        "wind_speed": 1.8, "wind_direction": 135, "emission": 60.0,
        "sensors": [
            {"x": 420, "y": 200, "id": "PA-01", "priority": 3},
            {"x": 470, "y": 250, "id": "PA-02", "priority": 2},
            {"x": 400, "y": 280, "id": "PA-03", "priority": 2},
            {"x": 500, "y": 220, "id": "PA-04", "priority": 1},
            {"x": 380, "y": 230, "id": "TK-01", "priority": 1},
            {"x": 520, "y": 280, "id": "TK-02", "priority": 1},
            {"x": 450, "y": 120, "id": "TK-03", "priority": 0},
            {"x": 480, "y": 100, "id": "TK-04", "priority": 0},
        ],
    },
]


def main():
    results = []
    for scenario in SCENARIOS:
        print()
        estimated, error = run_scenario(
            scenario["name"],
            scenario["source"],
            scenario["wind_speed"],
            scenario["wind_direction"],
            scenario["emission"],
            scenario["sensors"],
        )
        error_m = error * MAP_METERS_PER_UNIT if error else float("inf")
        passed = error_m < 50
        results.append((scenario["name"], error_m, passed))
        print(f"\n  => {'PASS' if passed else 'FAIL'}: {error_m:.1f}m error")

    print("\n" + "=" * 60)
    print("Overall Results")
    print("=" * 60)
    all_pass = True
    for name, error_m, passed in results:
        status = "PASS" if passed else "FAIL"
        print(f"  [{status}] {name}: {error_m:.1f}m")
        if not passed:
            all_pass = False

    print(f"\n  Total: {sum(1 for _, _, p in results if p)}/{len(results)} passed")
    return 0 if all_pass else 1


if __name__ == "__main__":
    sys.exit(main())
