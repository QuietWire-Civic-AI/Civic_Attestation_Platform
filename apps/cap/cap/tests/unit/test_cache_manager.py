"""
Project: QuietWire CAP (Civic AI Canon Platform) V 1.0.0
Website: https://quietwire.ai
Authors: Ashraf Saleh Alhajj; Raasid (AI Companion)
SPDX-License-Identifier: Apache-2.0
SPDX-FileCopyrightText: 2025 QuietWire
SPDX-FileContributor: Ashraf Saleh Alhajj
SPDX-FileContributor: Raasid (AI Companion)

Test module: test_cache_manager.py
"""
import pytest
from cap.cache import CacheManager
"""Unit Tests for Cache Manager"""



class TestCacheManager:
    """Test suite for CacheManager."""
    
    def test_set_and_get(self):
        """Test basic set and get operations."""
        cache = CacheManager(use_redis=False)
        
        # Set value
        result = cache.set("test_key", "test_value", ttl=60)
        assert result is True
        
        # Get value
        value = cache.get("test_key")
        assert value == "test_value"
    
    def test_get_nonexistent_key(self):
        """Test getting non-existent key returns default."""
        cache = CacheManager(use_redis=False)
        
        value = cache.get("nonexistent_key", default="default_value")
        assert value == "default_value"
    
    def test_delete(self):
        """Test delete operation."""
        cache = CacheManager(use_redis=False)
        
        # Set then delete
        cache.set("test_key", "test_value")
        result = cache.delete("test_key")
        assert result is True
        
        # Verify deleted
        value = cache.get("test_key")
        assert value is None
    
    def test_exists(self):
        """Test key existence check."""
        cache = CacheManager(use_redis=False)
        
        # Key doesn't exist
        assert cache.exists("test_key") is False
        
        # Set key
        cache.set("test_key", "value")
        
        # Key exists
        assert cache.exists("test_key") is True
    
    def test_increment(self):
        """Test increment operation."""
        cache = CacheManager(use_redis=False)
        
        # First increment (starts at 1)
        result = cache.increment("counter", 1)
        assert result == 1
        
        # Second increment
        result = cache.increment("counter", 5)
        assert result == 6
    
    def test_decrement(self):
        """Test decrement operation."""
        cache = CacheManager(use_redis=False)
        
        # Set initial value
        cache.set("counter", 10)
        
        # Decrement
        result = cache.decrement("counter", 3)
        assert result == 7
    
    def test_get_many(self):
        """Test getting multiple values."""
        cache = CacheManager(use_redis=False)
        
        # Set multiple values
        cache.set("key1", "value1")
        cache.set("key2", "value2")
        cache.set("key3", "value3")
        
        # Get many
        results = cache.get_many(["key1", "key2", "key3", "key4"])
        
        assert results["key1"] == "value1"
        assert results["key2"] == "value2"
        assert results["key3"] == "value3"
        assert "key4" not in results  # Non-existent key
    
    def test_set_many(self):
        """Test setting multiple values."""
        cache = CacheManager(use_redis=False)
        
        # Set many
        mapping = {
            "key1": "value1",
            "key2": "value2",
            "key3": "value3"
        }
        result = cache.set_many(mapping, ttl=60)
        assert result is True
        
        # Verify
        assert cache.get("key1") == "value1"
        assert cache.get("key2") == "value2"
        assert cache.get("key3") == "value3"
