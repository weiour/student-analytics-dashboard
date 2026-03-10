import sys
import json
import logging

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from typing import Any, Dict

from .analytics import get_group_dashboard, get_student_profile, get_intake_by_department
from .gigachat_client import make_client

from .db import Base, engine
from .models import Report

from .db import SessionLocal
from fastapi import Depends
from sqlalchemy.orm import Session

from .schemas import ReportCreate, ReportOut, ReportUpdate
from .models import Report
from sqlalchemy import desc

from sqlalchemy import desc, or_
from datetime import datetime, timedelta, timezone
from datetime import timezone

from .models_vsoko import VsokoProgram, VsokoQuestion, VsokoOption, VsokoDataset, VsokoAnswer
from .schemas_vsoko import (
    VsokoProgramOut, VsokoQuestionOut, VsokoDatasetCreate, VsokoDatasetOut
)
from .vsoko_seed import seed_vsoko
from sqlalchemy import and_

Base.metadata.create_all(bind=engine)

with SessionLocal() as db:
    seed_vsoko(db)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

logging.basicConfig(level=logging.INFO, stream=sys.stdout, force=True)
log = logging.getLogger("app.ai")

load_dotenv()

app = FastAPI(title="Analytics API (mock) + GigaChat")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AiReportRequest(BaseModel):
    template: str
    group_id: str | None = None
    student_id: str | None = None
    question: str | None = None


class AiChatRequest(BaseModel):
    question: str
    context: Dict[str, Any] | None = None

@app.delete("/api/reports/{report_id}")
def delete_report(report_id: str, db: Session = Depends(get_db)):
    r = db.query(Report).filter(Report.id == report_id).first()
    if not r:
        raise HTTPException(404, "Report not found")
    db.delete(r)
    db.commit()
    return {"ok": True}


@app.post("/api/reports", response_model=ReportOut)
def create_report(payload: ReportCreate, db: Session = Depends(get_db)):
    r = Report(
        title=payload.title,
        template=payload.template,
        context_mode=payload.context_mode,
        context_id=payload.context_id,
        question=payload.question,
        content_md=payload.content_md,
        pinned=payload.pinned,
        tags=",".join(payload.tags or []),
    )
    db.add(r)
    db.commit()
    db.refresh(r)
    return {
        **r.__dict__,
        "created_at": (r.created_at.replace(tzinfo=timezone.utc)).isoformat(),
        "tags": [t for t in (r.tags or "").split(",") if t],
    }

@app.get("/api/reports", response_model=list[ReportOut])
def list_reports(
    search: str = "",
    date_from: str | None = None,  # год-месяц-день
    date_to: str | None = None,
    db: Session = Depends(get_db),
):
    q = db.query(Report)

    if search:
        like = f"%{search}%"
        q = q.filter(or_(Report.title.ilike(like), Report.content_md.ilike(like)))

    if date_from:
        try:
            dt_from = datetime.fromisoformat(date_from).replace(tzinfo=timezone.utc)
            q = q.filter(Report.created_at >= dt_from)
        except Exception:
            raise HTTPException(400, "date_from must be YYYY-MM-DD")

    if date_to:
        try:
            dt_to = datetime.fromisoformat(date_to).replace(tzinfo=timezone.utc) + timedelta(days=1)
            q = q.filter(Report.created_at < dt_to)
        except Exception:
            raise HTTPException(400, "date_to must be YYYY-MM-DD")

    q = q.order_by(desc(Report.pinned), desc(Report.created_at))
    items = q.limit(500).all()

    out = []
    for r in items:
        out.append({
            "id": r.id,
            "created_at": r.created_at.isoformat(),
            "title": r.title,
            "template": r.template,
            "context_mode": r.context_mode,
            "context_id": r.context_id,
            "question": r.question,
            "content_md": r.content_md,
            "pinned": r.pinned,
            "tags": [t for t in (r.tags or "").split(",") if t],
        })
    return out


@app.get("/api/reports/{report_id}", response_model=ReportOut)
def get_report(report_id: str, db: Session = Depends(get_db)):
    r = db.query(Report).filter(Report.id == report_id).first()
    if not r:
        raise HTTPException(404, "Report not found")
    return {
        "id": r.id,
        "created_at": r.created_at.isoformat(),
        "title": r.title,
        "template": r.template,
        "context_mode": r.context_mode,
        "context_id": r.context_id,
        "question": r.question,
        "content_md": r.content_md,
        "pinned": r.pinned,
        "tags": [t for t in (r.tags or "").split(",") if t],
    }

@app.patch("/api/reports/{report_id}", response_model=ReportOut)
def update_report(report_id: str, payload: ReportUpdate, db: Session = Depends(get_db)):
    r = db.query(Report).filter(Report.id == report_id).first()
    if not r:
        raise HTTPException(404, "Report not found")

    if payload.title is not None:
        r.title = payload.title
    if payload.pinned is not None:
        r.pinned = payload.pinned
    if payload.tags is not None:
        r.tags = ",".join(payload.tags)

    db.commit()
    db.refresh(r)
    return {
        "id": r.id,
        "created_at": r.created_at.isoformat(),
        "title": r.title,
        "template": r.template,
        "context_mode": r.context_mode,
        "context_id": r.context_id,
        "question": r.question,
        "content_md": r.content_md,
        "pinned": r.pinned,
        "tags": [t for t in (r.tags or "").split(",") if t],
    }

@app.get("/api/analytics/group/{group_id}")
def api_group(group_id: str):
    try:
        return get_group_dashboard(group_id)
    except StopIteration:
        raise HTTPException(404, "Group not found")


@app.get("/api/analytics/student/{student_id}")
def api_student(student_id: str):
    try:
        return get_student_profile(student_id)
    except StopIteration:
        raise HTTPException(404, "Student not found")


@app.get("/api/analytics/intake")
def api_intake():
    return get_intake_by_department()


def format_report_text(obj: Dict[str, Any]) -> str:
    def as_lines(x):
        if x is None:
            return []
        if isinstance(x, str):
            return [x]
        if isinstance(x, list):
            out = []
            for item in x:
                if isinstance(item, str):
                    out.append(f"- {item}")
                else:
                    out.append(f"- {json.dumps(item, ensure_ascii=False)}")
            return out
        if isinstance(x, dict):
            return [json.dumps(x, ensure_ascii=False, indent=2)]
        return [str(x)]

    lines = []
    lines.append("## Обзор")
    lines += as_lines(obj.get("summary")) or ["- (нет данных)"]

    lines.append("\n## Поведение")
    lines += as_lines(obj.get("patterns")) or ["- (нет данных)"]

    lines.append("\n## Риски")
    lines += as_lines(obj.get("risks")) or ["- (нет данных)"]

    lines.append("\n## Рекомендации")
    lines += as_lines(obj.get("recommendations")) or ["- (нет данных)"]

    return "\n".join(lines).strip()


@app.post("/api/ai/chat")
def api_ai_chat(req: AiChatRequest):
    context_json = json.dumps(req.context or {}, ensure_ascii=False, indent=2)
    prompt = (
        "Ты аналитик учебного процесса. Отвечай по делу и коротко. "
        "Опирайся на переданный контекст. Если контекста не хватает — прямо укажи это.\n\n"
        f"КОНТЕКСТ (JSON):\n{context_json}\n\n"
        f"ВОПРОС ПОЛЬЗОВАТЕЛЯ:\n{req.question}\n"
        "Не используй эмодзи или декоративные символы."
    )

    try:
        with make_client() as client:
            resp = client.chat(prompt)
            raw = (resp.choices[0].message.content or "").strip()
        return {"report": raw or "Пустой ответ от ИИ."}
    except Exception as e:
        raise HTTPException(500, f"GigaChat error: {str(e)}")


@app.post("/api/ai/report")
def api_ai_report(req: AiReportRequest):
    ctx: Dict[str, Any] = {}

    if req.group_id:
        ctx["group_dashboard"] = get_group_dashboard(req.group_id)

    if req.student_id:
        ctx["student_profile"] = get_student_profile(req.student_id)

    if req.template == "department_intake":
        ctx["intake"] = get_intake_by_department()

    if not ctx:
        raise HTTPException(400, "Provide group_id and/or student_id or template=department_intake")

    user_question = req.question or "Сформируй короткий отчёт по данным."

    ctx_json = json.dumps(ctx, ensure_ascii=False, indent=2)

    prompt = (
        "Ты аналитик учебного процесса. У тебя есть структурированные метрики и детектированные паттерны.\n"
        "Составь понятный текстовый отчёт.\n"
        "Структура строго такая:\n"
        "## Обзор (2–5 предложений)\n"
        "## Поведение (паттерны) (маркированный список)\n"
        "## Риски (маркированный список)\n"
        "## Рекомендации (маркированный список)\n"
        "Не выдумывай фактов — опирайся только на переданные данные.\n\n"
        f"ДАННЫЕ (JSON):\n{ctx_json}\n\n"
        f"ВОПРОС ПОЛЬЗОВАТЕЛЯ:\n{user_question}\n"
        "Не используй эмодзи или декоративные символы в тексте!!!"
    )

    log.info("ai_report called template=%s group_id=%s student_id=%s", req.template, req.group_id, req.student_id)
    log.info("ctx keys=%s", list(ctx.keys()))
    log.info("prompt len=%s", len(prompt))

    # 2) вызов GigaChat
    try:
        with make_client() as client:
            resp = client.chat(prompt)
            raw = (resp.choices[0].message.content or "").strip()

        if raw in ("", "{}", "null"):
            return {"report": "ИИ вернул пустой ответ. Попробуйте переформулировать вопрос или повторить запрос."}

        if raw.startswith("{") and raw.endswith("}"):
            try:
                obj = json.loads(raw)
                return {"report": format_report_text(obj)}
            except Exception:
                pass

        return {"report": raw}

    except Exception as e:
        raise HTTPException(500, f"GigaChat error: {str(e)}")


@app.get("/api/vsoko/programs", response_model=list[VsokoProgramOut])
def vsoko_programs(db: Session = Depends(get_db)):
    items = db.query(VsokoProgram).order_by(VsokoProgram.title.asc()).all()
    return [{"id": p.id, "title": p.title} for p in items]

@app.get("/api/vsoko/questions", response_model=list[VsokoQuestionOut])
def vsoko_questions(db: Session = Depends(get_db)):
    qs = db.query(VsokoQuestion).order_by(VsokoQuestion.id.asc()).all()
    out = []
    for q in qs:
        opts = (
            db.query(VsokoOption)
            .filter(VsokoOption.question_id == q.id)
            .order_by(VsokoOption.order_index.asc())
            .all()
        )
        out.append({
            "id": q.id,
            "text": q.text,
            "options": [{"id": o.id, "label": o.label, "order_index": o.order_index} for o in opts]
        })
    return out

@app.get("/api/vsoko/datasets")
def vsoko_get_dataset(program_id: str, year: int = 2026, db: Session = Depends(get_db)):
    ds = db.query(VsokoDataset).filter(and_(VsokoDataset.program_id == program_id, VsokoDataset.year == year)).first()
    if not ds:
        return {"dataset": None, "answers": {}}

    # answers -> {question_id: [{option_id, label, count}]}
    answers = {}
    rows = (
        db.query(VsokoAnswer, VsokoOption)
        .join(VsokoOption, VsokoOption.id == VsokoAnswer.option_id)
        .filter(VsokoAnswer.dataset_id == ds.id)
        .all()
    )
    for a, opt in rows:
        answers.setdefault(a.question_id, []).append({
            "option_id": a.option_id,
            "label": opt.label,
            "count": a.count
        })
    return {"dataset": {"id": ds.id, "program_id": ds.program_id, "year": ds.year}, "answers": answers}

@app.post("/api/vsoko/datasets", response_model=VsokoDatasetOut)
def vsoko_create_or_replace(payload: VsokoDatasetCreate, db: Session = Depends(get_db)):
    ds = db.query(VsokoDataset).filter(and_(VsokoDataset.program_id == payload.program_id, VsokoDataset.year == payload.year)).first()
    if not ds:
        ds = VsokoDataset(program_id=payload.program_id, year=payload.year)
        db.add(ds)
        db.commit()
        db.refresh(ds)
    else:
        # заменяем ответы целиком (на этом этапе редактирования в UI “как бы нет”, но замена удобна)
        db.query(VsokoAnswer).filter(VsokoAnswer.dataset_id == ds.id).delete()
        db.commit()

    # сохранить ответы
    for qid, items in payload.answers.items():
        for it in items:
            db.add(VsokoAnswer(
                dataset_id=ds.id,
                question_id=int(qid),
                option_id=it.option_id,
                count=max(0, int(it.count)),
            ))
    db.commit()
    return {"id": ds.id, "program_id": ds.program_id, "year": ds.year}

@app.get("/api/vsoko/dashboard/{program_id}")
def vsoko_dashboard(program_id: str, year: int = 2026, db: Session = Depends(get_db)):
    ds = db.query(VsokoDataset).filter(and_(VsokoDataset.program_id == program_id, VsokoDataset.year == year)).first()
    if not ds:
        return {"program_id": program_id, "year": year, "has_data": False, "questions": [], "metrics": []}

    # собрать по вопросам
    qs = db.query(VsokoQuestion).order_by(VsokoQuestion.id.asc()).all()
    result_questions = []

    for q in qs:
        opts = db.query(VsokoOption).filter(VsokoOption.question_id == q.id).order_by(VsokoOption.order_index.asc()).all()
        counts_map = {a.option_id: a.count for a in db.query(VsokoAnswer).filter(and_(VsokoAnswer.dataset_id == ds.id, VsokoAnswer.question_id == q.id)).all()}

        counts = []
        total = 0
        for o in opts:
            c = int(counts_map.get(o.id, 0))
            counts.append((o, c))
            total += c

        series = []
        for o, c in counts:
            percent = round((c / total) * 100, 1) if total > 0 else 0.0
            series.append({"name": o.label, "value": c, "percent": percent})

        # метрика среднего балла для шкалы 1..5
        avg = None
        labels = [o.label.strip() for o in opts]
        if labels == ["1","2","3","4","5"] and total > 0:
            s = 0
            for o in opts:
                s += int(o.label) * int(counts_map.get(o.id, 0))
            avg = round(s / total, 2)

        result_questions.append({
            "id": q.id,
            "text": q.text,
            "total": total,
            "avg": avg,
            "series": series
        })

    # пример общих метрик: сколько вопросов заполнено, средний avg по шкальным
    filled = sum(1 for x in result_questions if x["total"] > 0)
    avgs = [x["avg"] for x in result_questions if x["avg"] is not None]
    overall_avg = round(sum(avgs) / len(avgs), 2) if avgs else None

    metrics = [
        {"id": "filled", "label": "Заполнено вопросов", "value": f"{filled}/32"},
    ]
    if overall_avg is not None:
        metrics.append({"id": "avg", "label": "Средний балл (1–5)", "value": overall_avg})

    return {
        "program_id": program_id,
        "year": year,
        "has_data": True,
        "metrics": metrics,
        "questions": result_questions
    }