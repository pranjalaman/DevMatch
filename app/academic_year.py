from datetime import date


def session_year(on: date) -> int:
    if on.month >= 8:
        return on.year
    return on.year - 1


def joining_window(on: date) -> tuple[int, int]:
    return on.year - 5, on.year


def joined_year_in_window(joined_year: int, on: date) -> bool:
    start, end = joining_window(on)
    return start <= joined_year <= end


def standing_label(joined_year: int, on: date) -> str:
    study_year = session_year(on) - joined_year + 1
    if study_year < 1:
        return "Incoming"
    if study_year > 5:
        return "Finished"
    return f"Year {study_year}"


def academic_facts(joined_year: int, on: date) -> dict:
    start, end = joining_window(on)
    return {
        "session_year": session_year(on),
        "standing": standing_label(joined_year, on),
        "window_start": start,
        "window_end": end,
    }


def with_standing(user: dict, on: date | None = None) -> dict:
    user["standing"] = standing_label(user["joined_year"], on or date.today())
    return user


def owner_view(owner_id: int, name: str, joined_year: int, on: date) -> dict:
    return {
        "id": owner_id,
        "name": name,
        "standing": standing_label(joined_year, on),
    }
