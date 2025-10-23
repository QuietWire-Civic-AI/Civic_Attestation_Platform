"""
Project: QuietWire CAP (Civic AI Canon Platform) V 1.0.0
Website: https://quietwire.ai
Authors: Ashraf Saleh Alhajj; Raasid (AI Companion)
SPDX-License-Identifier: Apache-2.0
SPDX-FileCopyrightText: 2025 QuietWire
SPDX-FileContributor: Ashraf Saleh Alhajj
SPDX-FileContributor: Raasid (AI Companion)

CAP module: tracer.py
"""
import frappe
import uuid
import time
from typing import Optional, Dict, Any
from datetime import datetime
import json
"""Distributed Tracing

Provides distributed tracing for request tracking across services.
"""



class Tracer:
    """Distributed tracer for tracking requests.
    
    Implements a simple tracing mechanism compatible with OpenTelemetry concepts.
    """
    
    def __init__(self, trace_id: Optional[str] = None):
        """Initialize tracer.
        
        Args:
            trace_id: Optional trace ID (auto-generated if not provided)
        """
        self.trace_id = trace_id or self._generate_trace_id()
        self.spans = []
    
    def span(self, name: str, **attributes):
        """Create a new span.
        
        Args:
            name: Span name
            **attributes: Span attributes
            
        Returns:
            Span context manager
        """
        return Span(self, name, attributes)
    
    def add_span(self, span_data: Dict) -> None:
        """Add completed span to trace.
        
        Args:
            span_data: Span data
        """
        self.spans.append(span_data)
    
    def get_trace_context(self) -> Dict:
        """Get trace context for propagation.
        
        Returns:
            Trace context dictionary
        """
        return {
            "trace_id": self.trace_id,
            "span_count": len(self.spans)
        }
    
    def export(self) -> Dict:
        """Export trace data.
        
        Returns:
            Complete trace data
        """
        return {
            "trace_id": self.trace_id,
            "spans": self.spans,
            "total_duration": sum(s.get('duration', 0) for s in self.spans)
        }
    
    def _generate_trace_id(self) -> str:
        """Generate unique trace ID.
        
        Returns:
            Trace ID string
        """
        return str(uuid.uuid4())


class Span:
    """Span context manager for tracing operations."""
    
    def __init__(self, tracer: Tracer, name: str, attributes: Dict):
        """Initialize span.
        
        Args:
            tracer: Parent tracer
            name: Span name
            attributes: Span attributes
        """
        self.tracer = tracer
        self.span_id = str(uuid.uuid4())
        self.name = name
        self.attributes = attributes
        self.start_time = None
        self.end_time = None
        self.status = "unset"
        self.events = []
    
    def __enter__(self):
        """Enter span context."""
        self.start_time = time.time()
        self.add_event("span.start")
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Exit span context."""
        self.end_time = time.time()
        
        # Set status based on exception
        if exc_type is not None:
            self.status = "error"
            self.attributes['error'] = {
                "type": exc_type.__name__,
                "message": str(exc_val)
            }
        else:
            self.status = "ok"
        
        self.add_event("span.end")
        
        # Export span
        span_data = self._export()
        self.tracer.add_span(span_data)
        
        # Log span
        self._log_span(span_data)
    
    def add_event(self, name: str, **attributes) -> None:
        """Add event to span.
        
        Args:
            name: Event name
            **attributes: Event attributes
        """
        event = {
            "name": name,
            "timestamp": datetime.utcnow().isoformat(),
            "attributes": attributes
        }
        self.events.append(event)
    
    def set_attribute(self, key: str, value: Any) -> None:
        """Set span attribute.
        
        Args:
            key: Attribute key
            value: Attribute value
        """
        self.attributes[key] = value
    
    def _export(self) -> Dict:
        """Export span data.
        
        Returns:
            Span data dictionary
        """
        duration = (self.end_time - self.start_time) if self.end_time else 0
        
        return {
            "span_id": self.span_id,
            "trace_id": self.tracer.trace_id,
            "name": self.name,
            "start_time": self.start_time,
            "end_time": self.end_time,
            "duration": duration,
            "status": self.status,
            "attributes": self.attributes,
            "events": self.events
        }
    
    def _log_span(self, span_data: Dict) -> None:
        """Log span data.
        
        Args:
            span_data: Span data
        """
        try:
            frappe.logger().debug(f"TRACE: {json.dumps(span_data)}")
        except Exception as e:
            frappe.log_error(f"Failed to log span: {str(e)}", "Tracer")


def get_current_trace() -> Optional[Tracer]:
    """Get current trace from context.
    
    Returns:
        Current tracer or None
    """
    if hasattr(frappe.local, 'tracer'):
        return frappe.local.tracer
    return None


def set_current_trace(tracer: Tracer) -> None:
    """Set current trace in context.
    
    Args:
        tracer: Tracer instance
    """
    frappe.local.tracer = tracer
