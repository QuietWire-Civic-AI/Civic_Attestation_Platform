"""
Project: QuietWire CAP (Civic AI Canon Platform) V 1.0.0
Website: https://quietwire.ai
Authors: Ashraf Saleh Alhajj; Raasid (AI Companion)
SPDX-License-Identifier: Apache-2.0
SPDX-FileCopyrightText: 2025 QuietWire
SPDX-FileContributor: Ashraf Saleh Alhajj
SPDX-FileContributor: Raasid (AI Companion)

CAP module: logger.py
"""
import logging
import json
import sys
from typing import Any, Dict, Optional
from datetime import datetime
import frappe
"""Structured Logging

Provides structured logging with JSON output for production.
"""



class StructuredFormatter(logging.Formatter):
    """JSON formatter for structured logging."""
    
    def format(self, record: logging.LogRecord) -> str:
        """Format log record as JSON.
        
        Args:
            record: Log record
            
        Returns:
            JSON formatted log string
        """
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno
        }
        
        # Add extra fields
        if hasattr(record, 'extra_data'):
            log_data.update(record.extra_data)
        
        # Add exception info if present
        if record.exc_info:
            log_data['exception'] = self.formatException(record.exc_info)
        
        # Add Frappe-specific context
        try:
            if frappe.local.request:
                log_data['request'] = {
                    'method': frappe.local.request.method,
                    'path': frappe.local.request.path,
                    'ip': frappe.local.request_ip
                }
            
            if frappe.session.user:
                log_data['user'] = frappe.session.user
            
            if hasattr(frappe.local, 'site'):
                log_data['site'] = frappe.local.site
        except:
            pass
        
        return json.dumps(log_data)


class HumanReadableFormatter(logging.Formatter):
    """Human-readable formatter for development."""
    
    COLORS = {
        'DEBUG': '\033[36m',      # Cyan
        'INFO': '\033[32m',       # Green
        'WARNING': '\033[33m',    # Yellow
        'ERROR': '\033[31m',      # Red
        'CRITICAL': '\033[35m',   # Magenta
        'RESET': '\033[0m'
    }
    
    def format(self, record: logging.LogRecord) -> str:
        """Format log record in human-readable format.
        
        Args:
            record: Log record
            
        Returns:
            Formatted log string
        """
        color = self.COLORS.get(record.levelname, self.COLORS['RESET'])
        reset = self.COLORS['RESET']
        
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        # Base format
        msg = f"{color}[{timestamp}] {record.levelname:8s}{reset} {record.name} - {record.getMessage()}"
        
        # Add extra data
        if hasattr(record, 'extra_data') and record.extra_data:
            extra_str = json.dumps(record.extra_data, indent=2)
            msg += f"\n{extra_str}"
        
        # Add exception
        if record.exc_info:
            msg += f"\n{self.formatException(record.exc_info)}"
        
        return msg


class StructuredLogger(logging.Logger):
    """Custom logger with structured logging support."""
    
    def __init__(self, name: str, level=logging.NOTSET):
        super().__init__(name, level)
        self.extra_data = {}
    
    def _log(self, level, msg, args, exc_info=None, extra=None, stack_info=False, stacklevel=1):
        """Override _log to inject extra data."""
        if extra is None:
            extra = {}
        
        # Merge with instance extra_data
        merged_extra = {**self.extra_data, **extra}
        
        # Create a custom LogRecord with extra_data attribute
        if merged_extra:
            extra['extra_data'] = merged_extra
        
        super()._log(level, msg, args, exc_info, extra, stack_info, stacklevel + 1)
    
    def with_context(self, **kwargs) -> 'StructuredLogger':
        """Add context to all log messages.
        
        Returns:
            Self for chaining
        """
        self.extra_data.update(kwargs)
        return self


def get_logger(name: str) -> StructuredLogger:
    """Get a structured logger instance.
    
    Args:
        name: Logger name (typically __name__)
        
    Returns:
        StructuredLogger instance
    """
    # Set custom logger class
    logging.setLoggerClass(StructuredLogger)
    
    logger = logging.getLogger(name)
    
    # Configure if not already configured
    if not logger.handlers:
        setup_logging()
    
    return logger


def setup_logging(log_level: str = "INFO", use_json: bool = None):
    """Setup logging configuration.
    
    Args:
        log_level: Log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        use_json: Use JSON format (default: auto-detect based on environment)
    """
    # Auto-detect format based on environment
    if use_json is None:
        # Use JSON in production, human-readable in development
        use_json = frappe.conf.get('developer_mode', 0) == 0
    
    # Choose formatter
    if use_json:
        formatter = StructuredFormatter()
    else:
        formatter = HumanReadableFormatter()
    
    # Setup handler
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)
    
    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, log_level.upper()))
    
    # Remove existing handlers
    for h in root_logger.handlers[:]:
        root_logger.removeHandler(h)
    
    root_logger.addHandler(handler)
    
    # Configure Frappe logger
    frappe_logger = logging.getLogger('frappe')
    frappe_logger.setLevel(logging.WARNING)  # Reduce Frappe noise
