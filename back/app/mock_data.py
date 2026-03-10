from dataclasses import dataclass
from typing import Literal, List

AttendanceStatus = Literal["present", "late", "absent", "excused"]

@dataclass(frozen=True)
class Student:
    id: str
    full_name: str
    group_id: str
    department: str
    year_of_admission: int

@dataclass(frozen=True)
class Group:
    id: str
    name: str
    department: str
    course: int

@dataclass(frozen=True)
class AttendanceRecord:
    date: str  # YYYY-MM-DD
    student_id: str
    group_id: str
    subject: str
    pair: int
    status: AttendanceStatus

@dataclass(frozen=True)
class GradeRecord:
    date: str
    student_id: str
    subject: str
    value: int  # 0..100
    kind: Literal["quiz", "test", "exam"]

@dataclass(frozen=True)
class Achievement:
    date: str
    student_id: str
    title: str
    level: Literal["institute", "city", "regional", "national"]


GROUPS: List[Group] = [
    Group(id="g1", name="ИС-21", department="Кафедра ИТ", course=3),
    Group(id="g2", name="ДИЗ-11", department="Кафедра Дизайна", course=1),
    Group(id="g3", name="ЭК-31", department="Кафедра Экономики", course=4),
]

STUDENTS: List[Student] = [
    Student(id="s1", full_name="Иванов Артём", group_id="g1", department="Кафедра ИТ", year_of_admission=2023),
    Student(id="s2", full_name="Петрова Мария", group_id="g1", department="Кафедра ИТ", year_of_admission=2023),
    Student(id="s3", full_name="Сидоров Данил", group_id="g1", department="Кафедра ИТ", year_of_admission=2023),
    Student(id="s4", full_name="Ким Алина", group_id="g2", department="Кафедра Дизайна", year_of_admission=2025),
    Student(id="s5", full_name="Смирнов Никита", group_id="g2", department="Кафедра Дизайна", year_of_admission=2025),
    Student(id="s6", full_name="Орлова Софья", group_id="g3", department="Кафедра Экономики", year_of_admission=2022),
]

ACHIEVEMENTS: List[Achievement] = [
    Achievement(date="2025-10-12", student_id="s2", title="Хакатон (призовое место)", level="city"),
    Achievement(date="2025-11-03", student_id="s4", title="Конкурс плакатов (победа)", level="regional"),
    Achievement(date="2025-12-15", student_id="s1", title="Проект на конференции", level="institute"),
]

SUBJECTS = {
    "Кафедра ИТ": ["Базы данных", "Сети", "Алгоритмы"],
    "Кафедра Дизайна": ["Композиция", "Типографика", "История искусства"],
    "Кафедра Экономики": ["Микроэкономика", "Финансы", "Статистика"],
}

def _is_tuesday(date_str: str) -> bool:
    # 2025-11-04 — вторник; дальше считаем по дню недели грубо через мод
    # Для демо достаточно (без внешних зависимостей)
    import datetime as dt
    y, m, d = map(int, date_str.split("-"))
    return dt.date(y, m, d).weekday() == 1  # Monday=0, Tuesday=1

def build_mock_attendance() -> List[AttendanceRecord]:
    import datetime as dt
    start = dt.date(2025, 11, 4)  # вторник
    weeks = 8
    dates = []
    for w in range(weeks):
        d1 = start + dt.timedelta(days=w * 7)      # вторник
        d2 = start + dt.timedelta(days=w * 7 + 2)  # четверг
        dates += [d1.isoformat(), d2.isoformat()]

    out: List[AttendanceRecord] = []
    for st in STUDENTS:
        group = next(g for g in GROUPS if g.id == st.group_id)
        subs = SUBJECTS[group.department]

        for date in dates:
            for pair in (1, 2):
                subject = subs[(pair + ord(date[-1])) % len(subs)]

                # Вшитые паттерны:
                pattern_absent = (st.id == "s3" and _is_tuesday(date) and pair == 1)
                pattern_late = (st.id == "s5" and pair == 2)

                seed = (ord(st.id[1]) + ord(date[-1]) + pair * 17) % 100
                status: AttendanceStatus = "present"
                if pattern_absent:
                    status = "absent"
                elif pattern_late and seed % 3 != 0:
                    status = "late"
                elif seed < 6:
                    status = "absent"
                elif seed < 10:
                    status = "excused"
                elif seed < 18:
                    status = "late"

                out.append(AttendanceRecord(
                    date=date, student_id=st.id, group_id=st.group_id,
                    subject=subject, pair=pair, status=status
                ))
    return out

def build_mock_grades() -> List[GradeRecord]:
    import datetime as dt
    start = dt.date(2025, 11, 4)
    weeks = 8
    out: List[GradeRecord] = []

    for st in STUDENTS:
        group = next(g for g in GROUPS if g.id == st.group_id)
        subs = SUBJECTS[group.department]

        for w in range(weeks):
            date = (start + dt.timedelta(days=w * 7 + 1)).isoformat()

            for subject in subs:
                base = 72 + ((ord(st.id[1]) + len(subject) * 3) % 15)
                drop = 18 if (st.id == "s3" and w >= 4) else 0
                noise = ((w * 13 + ord(subject[0])) % 9) - 4
                val = max(35, min(98, base - drop + noise))
                out.append(GradeRecord(date=date, student_id=st.id, subject=subject, value=int(val),
                                      kind=("test" if w % 4 == 3 else "quiz")))
    return out


ATTENDANCE = build_mock_attendance()
GRADES = build_mock_grades()
