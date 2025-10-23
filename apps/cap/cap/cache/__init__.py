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
    from cap.cache import CacheManager
from cap.cache.cache_manager import CacheManager
from cap.cache.cache_decorators import cached, invalidate_cache
"""Caching Layer

Provides flexible caching with Frappe cache and optional Redis support.

Usage:
    
    cache = CacheManager()
    cache.set('key', 'value', ttl=300)
    value = cache.get('key')
"""


__all__ = ['CacheManager', 'cached', 'invalidate_cache']
