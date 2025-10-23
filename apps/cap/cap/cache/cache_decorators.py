"""
Project: QuietWire CAP (Civic AI Canon Platform) V 1.0.0
Website: https://quietwire.ai
Authors: Ashraf Saleh Alhajj; Raasid (AI Companion)
SPDX-License-Identifier: Apache-2.0
SPDX-FileCopyrightText: 2025 QuietWire
SPDX-FileContributor: Ashraf Saleh Alhajj
SPDX-FileContributor: Raasid (AI Companion)

CAP module: cache_decorators.py
"""
import functools
import hashlib
import json
from typing import Callable, Any, Optional
from cap.cache.cache_manager import CacheManager
"""Cache Decorators

Decorators for easy method caching.
"""



def cached(ttl: int = 300, key_prefix: Optional[str] = None, cache_manager: Optional[CacheManager] = None):
    """Decorator to cache function results.
    
    Args:
        ttl: Time to live in seconds (default: 5 minutes)
        key_prefix: Optional cache key prefix
        cache_manager: Optional custom cache manager
        
    Usage:
        @cached(ttl=600, key_prefix='user')
        def get_user(user_id):
            return expensive_operation(user_id)
    """
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            # Initialize cache manager
            cache = cache_manager or CacheManager()
            
            # Generate cache key
            cache_key = _generate_cache_key(func, args, kwargs, key_prefix)
            
            # Try to get from cache
            cached_value = cache.get(cache_key)
            if cached_value is not None:
                return cached_value
            
            # Execute function
            result = func(*args, **kwargs)
            
            # Store in cache
            cache.set(cache_key, result, ttl=ttl)
            
            return result
        
        return wrapper
    return decorator


def invalidate_cache(key_pattern: str, cache_manager: Optional[CacheManager] = None):
    """Decorator to invalidate cache after function execution.
    
    Args:
        key_pattern: Cache key pattern to invalidate
        cache_manager: Optional custom cache manager
        
    Usage:
        @invalidate_cache('user:*')
        def update_user(user_id, data):
            # Update user
            pass
    """
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            # Execute function
            result = func(*args, **kwargs)
            
            # Invalidate cache
            cache = cache_manager or CacheManager()
            cache.delete_pattern(key_pattern)
            
            return result
        
        return wrapper
    return decorator


def _generate_cache_key(func: Callable, args: tuple, kwargs: dict, prefix: Optional[str] = None) -> str:
    """Generate cache key from function and arguments.
    
    Args:
        func: Function object
        args: Positional arguments
        kwargs: Keyword arguments
        prefix: Optional prefix
        
    Returns:
        Cache key string
    """
    # Create key components
    func_name = f"{func.__module__}.{func.__name__}"
    
    # Serialize arguments
    args_str = json.dumps(args, sort_keys=True, default=str)
    kwargs_str = json.dumps(kwargs, sort_keys=True, default=str)
    
    # Create hash
    content = f"{args_str}:{kwargs_str}"
    content_hash = hashlib.md5(content.encode()).hexdigest()[:8]
    
    # Build key
    if prefix:
        return f"{prefix}:{func_name}:{content_hash}"
    else:
        return f"cache:{func_name}:{content_hash}"
