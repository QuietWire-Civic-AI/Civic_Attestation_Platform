"""
Project: QuietWire CAP (Civic AI Canon Platform) V 1.0.0
Website: https://quietwire.ai
Authors: Ashraf Saleh Alhajj; Raasid (AI Companion)
SPDX-License-Identifier: Apache-2.0
SPDX-FileCopyrightText: 2025 QuietWire
SPDX-FileContributor: Ashraf Saleh Alhajj
SPDX-FileContributor: Raasid (AI Companion)

CAP module: base_repository.py
"""
import frappe
from typing import Any, Dict, List, Optional, Type
from frappe.model.document import Document
"""Base Repository Class

Provides common data access patterns for all repositories.
"""



class BaseRepository:
    """Base repository for data access operations.
    
    Provides common CRUD operations and query methods.
    """
    
    def __init__(self, doctype: str):
        """Initialize repository.
        
        Args:
            doctype: Frappe DocType name
        """
        self.doctype = doctype
    
    def find_by_name(self, name: str) -> Optional[Document]:
        """Find document by name.
        
        Args:
            name: Document name
            
        Returns:
            Document or None
        """
        if not frappe.db.exists(self.doctype, name):
            return None
        
        return frappe.get_doc(self.doctype, name)
    
    def find_all(self, filters: Optional[Dict] = None, fields: Optional[List[str]] = None,
                 limit: Optional[int] = None, order_by: Optional[str] = None) -> List[Dict]:
        """Find all documents matching filters.
        
        Args:
            filters: Filter dictionary
            fields: Fields to return
            limit: Maximum number of results
            order_by: Sort order
            
        Returns:
            List of documents
        """
        return frappe.get_all(
            self.doctype,
            filters=filters or {},
            fields=fields or ["*"],
            limit=limit,
            order_by=order_by
        )
    
    def find_one(self, filters: Dict, fields: Optional[List[str]] = None) -> Optional[Dict]:
        """Find one document matching filters.
        
        Args:
            filters: Filter dictionary
            fields: Fields to return
            
        Returns:
            Document dict or None
        """
        results = self.find_all(filters=filters, fields=fields, limit=1)
        return results[0] if results else None
    
    def create(self, data: Dict) -> Document:
        """Create new document.
        
        Args:
            data: Document data
            
        Returns:
            Created document
        """
        doc = frappe.get_doc({
            "doctype": self.doctype,
            **data
        })
        doc.insert()
        return doc
    
    def update(self, name: str, data: Dict) -> Document:
        """Update document.
        
        Args:
            name: Document name
            data: Fields to update
            
        Returns:
            Updated document
        """
        doc = frappe.get_doc(self.doctype, name)
        
        for key, value in data.items():
            if hasattr(doc, key):
                setattr(doc, key, value)
        
        doc.save()
        return doc
    
    def delete(self, name: str) -> bool:
        """Delete document.
        
        Args:
            name: Document name
            
        Returns:
            True if successful
        """
        frappe.delete_doc(self.doctype, name)
        return True
    
    def exists(self, name: str) -> bool:
        """Check if document exists.
        
        Args:
            name: Document name
            
        Returns:
            True if exists
        """
        return frappe.db.exists(self.doctype, name)
    
    def count(self, filters: Optional[Dict] = None) -> int:
        """Count documents matching filters.
        
        Args:
            filters: Filter dictionary
            
        Returns:
            Count of documents
        """
        return frappe.db.count(self.doctype, filters or {})
    
    def get_value(self, name: str, field: str) -> Any:
        """Get single field value.
        
        Args:
            name: Document name
            field: Field name
            
        Returns:
            Field value
        """
        return frappe.db.get_value(self.doctype, name, field)
    
    def set_value(self, name: str, field: str, value: Any) -> bool:
        """Set single field value.
        
        Args:
            name: Document name
            field: Field name
            value: New value
            
        Returns:
            True if successful
        """
        frappe.db.set_value(self.doctype, name, field, value)
        return True
    
    def bulk_insert(self, data_list: List[Dict]) -> List[Document]:
        """Bulk insert documents.
        
        Args:
            data_list: List of document data
            
        Returns:
            List of created documents
        """
        docs = []
        for data in data_list:
            doc = self.create(data)
            docs.append(doc)
        
        return docs
