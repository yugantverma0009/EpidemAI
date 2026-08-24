"""
Prediction service using moving averages and weighted trend extrapolation.
"""
import numpy as np

def moving_average(data: list, window: int = 7) -> list:
    if len(data) < window:
        return data
    return np.convolve(data, np.ones(window) / window, mode="valid").tolist()

def forecast_cases(current_cases: int, trend: str, days: int = 7) -> list:
    # Conservative, damped daily movement keeps a 7-day projection explainable
    # and avoids implying exponential growth from a short signal window.
    velocity = 0.04 if trend == "up" else -0.025 if trend == "down" else 0.005
    decay = 0.92
    result = [current_cases]
    for i in range(1, days):
        delta = current_cases * velocity * (decay ** i)
        result.append(round(result[-1] + delta))
    return result

def compute_risk_score(cases: int, mentions: int, population_millions: float, trend: str) -> int:
    case_density = min(100, (cases / max(population_millions, 0.5)) * 2)
    trend_weight = 1.3 if trend == "up" else 0.8 if trend == "down" else 1.0
    mention_factor = min(100, mentions / 10)
    score = (0.35 * case_density + 0.25 * (trend_weight * 40) + 0.20 * mention_factor + 0.20 * 50)
    return max(0, min(100, round(score)))
