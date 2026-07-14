"""Gas-source inversion package executed inside Pyodide/Python workers.

Uses grid search, weighted-centroid estimation, a physics-informed deep
surrogate forward model, and Ensemble Kalman Inversion (EKI). The older
analytic helpers remain for compatibility and regression checks.
"""
