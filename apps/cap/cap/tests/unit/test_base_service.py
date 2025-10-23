"""
Project: QuietWire CAP (Civic AI Canon Platform) V 1.0.0
Website: https://quietwire.ai
Authors: Ashraf Saleh Alhajj; Raasid (AI Companion)
SPDX-License-Identifier: Apache-2.0
SPDX-FileCopyrightText: 2025 QuietWire
SPDX-FileContributor: Ashraf Saleh Alhajj
SPDX-FileContributor: Raasid (AI Companion)

Test module: test_base_service.py
"""
import pytest
from unittest.mock import Mock, patch, MagicMock
from cap.services.base_service import BaseService
"""Unit Tests for Base Service"""



class TestBaseService:
    """Test suite for BaseService."""
    
    def test_initialization(self):
        """Test service initialization."""
        service = BaseService()
        
        assert service.logger is not None
        assert service.metrics is not None
        assert service.cache is not None
    
    def test_log_operation(self):
        """Test operation logging."""
        service = BaseService()
        
        with patch.object(service.logger, 'info') as mock_log:
            service.log_operation("test_operation", user="testuser")
            mock_log.assert_called_once()
    
    def test_record_metric(self):
        """Test metric recording."""
        service = BaseService()
        
        with patch.object(service.metrics, 'record') as mock_record:
            service.record_metric("test.metric", 1.0, tag="value")
            mock_record.assert_called_once_with("test.metric", 1.0, tag="value")
    
    def test_get_cached(self):
        """Test getting cached value."""
        service = BaseService()
        
        # Mock cache
        service.cache.get = Mock(return_value="cached_value")
        
        result = service.get_cached("test_key")
        assert result == "cached_value"
        service.cache.get.assert_called_once_with("test_key")
    
    def test_set_cached(self):
        """Test setting cached value."""
        service = BaseService()
        
        # Mock cache
        service.cache.set = Mock(return_value=True)
        
        result = service.set_cached("test_key", "test_value", ttl=300)
        assert result is True
        service.cache.set.assert_called_once_with("test_key", "test_value", ttl=300)
    
    def test_execute_with_metrics_success(self):
        """Test execute_with_metrics on success."""
        service = BaseService()
        
        # Mock function
        test_func = Mock(return_value="success")
        
        with patch.object(service, 'record_metric') as mock_metric:
            result = service.execute_with_metrics("test_op", test_func, "arg1")
            
            assert result == "success"
            test_func.assert_called_once_with("arg1")
            
            # Should record duration and count with success status
            assert mock_metric.call_count == 2
    
    def test_execute_with_metrics_error(self):
        """Test execute_with_metrics on error."""
        service = BaseService()
        
        # Mock function that raises exception
        test_func = Mock(side_effect=ValueError("Test error"))
        
        with patch.object(service, 'record_metric') as mock_metric:
            with pytest.raises(ValueError):
                service.execute_with_metrics("test_op", test_func)
            
            # Should record duration and count with error status
            assert mock_metric.call_count == 2
