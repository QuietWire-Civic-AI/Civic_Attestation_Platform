"""
Project: QuietWire CAP (Civic AI Canon Platform) V 1.0.0
Website: https://quietwire.ai
Authors: Ashraf Saleh Alhajj; Raasid (AI Companion)
SPDX-License-Identifier: Apache-2.0
SPDX-FileCopyrightText: 2025 QuietWire
SPDX-FileContributor: Ashraf Saleh Alhajj
SPDX-FileContributor: Raasid (AI Companion)

Base Service Class
All service classes should inherit from this base class.
"""

import frappe
from typing import Any, Dict, Optional
from cap.observability.logger import get_logger
from cap.observability.metrics import MetricsCollector
from cap.cache.cache_manager import CacheManager


class BaseService:
    """Base class for all services.
    
    Provides common functionality:
    - Logging
    - Metrics collection
    - Caching
    - Error handling
    """
    
    def __init__(self):
        self.logger = get_logger(self.__class__.__name__)
        self.metrics = MetricsCollector()
        self.cache = CacheManager()
        
    def log_operation(self, operation: str, **kwargs):
        """Log a service operation."""
        self.logger.info(f"Operation: {operation}", extra=kwargs)
        
    def record_metric(self, metric_name: str, value: float, **tags):
        """Record a metric."""
        self.metrics.record(metric_name, value, **tags)
        
    def get_cached(self, key: str, ttl: int = 300) -> Optional[Any]:
        """Get cached value.
        
        Args:
            key: Cache key
            ttl: Time to live in seconds (default: 5 minutes)
            
        Returns:
            Cached value or None
        """
        return self.cache.get(key)
        
    def set_cached(self, key: str, value: Any, ttl: int = 300) -> bool:
        """Set cached value.
        
        Args:
            key: Cache key
            value: Value to cache
            ttl: Time to live in seconds (default: 5 minutes)
            
        Returns:
            True if successful
        """
        return self.cache.set(key, value, ttl=ttl)
        
    def invalidate_cache(self, pattern: str) -> int:
        """Invalidate cache by pattern.
        
        Args:
            pattern: Cache key pattern (e.g., 'user:*')
            
        Returns:
            Number of keys deleted
        """
        return self.cache.delete_pattern(pattern)
        
    def execute_with_metrics(self, operation_name: str, func, *args, **kwargs):
        """Execute a function with automatic metrics collection.
        
        Args:
            operation_name: Name of the operation for metrics
            func: Function to execute
            *args, **kwargs: Arguments for the function
            
        Returns:
            Function result
        """
        import time
        start_time = time.time()
        
        try:
            result = func(*args, **kwargs)
            duration = time.time() - start_time
            
            self.record_metric(
                f"{operation_name}.duration",
                duration,
                status="success"
            )
            self.record_metric(f"{operation_name}.count", 1, status="success")
            
            return result
            
        except Exception as e:
            duration = time.time() - start_time
            
            self.record_metric(
                f"{operation_name}.duration",
                duration,
                status="error"
            )
            self.record_metric(f"{operation_name}.count", 1, status="error")
            
            self.logger.error(
                f"Operation failed: {operation_name}",
                exc_info=True,
                extra={"error": str(e)}
            )
            raise
