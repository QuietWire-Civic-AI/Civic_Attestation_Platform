# CAP Platform Translation Guide

## Overview
This directory contains translation files for the Civic AI Canon Platform (CAP) supporting 4 languages:
- **English (en)** - Primary/Master language
- **Arabic (ar)** - العربية
- **French (fr)** - Français
- **Spanish (es)** - Español

## File Structure
```
translations/
├── en.csv          # Master reference (English)
├── ar.csv          # Arabic translations
├── fr.csv          # French translations
├── es.csv          # Spanish translations
├── glossary.csv    # Technical terms glossary
└── README.md       # This file
```

## Translation File Format

Each CSV file has 3 columns:
```csv
"Source Text","Translated Text","Context"
```

### Example:
```csv
"User Management","User Management",""
"Total Users","Total Users","KPI Card Title"
"Create New Policy","Create New Policy","Button Label"
"Email is required","Email is required","Validation Error"
```

## Translation Guidelines

### DO's ✅
1. **Maintain Consistency**: Use the same translation for repeated terms
2. **Respect Context**: Different contexts may require different translations
3. **Keep Placeholders**: Preserve `{0}`, `{1}`, etc. in their original positions
4. **Follow Grammar**: Use proper grammar and spelling for the target language
5. **Consider Length**: Keep translations similar in length to avoid UI breaking
6. **Use Glossary**: Refer to `glossary.csv` for technical terms

### DON'Ts ❌
1. **Don't Translate**:
   - DocType names (Policy, Evidence, Tenant, etc.)
   - Field names in code (`name`, `email`, `status`, etc.)
   - HTML tags (`<br>`, `<b>`, etc.)
   - Variables and placeholders (`{0}`, `{variable_name}`)
   - URLs and file paths
   - Brand names (CAP, Frappe)

2. **Don't Change**:
   - Sentence structure dramatically (maintain meaning)
   - Technical terms without consulting glossary
   - Capitalization patterns arbitrarily

### Special Cases

#### 1. Placeholders
```csv
"User {0} has been created","[Your Translation] {0} [Rest of translation]","Success Message"
```
**Example**:
- ✅ Arabic: "تم إنشاء المستخدم {0}"
- ❌ Arabic: "تم إنشاء المستخدم" (missing {0})

#### 2. HTML Content
```csv
"Click <b>Save</b> to continue","[Translation] <b>[Save Translation]</b> [Rest]","Help Text"
```

#### 3. Plural Forms
Some languages have complex plural rules. Consult the glossary for guidance.

## Technical Terms Glossary

### Core Platform Terms
| English | Arabic | French | Spanish | Context |
|---------|--------|--------|---------|--------|
| Policy | سياسة | Politique | Política | Compliance policy document |
| Compliance | امتثال | Conformité | Cumplimiento | Regulatory compliance |
| Evidence | دليل | Preuve | Evidencia | Legal evidence |
| Violation | مخالفة | Violation | Violación | Policy violation |
| Tenant | مستأجر | Locataire | Inquilino | Multi-tenant organization |
| Audit Log | سجل التدقيق | Journal d'audit | Registro de auditoría | Activity tracking |
| Session | جلسة | Session | Sesión | Chat or user session |
| Dashboard | لوحة التحكم | Tableau de bord | Panel de control | Main control panel |
| User Profile | ملف المستخدم | Profil utilisateur | Perfil de usuario | User settings |
| Permission | صلاحية | Permission | Permiso | Access rights |

### UI Elements
| English | Arabic | French | Spanish | Context |
|---------|--------|--------|---------|--------|
| Save | حفظ | Enregistrer | Guardar | Button |
| Cancel | إلغاء | Annuler | Cancelar | Button |
| Delete | حذف | Supprimer | Eliminar | Button |
| Edit | تحرير | Modifier | Editar | Button |
| Search | بحث | Rechercher | Buscar | Input placeholder |
| Filter | تصفية | Filtrer | Filtrar | Action |
| Export | تصدير | Exporter | Exportar | Action |
| Import | استيراد | Importer | Importar | Action |
| Refresh | تحديث | Actualiser | Actualizar | Action |
| Loading | جاري التحميل | Chargement | Cargando | Status |

### Status & States
| English | Arabic | French | Spanish | Context |
|---------|--------|--------|---------|--------|
| Active | نشط | Actif | Activo | User/System status |
| Inactive | غير نشط | Inactif | Inactivo | User/System status |
| Pending | قيد المراجعة | En attente | Pendiente | Approval status |
| Approved | موافق عليه | Approuvé | Aprobado | Approval status |
| Rejected | مرفوض | Rejeté | Rechazado | Approval status |
| Draft | مسودة | Brouillon | Borrador | Document status |
| Published | منشور | Publié | Publicado | Document status |
| Archived | مؤرشف | Archivé | Archivado | Document status |

## Translation Process

### For Professional Translators

1. **Receive Package**:
   - `en.csv` (master reference)
   - This README
   - `glossary.csv`
   - Screenshots (if provided)

2. **Setup**:
   - Open your assigned language CSV file
   - Keep `en.csv` as reference
   - Have `glossary.csv` open for technical terms

3. **Translate**:
   - Go through each row in the CSV
   - Read the "Source Text" and "Context"
   - Provide accurate translation in "Translated Text" column
   - Maintain the CSV format (keep quotes and commas)

4. **Review**:
   - Check for consistency
   - Verify placeholders are preserved
   - Ensure technical terms match glossary
   - Proofread for spelling and grammar

5. **Deliver**:
   - Return the completed CSV file
   - Include a summary of any questions or issues

### Quality Checklist

- [ ] All rows have translations (no empty "Translated Text")
- [ ] Placeholders ({0}, {1}) are preserved in correct positions
- [ ] HTML tags are preserved and correctly positioned
- [ ] Technical terms match the glossary
- [ ] Translations are contextually appropriate
- [ ] No spelling or grammar errors
- [ ] CSV format is valid (proper quotes and escaping)
- [ ] Consistent terminology throughout

## Testing Translations

After translation, the development team will:

1. Import CSV files into the system
2. Build the translation cache
3. Test UI in each language
4. Verify RTL (Right-to-Left) for Arabic
5. Check text overflow and truncation
6. Validate placeholders work correctly

## Contact

For questions or clarifications:
- **Technical Lead**: development@cap.ai
- **Project Manager**: pm@cap.ai

## Version History

- **v1.0.0** (2025-10-23): Initial translation setup
  - 4 languages: English, Arabic, French, Spanish
  - ~2000 strings to translate
  - Focus: UI elements, messages, labels

---

**Note**: This is a living document. Translation requirements may be updated as the platform evolves.