from pydantic import BaseModel
from typing import List, Dict

class VsokoProgramOut(BaseModel):
    id: str
    title: str

class VsokoOptionOut(BaseModel):
    id: str
    label: str
    order_index: int

class VsokoQuestionOut(BaseModel):
    id: int
    text: str
    options: List[VsokoOptionOut]

class VsokoDatasetAnswerIn(BaseModel):
    option_id: str
    count: int

class VsokoDatasetCreate(BaseModel):
    program_id: str
    year: int = 2026
    # key = question_id (1..32), value = list of option counts
    answers: Dict[int, List[VsokoDatasetAnswerIn]]

class VsokoDatasetOut(BaseModel):
    id: str
    program_id: str
    year: int