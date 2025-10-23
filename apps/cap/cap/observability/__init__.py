"""
Project: QuietWire CAP (Civic AI Canon Platform) V 1.0.0
Website: https://quietwire.ai
Authors: Ashraf Saleh Alhajj; Raasid (AI Companion)
SPDX-License-Identifier: Apache-2.0
SPDX-FileCopyrightText: 2025 QuietWire
SPDX-FileContributor: Ashraf Saleh Alhajj
SPDX-FileContributor: Raasid (AI Companion)

CAP module: __init__.py
"""
    from cap.observability import get_logger, MetricsCollector, Tracer
from cap.observability.logger import get_logger, setup_logging
from cap.observability.metrics import MetricsCollector
from cap.observability.tracer import Tracer
"""Observability Stack

Provides structured logging, metrics collection, and distributed tracing.

Usage:
    
    logger = get_logger(__name__)
    logger.info("Operation started", extra={'user': 'john'})
    
    metrics = MetricsCollector()
    metrics.record('api.request', 1, method='GET', status=200)
    
    tracer = Tracer()
    with tracer.span('database_query'):
        # Your code here
        pass
"""


__all__ = ['get_logger', 'setup_logging', 'MetricsCollector', 'Tracer']
