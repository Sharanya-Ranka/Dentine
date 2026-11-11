import os
import re
from pathlib import Path
from typing import Dict, List, Optional, Set


def organize_migration_ddl(
    migrations_dir: str | Path, tables: List[str]
) -> Dict[str, List[str]]:
    """
    Reads SQL migration files in lexicographical order, extracts DDL statements,
    and groups them by target table.

    :param migrations_dir: Path to directory containing migration .sql files.
    :param tables: List of table names to group statements under.
    :return: Dict mapping table name -> list of DDL statements, plus an 'others' bucket.
    """
    path = Path(migrations_dir)
    if not path.is_dir():
        raise NotADirectoryError(f"Directory not found: {migrations_dir}")

    # Initialize categorized dictionary with empty lists preserving order
    categorized: Dict[str, List[str]] = {tbl: [] for tbl in tables}
    categorized["functions"] = []
    categorized["triggers"] = []
    categorized["others"] = []

    # Map lower-case table names to their original-cased versions
    table_lookup = {tbl.lower(): tbl for tbl in tables}

    # 1. Gather all SQL files in lexicographical order
    sql_files = sorted(
        [f for f in path.iterdir() if f.is_file() and f.suffix.lower() == ".sql"]
    )

    # 2. Collect all raw statements across files
    all_statements: List[str] = []
    for file_path in sql_files:
        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
            content = f.read()
        file_statements = _parse_ddl_statements(content)
        all_statements.extend(file_statements)

    # 3. Segregate statements by matching tables
    for stmt in all_statements:
        matched_function_or_trigger = _resolve_function_or_trigger(stmt)
        matched_table = _resolve_table_for_statement(stmt, table_lookup)
        if matched_function_or_trigger:
            categorized[matched_function_or_trigger].append(stmt)
        elif matched_table:
            categorized[matched_table].append(stmt)
        else:
            categorized["others"].append(stmt)

    return categorized


def _parse_ddl_statements(sql_text: str) -> List[str]:
    """
    Extracts statements starting with CREATE, ALTER, TRUNCATE, GRANT, DROP.
    Handles statements whether or not they end in semicolons.
    """
    # Strip multiline /* ... */ and inline -- comments
    clean_sql = re.sub(r"/\*.*?\*/", "", sql_text, flags=re.DOTALL)
    clean_sql = re.sub(r"--.*?$", "", clean_sql, flags=re.MULTILINE)

    # Regex matching target DDL blocks:
    # Starts with a target keyword at word boundary
    # Continues until either a semicolon or the next DDL keyword / EOF
    target_keywords = r"(?:CREATE|ALTER|TRUNCATE|GRANT|DROP)"
    pattern = re.compile(rf"(?i)(?:\b({target_keywords}\b[\s\S]*?;))")

    statements: List[str] = []
    for match in pattern.finditer(clean_sql):
        stmt = match.group(1).strip()
        if stmt:
            statements.append(stmt)

    return statements


def _resolve_function_or_trigger(stmt):
    # 3. Segregate statements (functions & triggers first, then tables)
    function_pattern = re.compile(
        r"(?i)^\s*(?:CREATE(?:\s+OR\s+REPLACE)?|ALTER|DROP)\s+FUNCTION\b"
    )
    trigger_pattern = re.compile(
        r"(?i)^\s*(?:CREATE(?:\s+OR\s+REPLACE)?|ALTER|DROP)\s+TRIGGER\b"
    )
    function_grant_pattern = re.compile(r"(?i)^\s*GRANT\s+EXECUTE\s+ON\s+FUNCTION\b")
    if function_pattern.match(stmt):
        return "functions"
    elif trigger_pattern.match(stmt):
        return "triggers"
    elif function_grant_pattern.match(stmt):
        return "functions"
    return None


def _resolve_table_for_statement(
    stmt: str, table_lookup: Dict[str, str]
) -> Optional[str]:
    """
    Identifies which table the DDL statement acts on.
    Looks for standard DDL syntax patterns first, then falls back to word boundaries.
    """
    # Normalize whitespaces
    compact_stmt = " ".join(stmt.split())

    # Common DDL target extraction patterns:
    # 1. TABLE/VIEW/INDEX/TRIGGER targets: "ALTER TABLE [ONLY] [schema.]table"
    # 2. Target clauses with "ON": "GRANT ... ON [TABLE] [schema.]table", "CREATE INDEX ... ON [schema.]table"
    syntax_patterns = [
        # CREATE/ALTER/DROP/TRUNCATE TABLE [IF EXISTS/IF NOT EXISTS] [ONLY] [schema.]table_name
        r"(?i)\b(?:CREATE|ALTER|DROP|TRUNCATE)\s+(?:TABLE|MATERIALIZED\s+VIEW|VIEW)\s+(?:IF\s+(?:NOT\s+)?EXISTS\s+)?(?:ONLY\s+)?(?:[`\"']?\w+[`\"']?\.)?[`\"']?([a-zA-Z0-9_]+)[`\"']?",
        # GRANT ... ON [TABLE] [schema.]table_name
        r"(?i)\bON\s+(?:TABLE\s+)?(?:[`\"']?\w+[`\"']?\.)?[`\"']?([a-zA-Z0-9_]+)[`\"']?",
        # CREATE [UNIQUE] INDEX ... ON [schema.]table_name
        r"(?i)\bCREATE\s+(?:UNIQUE\s+)?INDEX\s+.*?\s+ON\s+(?:[`\"']?\w+[`\"']?\.)?[`\"']?([a-zA-Z0-9_]+)[`\"']?",
    ]

    for pat in syntax_patterns:
        m = re.search(pat, compact_stmt)
        if m:
            candidate = m.group(1).lower()
            if candidate in table_lookup:
                return table_lookup[candidate]

    # Fallback: scan for whole-word matches of known table names in the statement
    for tbl_lower, original_tbl in table_lookup.items():
        if re.search(rf"\b{re.escape(tbl_lower)}\b", compact_stmt, flags=re.IGNORECASE):
            return original_tbl

    return None


def main():
    tables_to_track = [
        "app_user",
        "clinic",
        "patient",
        "prescription",
        "employee",
        "visit_note",
        "appointment",
        "treatment_plan",
        "invoice",
        "payment",
        "action_log",
        "follow_up",
        "document",
        "lab",
        "lab_test",
        "reminder",
        "procedure",
        "lab_procedure",
        "user_clinic_association",
        "invitation",
    ]

    results = organize_migration_ddl(
        migrations_dir="supabase/migrations", tables=tables_to_track
    )

    for table, stmts in results.items():
        print(f"\n--- {table.upper()} ({len(stmts)} statements) ---")
        # if table == "others":
        #     for s in stmts:
        #         print(f"> {s[:80]}...")
        # for s in stmts:
        #     print(f"> {s[:80]}...")

    # breakpoint()
    schemas_dir = Path("supabase/schemas")
    schemas_dir.mkdir(parents=True, exist_ok=True)
    for table, stmts in results.items():
        if not stmts:
            continue
        schema_file = schemas_dir / f"{table}.sql"
        with open(schema_file, "w", encoding="utf-8") as f:
            f.write("\n\n".join(stmts))
        print(f"Wrote {len(stmts)} statements to {schema_file}")
    print("hello")


if __name__ == "__main__":
    main()
