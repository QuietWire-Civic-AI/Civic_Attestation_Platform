"""
Project: QuietWire CAP (Civic AI Canon Platform) V 1.0.0
Website: https://quietwire.ai
Authors: Ashraf Saleh Alhajj; Raasid (AI Companion)
SPDX-License-Identifier: Apache-2.0
SPDX-FileCopyrightText: 2025 QuietWire
SPDX-FileContributor: Ashraf Saleh Alhajj
SPDX-FileContributor: Raasid (AI Companion)

CAP module: cache_manager.py
"""
import frappe
from typing import Any, Optional, List
import json
from datetime import timedelta
            import redis
            import redis
            from frappe.utils.redis_wrapper import RedisWrapper
"""Cache Manager

Unified caching interface supporting Frappe cache and Redis.
"""



class CacheManager:
    """Unified cache manager.
    
    Automatically uses Redis if available, falls back to Frappe cache.
    """
    
    def __init__(self, use_redis: bool = True):
        """Initialize cache manager.
        
        Args:
            use_redis: Try to use Redis if available (default: True)
        """
        self.use_redis = use_redis and self._is_redis_available()
        self.redis_client = None
        
        if self.use_redis:
            self._init_redis()
    
    def get(self, key: str, default: Any = None) -> Any:
        """Get value from cache.
        
        Args:
            key: Cache key
            default: Default value if not found
            
        Returns:
            Cached value or default
        """
        try:
            if self.use_redis and self.redis_client:
                value = self.redis_client.get(key)
                if value:
                    return json.loads(value)
            else:
                value = frappe.cache().get_value(key)
                if value is not None:
                    return value
        except Exception as e:
            frappe.log_error(f"Cache get error: {str(e)}", "CacheManager")
        
        return default
    
    def set(self, key: str, value: Any, ttl: int = 300) -> bool:
        """Set value in cache.
        
        Args:
            key: Cache key
            value: Value to cache
            ttl: Time to live in seconds (default: 5 minutes)
            
        Returns:
            True if successful
        """
        try:
            if self.use_redis and self.redis_client:
                serialized = json.dumps(value)
                self.redis_client.setex(key, ttl, serialized)
                return True
            else:
                frappe.cache().set_value(key, value, expires_in_sec=ttl)
                return True
        except Exception as e:
            frappe.log_error(f"Cache set error: {str(e)}", "CacheManager")
            return False
    
    def delete(self, key: str) -> bool:
        """Delete key from cache.
        
        Args:
            key: Cache key
            
        Returns:
            True if successful
        """
        try:
            if self.use_redis and self.redis_client:
                self.redis_client.delete(key)
            else:
                frappe.cache().delete_value(key)
            return True
        except Exception as e:
            frappe.log_error(f"Cache delete error: {str(e)}", "CacheManager")
            return False
    
    def delete_pattern(self, pattern: str) -> int:
        """Delete all keys matching pattern.
        
        Args:
            pattern: Key pattern (e.g., 'user:*')
            
        Returns:
            Number of keys deleted
        """
        try:
            if self.use_redis and self.redis_client:
                keys = self.redis_client.keys(pattern)
                if keys:
                    return self.redis_client.delete(*keys)
                return 0
            else:
                # Frappe cache doesn't support pattern deletion
                # This is a limitation of the Frappe cache
                frappe.cache().delete_value(pattern)
                return 1
        except Exception as e:
            frappe.log_error(f"Cache pattern delete error: {str(e)}", "CacheManager")
            return 0
    
    def exists(self, key: str) -> bool:
        """Check if key exists.
        
        Args:
            key: Cache key
            
        Returns:
            True if exists
        """
        try:
            if self.use_redis and self.redis_client:
                return self.redis_client.exists(key) > 0
            else:
                return frappe.cache().get_value(key) is not None
        except Exception as e:
            frappe.log_error(f"Cache exists error: {str(e)}", "CacheManager")
            return False
    
    def increment(self, key: str, amount: int = 1) -> int:
        """Increment numeric value.
        
        Args:
            key: Cache key
            amount: Increment amount
            
        Returns:
            New value
        """
        try:
            if self.use_redis and self.redis_client:
                return self.redis_client.incrby(key, amount)
            else:
                current = self.get(key, 0)
                new_value = current + amount
                self.set(key, new_value)
                return new_value
        except Exception as e:
            frappe.log_error(f"Cache increment error: {str(e)}", "CacheManager")
            return 0
    
    def decrement(self, key: str, amount: int = 1) -> int:
        """Decrement numeric value.
        
        Args:
            key: Cache key
            amount: Decrement amount
            
        Returns:
            New value
        """
        return self.increment(key, -amount)
    
    def get_many(self, keys: List[str]) -> dict:
        """Get multiple values.
        
        Args:
            keys: List of cache keys
            
        Returns:
            Dictionary of key-value pairs
        """
        result = {}
        for key in keys:
            value = self.get(key)
            if value is not None:
                result[key] = value
        return result
    
    def set_many(self, mapping: dict, ttl: int = 300) -> bool:
        """Set multiple values.
        
        Args:
            mapping: Dictionary of key-value pairs
            ttl: Time to live in seconds
            
        Returns:
            True if successful
        """
        try:
            for key, value in mapping.items():
                self.set(key, value, ttl=ttl)
            return True
        except Exception as e:
            frappe.log_error(f"Cache set_many error: {str(e)}", "CacheManager")
            return False
    
    def flush(self) -> bool:
        """Clear all cache.
        
        Returns:
            True if successful
        """
        try:
            if self.use_redis and self.redis_client:
                self.redis_client.flushdb()
            else:
                frappe.cache().flush_all()
            return True
        except Exception as e:
            frappe.log_error(f"Cache flush error: {str(e)}", "CacheManager")
            return False
    
    # Private methods
    
    def _is_redis_available(self) -> bool:
        """Check if Redis is available."""
        try:
            return True
        except ImportError:
            return False
    
    def _init_redis(self):
        """Initialize Redis client."""
        try:
            
            # Try to get Redis config from Frappe
            redis_server = frappe.conf.get('redis_cache') or frappe.conf.get('redis_server')
            
            if redis_server:
                # Use Frappe's Redis configuration
                self.redis_client = frappe.cache().redis_cache
            else:
                # Fallback to default Redis
                self.redis_client = redis.Redis(
                    host='localhost',
                    port=6379,
                    db=0,
                    decode_responses=True
                )
                
                # Test connection
                self.redis_client.ping()
        except Exception as e:
            frappe.log_error(f"Redis initialization failed: {str(e)}", "CacheManager")
            self.use_redis = False
            self.redis_client = None
