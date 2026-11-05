
# Rainfall Prediction Using Machine Learning

Category: Portfolio Project
Domain: Machine Learning, Weather Analytics
Project Type: Binary Classification

## Project Overview

Developed and compared two end-to-end machine learning pipelines to predict rainfall using a weather dataset containing 366 samples.

The project evaluated a baseline Random Forest model against an optimized machine learning pipeline incorporating outlier handling, feature scaling, SMOTE, and Principal Component Analysis (PCA).

## Technologies Used

- Python
- Scikit-learn
- XGBoost
- Imbalanced-learn
- Random Forest
- Logistic Regression
- GridSearchCV
- Repeated Stratified K-Fold Cross-Validation
- SMOTE
- PCA

## Methodology

- Built two machine learning pipelines for binary rainfall classification.
- Evaluated three model families: Logistic Regression, Random Forest, and XGBoost.
- Applied outlier handling and feature scaling.
- Used SMOTE to address class imbalance.
- Applied PCA for dimensionality reduction.
- Performed hyperparameter tuning using GridSearchCV.
- Evaluated models using Repeated Stratified K-Fold cross-validation.
- Analyzed precision-recall trade-offs to understand classification performance.

## Key Results

- Dataset Size: 366 weather samples.
- Baseline Test Accuracy: 74.5%.
- Optimized Test Accuracy: 77%.
- Baseline Cross-Validated Accuracy: 82%.
- Optimized Cross-Validated Accuracy: 87%.
- Test Accuracy Improvement: 2.5 percentage points.
- Cross-Validated Accuracy Improvement: 5 percentage points.

## Deliverables

Created a model comparison report and dashboard summarizing machine learning performance, evaluation results, and methodological limitations.

## Project Classification

This is a machine learning portfolio project.

Do not attribute this project to HCLTech, Nullclass, or another employer unless explicitly documented.

Do not claim that the model was deployed to production.
