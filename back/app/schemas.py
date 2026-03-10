from pydantic import BaseModel
from typing import Optional, List

class ReportCreate(BaseModel):
    title: str
    template: str
    context_mode: str
    context_id: str
    question: Optional[str] = None
    content_md: str
    pinned: bool = False
    tags: List[str] = []

class ReportOut(BaseModel):
    id: str
    created_at: str
    title: str
    template: str
    context_mode: str
    context_id: str
    question: Optional[str]
    content_md: str
    pinned: bool
    tags: List[str]

class ReportUpdate(BaseModel):
    title: Optional[str] = None
    pinned: Optional[bool] = None
    tags: Optional[List[str]] = None
