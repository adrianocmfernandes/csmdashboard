# SCOUTASTIC Dashboard — Data Upload Template (Dev Handoff)

Use **2 CSV files per reporting period**:
1. `club_data.csv` (club-level aggregates)
2. `user_data.csv` (user-level detail)

## 1) `club_data.csv` (required)
One row per **club + upload_date** (30-day window aggregate).

### Required columns
| Column | Type | What to fill |
|---|---|---|
| upload_date | `YYYY-MM-DD` | End date of the 30-day reporting window. |
| club_name | string | Exact club name (must be consistent across files and periods). |
| contract_seats | integer | Licensed seats for the club in that period. |
| active_users | integer | Unique users active at least once in the 30-day window. |
| reports_created | integer | Total reports created in the 30-day window. |
| shortlist_edits | integer | Total shortlist edit actions in the 30-day window. |
| searches_performed | integer | Total searches in the 30-day window. |
| shortlists_usage | integer | Interactions with Shortlists feature. |
| scouting_status_usage | integer | Interactions with Scouting Status feature. |
| appointments_created | integer | Appointments created in the 30-day window. |
| area_search_visits | integer | Area Search page visits. |
| squad_planner_visits | integer | Squad Planner page visits. |
| club2club_visits | integer | Club2Club page visits. |
| speech2report_count | integer | Count of Speech2Report usage. |
| lineup_detector_count | integer | Count of Lineup Detector usage. |
| push_alerts_sent | integer | Push notifications sent. |
| mail_alerts_sent | integer | Email alerts sent. |
| custom_dashboards_count | integer | Custom dashboards created/updated. |
| players_created | integer | Players created in data/editor layer. |
| teams_created | integer | Teams created in data/editor layer. |
| matches_created | integer | Matches created in data/editor layer. |
| data_conflicts_current | integer | Open/unresolved conflicts at period end. |
| data_conflicts_resolved | integer | Conflicts resolved during period. |

---

## 2) `user_data.csv` (required)
One row per **user + club + upload_date**.

### Required columns
| Column | Type | What to fill |
|---|---|---|
| upload_date | `YYYY-MM-DD` | Same period date used in `club_data.csv`. |
| club_name | string | Must exactly match `club_data.csv` club_name. |
| user_id | string | Stable unique user identifier. |
| user_name | string | Display name. |
| role | string | Role list, `;`-separated for multi-role (example: `Scout;Admin`). |
| last_login_date | `YYYY-MM-DD` | User’s most recent login date. |
| logins_30d | integer | User login count in the 30-day window. |
| reports_created_30d | integer | Reports created by user in the window. |
| searches_30d | integer | Searches performed by user in the window. |

### Role rules used by dashboard
- Allowed roles: `Admin`, `Scout`, `Squad Manager`, `Squad Planner`, `Club2Club`.
- Multi-role supported via `;` separator.
- **Scout is mandatory** for every user row (missing Scout triggers warning).

---

## KPI mapping used by the dashboard
- **KPI cards + health status**: `active_users`, `reports_created`, `shortlist_edits`, `searches_performed`
- **Benchmark bars**: `shortlists_usage`, `scouting_status_usage`, `appointments_created`, `area_search_visits`, `squad_planner_visits`, `club2club_visits`
- **Feature counters**: `speech2report_count`, `lineup_detector_count`, `push_alerts_sent`, `mail_alerts_sent`, `custom_dashboards_count`
- **Editor progress bars**: `players_created`, `teams_created`, `matches_created`, `data_conflicts_current`, `data_conflicts_resolved`
- **Inactive users table (14+ days)**: `last_login_date` vs latest `upload_date`
- **Role matrix / persona counts**: `role`

---

## Import checklist (important)
- Use UTF-8 CSV with header row.
- Keep dates in `YYYY-MM-DD` format.
- Keep `club_name` values identical between both files.
- Uploads are **append-only**: each new file should contain new period rows (do not overwrite history).
- Numeric columns must contain integers (no `%`, no commas in numbers).
