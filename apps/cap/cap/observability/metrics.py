"""
Project: QuietWire CAP (Civic AI Canon Platform) V 1.0.0
Website: https://quietwire.ai
Authors: Ashraf Saleh Alhajj; Raasid (AI Companion)
SPDX-License-Identifier: Apache-2.0
SPDX-FileCopyrightText: 2025 QuietWire
SPDX-FileContributor: Ashraf Saleh Alhajj
SPDX-FileContributor: Raasid (AI Companion)

CAP module: metrics.py
"""
import frappe
from typing import Dict, Any, Optional
from datetime import datetime
import json
        import time
        import time
"""Metrics Collection

Collects and exports application metrics.
"""



class MetricsCollector:
    """Metrics collector for application monitoring.
    
    Supports:
    - Counters (incremental values)
    - Gauges (current values)
    - Histograms (distributions)
    - Timers (duration tracking)
    """
    
    def __init__(self, prefix: str = "cap"):
        """Initialize metrics collector.
        
        Args:
            prefix: Metric name prefix
        """
        self.prefix = prefix
        self._metrics_buffer = []
    
    def counter(self, name: str, value: float = 1, **tags) -> None:
        """Record a counter metric.
        
        Args:
            name: Metric name
            value: Increment value (default: 1)
            **tags: Metric tags
        """
        self._record_metric("counter", name, value, tags)
    
    def gauge(self, name: str, value: float, **tags) -> None:
        """Record a gauge metric.
        
        Args:
            name: Metric name
            value: Current value
            **tags: Metric tags
        """
        self._record_metric("gauge", name, value, tags)
    
    def histogram(self, name: str, value: float, **tags) -> None:
        """Record a histogram metric.
        
        Args:
            name: Metric name
            value: Sample value
            **tags: Metric tags
        """
        self._record_metric("histogram", name, value, tags)
    
    def timer(self, name: str, duration: float, **tags) -> None:
        """Record a timer metric.
        
        Args:
            name: Metric name
            duration: Duration in seconds
            **tags: Metric tags
        """
        self._record_metric("timer", name, duration, tags)
    
    def record(self, name: str, value: float, metric_type: str = "counter", **tags) -> None:
        """Record a generic metric.
        
        Args:
            name: Metric name
            value: Metric value
            metric_type: Type of metric (counter, gauge, histogram, timer)
            **tags: Metric tags
        """
        self._record_metric(metric_type, name, value, tags)
    
    def timing_context(self, name: str, **tags):
        """Context manager for timing operations.
        
        Usage:
            metrics = MetricsCollector()
            with metrics.timing_context('api.request', endpoint='/users'):
                # Your code here
                pass
        """
        return TimingContext(self, name, tags)
    
    def _record_metric(self, metric_type: str, name: str, value: float, tags: Dict) -> None:
        """Internal method to record metric.
        
        Args:
            metric_type: Type of metric
            name: Metric name
            value: Metric value
            tags: Metric tags
        """
        metric = {
            "type": metric_type,
            "name": f"{self.prefix}.{name}",
            "value": value,
            "tags": tags,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Add default tags
        try:
            if frappe.session.user:
                metric["tags"]["user"] = frappe.session.user
            
            if hasattr(frappe.local, 'site'):
                metric["tags"]["site"] = frappe.local.site
        except:
            pass
        
        # Store metric
        self._store_metric(metric)
    
    def _store_metric(self, metric: Dict) -> None:
        """Store metric.
        
        Args:
            metric: Metric data
        """
        try:
            # Buffer metrics
            self._metrics_buffer.append(metric)
            
            # Flush if buffer is large
            if len(self._metrics_buffer) >= 100:
                self.flush()
        except Exception as e:
            frappe.log_error(f"Failed to store metric: {str(e)}", "MetricsCollector")
    
    def flush(self) -> None:
        """Flush metrics buffer."""
        if not self._metrics_buffer:
            return
        
        try:
            # In production, you would send to your metrics backend
            # (e.g., Prometheus, StatsD, CloudWatch, etc.)
            
            # For now, log to Frappe
            for metric in self._metrics_buffer:
                self._log_metric(metric)
            
            self._metrics_buffer.clear()
        except Exception as e:
            frappe.log_error(f"Failed to flush metrics: {str(e)}", "MetricsCollector")
    
    def _log_metric(self, metric: Dict) -> None:
        """Log metric to Frappe.
        
        Args:
            metric: Metric data
        """
        # Log to Frappe's error log for now
        # In production, replace with proper metrics backend
        frappe.logger().debug(f"METRIC: {json.dumps(metric)}")


class TimingContext:
    """Context manager for timing operations."""
    
    def __init__(self, collector: MetricsCollector, name: str, tags: Dict):
        """Initialize timing context.
        
        Args:
            collector: MetricsCollector instance
            name: Metric name
            tags: Metric tags
        """
        self.collector = collector
        self.name = name
        self.tags = tags
        self.start_time = None
    
    def __enter__(self):
        """Enter context."""
        self.start_time = time.time()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Exit context."""
        duration = time.time() - self.start_time
        
        # Add status tag
        if exc_type is not None:
            self.tags['status'] = 'error'
            self.tags['error_type'] = exc_type.__name__
        else:
            self.tags['status'] = 'success'
        
        self.collector.timer(self.name, duration, **self.tags)
