from typing import Dict, Any, List
from .mock_data import STUDENTS, GROUPS, ATTENDANCE, GRADES, ACHIEVEMENTS

def _attendance_stats(records) -> Dict[str, int]:
    total = len(records)
    absent = sum(1 for r in records if r.status == "absent")
    late = sum(1 for r in records if r.status == "late")
    excused = sum(1 for r in records if r.status == "excused")
    present = total - absent - late - excused
    return {"total": total, "present": present, "late": late, "absent": absent, "excused": excused}

def _avg_grade(records) -> float:
    if not records:
        return 0.0
    return sum(r.value for r in records) / len(records)

def get_group_dashboard(group_id: str) -> Dict[str, Any]:
    group = next(g for g in GROUPS if g.id == group_id)
    students = [s for s in STUDENTS if s.group_id == group_id]
    ids = {s.id for s in students}

    att = [r for r in ATTENDANCE if r.group_id == group_id]
    grd = [g for g in GRADES if g.student_id in ids]

    st = _attendance_stats(att)
    absent_pct = (st["absent"] / st["total"] * 100) if st["total"] else 0
    late_pct = (st["late"] / st["total"] * 100) if st["total"] else 0

    abs_by_student = []
    for s in students:
        recs = [r for r in att if r.student_id == s.id]
        abs_by_student.append({"student_id": s.id, "name": s.full_name, "absences": sum(1 for r in recs if r.status == "absent")})
    abs_by_student.sort(key=lambda x: x["absences"], reverse=True)

    return {
        "group": {"id": group.id, "name": group.name, "department": group.department, "course": group.course},
        "students_count": len(students),
        "attendance": {"stats": st, "absent_pct": absent_pct, "late_pct": late_pct},
        "grades": {"avg": _avg_grade(grd)},
        "absences_by_student": abs_by_student[:10],
    }

def get_student_profile(student_id: str) -> Dict[str, Any]:
    st = next(s for s in STUDENTS if s.id == student_id)
    group = next(g for g in GROUPS if g.id == st.group_id)

    att = [r for r in ATTENDANCE if r.student_id == student_id]
    grd = [g for g in GRADES if g.student_id == student_id]
    ach = [a for a in ACHIEVEMENTS if a.student_id == student_id]

    att_stats = _attendance_stats(att)
    absent_pct = (att_stats["absent"] / att_stats["total"] * 100) if att_stats["total"] else 0
    late_pct = (att_stats["late"] / att_stats["total"] * 100) if att_stats["total"] else 0
    avg = _avg_grade(grd)

    # Демо-паттерны
    patterns: List[Dict[str, str]] = []

    # регулярность “вторник 1 пара”
    import datetime as dt
    tuesday_first = [r for r in att if dt.date.fromisoformat(r.date).weekday() == 1 and r.pair == 1]
    if len(tuesday_first) >= 6:
        share_abs = (sum(1 for r in tuesday_first if r.status == "absent") / len(tuesday_first))
        if share_abs >= 0.45:
            patterns.append({"level": "warn", "title": "Регулярные пропуски: вторник, 1 пара", "detail": "Высокая доля пропусков на конкретном слоте."})

    # падение оценок (вторая половина ниже первой)
    grd_sorted = sorted(grd, key=lambda x: x.date)
    if len(grd_sorted) >= 10:
        mid = len(grd_sorted) // 2
        a = _avg_grade(grd_sorted[:mid])
        b = _avg_grade(grd_sorted[mid:])
        if b - a < -6:
            patterns.append({"level": "warn", "title": "Снижение среднего балла", "detail": "Во второй половине периода результаты ниже."})

    if not patterns:
        patterns.append({"level": "ok", "title": "Критичных паттернов не найдено", "detail": "По демо-детекторам явных аномалий нет."})

    return {
        "student": {"id": st.id, "full_name": st.full_name, "department": st.department, "year_of_admission": st.year_of_admission},
        "group": {"id": group.id, "name": group.name, "department": group.department, "course": group.course},
        "attendance": {"stats": att_stats, "absent_pct": absent_pct, "late_pct": late_pct},
        "grades": {"avg": avg},
        "achievements": [{"date": a.date, "title": a.title, "level": a.level} for a in ach],
        "patterns": patterns,
    }

def get_intake_by_department() -> Dict[str, Any]:
    # мок: считаем по year_of_admission
    dep = {}
    for s in STUDENTS:
        dep.setdefault(s.department, {})
        dep[s.department][s.year_of_admission] = dep[s.department].get(s.year_of_admission, 0) + 1
    return {"intake": dep}
