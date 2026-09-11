from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class ComplaintData(BaseModel):
    model_config = ConfigDict(extra='forbid', str_max_length=6000)

    complaint_source: str = ''
    customer_name: str = ''
    customer_contact: str = ''
    product_name: str = ''
    product_type: Literal['', 'API', 'FDF'] = ''
    product_strength: str = ''
    batch_number: str = ''
    manufacturing_date: str = ''
    expiry_date: str = ''
    quantity_affected: str = ''
    complaint_type: str = ''
    complaint_date: str = ''
    site_block: str = ''
    impacted_materials: str = ''
    description: str = ''


class Extraction(BaseModel):
    model_config = ConfigDict(extra='forbid')

    changes: dict[str, str] = Field(default_factory=dict)
    clear_fields: list[str] = Field(default_factory=list)
    reply: str = Field(min_length=1, max_length=2000)

    @model_validator(mode='after')
    def check_fields(self):
        allowed = set(ComplaintData.model_fields)
        if not set(self.changes).issubset(allowed):
            raise ValueError('Unknown complaint field')
        if not set(self.clear_fields).issubset(allowed):
            raise ValueError('Unknown field to clear')
        ComplaintData(**self.changes)
        return self


class RiskAssessment(BaseModel):
    model_config = ConfigDict(extra='forbid')

    severity: Literal['Minor', 'Major', 'Critical', 'Needs review']
    priority: Literal['Low', 'Medium', 'High', 'Urgent']
    summary: str = Field(min_length=1, max_length=1500)
    rationale: str = Field(min_length=1, max_length=1500)
    next_action: str = Field(min_length=1, max_length=1500)
    potential_root_causes: list[str] = Field(max_length=4)
    capa_recommendations: list[str] = Field(max_length=4)


class ChatRequest(BaseModel):
    complaint_id: str | None = None
    version: int | None = None
    message: str = Field(min_length=1, max_length=24000)

    @field_validator('message')
    @classmethod
    def check_message(cls, value):
        if not value.strip():
            raise ValueError('Enter complaint details or a correction.')
        return value.strip()


class SaveRequest(BaseModel):
    version: int = Field(ge=1)
