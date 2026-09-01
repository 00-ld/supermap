"""Audit source files for avoidable duplicate or meaningless definitions.

This script is intentionally conservative and read-only. It does not try to
replace language-specific linters. Instead, it enforces a small set of project
rules that are cheap to verify before code is pushed:

- no duplicate top-level declarations in the same source file;
- no obviously meaningless top-level symbol names;
- Python source module names in maintained code folders use snake_case.
- project API/security contracts that previously regressed stay closed.
- CI keeps lint and strict typecheck as hard frontend gates.
"""

from __future__ import annotations

import re
import subprocess
import sys
from collections import Counter
from dataclasses import dataclass
from pathlib import Path


SOURCE_PREFIXES = (
    "algorithm/",
    "backend/src/main/java/",
    "frontend/src/",
    "scripts/",
    "tests/",
    "tools/",
)

SOURCE_SUFFIXES = (".py", ".ts", ".js", ".vue", ".java")

PYTHON_PREFIXES = ("algorithm/", "scripts/", "tests/", "tools/")

MEANINGLESS_NAMES = {
    "aaa",
    "bbb",
    "ccc",
    "demo",
    "foo",
    "bar",
    "baz",
    "temp",
    "tmp",
    "xxx",
    "yyy",
    "zzz",
}

SNAKE_CASE_MODULE = re.compile(r"^[a-z][a-z0-9_]*\.py$")
STANDARD_PYTHON_MODULES = {"__init__.py"}
VUE_SCRIPT_BLOCK = re.compile(
    r"<script\b[^>]*>(?P<body>.*?)</script>",
    re.IGNORECASE | re.DOTALL,
)
PACKAGE_BOUNDARY_CLEAN_FILES = {
    "algorithm/deep_learning/gas_surrogate.py",
    "algorithm/deep_learning/validate_btex_real_data.py",
    "algorithm/diffusion/conditioned_advection.py",
    "algorithm/diffusion/phase1_diffusion.py",
    "algorithm/diffusion/test_gaussian_validation.py",
    "algorithm/diffusion/test_input_contract.py",
    "algorithm/diffusion/test_physical_invariants.py",
    "algorithm/diffusion/test_real_prairie_grass.py",
    "algorithm/planning/astar_path_planner.py",
    "algorithm/planning/factory_layout.py",
    "algorithm/planning/gas_catalog.py",
    "algorithm/planning/gas_diffusion_astar.py",
    "algorithm/planning/integrated_escape_system.py",
    "algorithm/planning/legacy_diffusion_model.py",
    "algorithm/inversion/forward_model.py",
    "algorithm/inversion/grid_search.py",
    "algorithm/inversion/plume_losses.py",
    "algorithm/inversion/test_candidate_validation.py",
    "algorithm/inversion/test_observation_signal.py",
    "algorithm/inversion/test_wind_timing_constraints.py",
    "algorithm/tests/test_analytic_inversion.py",
    "algorithm/tests/test_api_server_http_semantics.py",
    "algorithm/tests/test_path_hazard_avoidance.py",
    "algorithm/planning/test_dstar_lite.py",
    "algorithm/inversion/test_eki_inversion.py",
    "algorithm/inversion/validate_particle_filter.py",
}

FORBIDDEN_ALGORITHM_ROOT_AUXILIARY_FILES = {
    "algorithm/test_api_server_http_semantics.py",
    "algorithm/test_path_hazard_avoidance.py",
    "algorithm/test_analytic_inversion.py",
    "algorithm/benchmark_replan_10k.py",
}

DECLARATION_PATTERNS = {
    ".py": re.compile(r"^(?:def|class)\s+([A-Za-z_][A-Za-z0-9_]*)\b", re.MULTILINE),
    ".ts": re.compile(
        r"^(?:export\s+)?(?:const|let|var|function|class|interface|type)\s+([A-Za-z_$][A-Za-z0-9_$]*)\b",
        re.MULTILINE,
    ),
    ".js": re.compile(
        r"^(?:export\s+)?(?:const|let|var|function|class)\s+([A-Za-z_$][A-Za-z0-9_$]*)\b",
        re.MULTILINE,
    ),
    ".vue": re.compile(
        r"^(?:const|let|var|function|class|interface|type)\s+([A-Za-z_$][A-Za-z0-9_$]*)\b",
        re.MULTILINE,
    ),
    ".java": re.compile(
        r"^(?:public\s+)?(?:abstract\s+)?(?:final\s+)?(?:class|interface|enum)\s+([A-Za-z_][A-Za-z0-9_]*)\b",
        re.MULTILINE,
    ),
}


@dataclass(frozen=True)
class Finding:
    path: str
    rule: str
    detail: str


def tracked_files(repo_root: Path) -> list[str]:
    result = subprocess.run(
        ["git", "ls-files", "-z"],
        cwd=repo_root,
        check=True,
        capture_output=True,
    )
    paths = result.stdout.decode("utf-8", errors="replace").split("\0")
    return [path.replace("\\", "/") for path in paths if path]


def is_source_file(path: str) -> bool:
    return path.startswith(SOURCE_PREFIXES) and path.endswith(SOURCE_SUFFIXES)


def source_text(repo_root: Path, path: str) -> str:
    text = (repo_root / path).read_text(encoding="utf-8", errors="replace")
    if path.endswith(".vue"):
        blocks = [match.group("body") for match in VUE_SCRIPT_BLOCK.finditer(text)]
        return "\n".join(blocks)
    return text


def declaration_names(path: str, text: str) -> list[str]:
    suffix = Path(path).suffix
    pattern = DECLARATION_PATTERNS.get(suffix)
    if pattern is None:
        return []
    return [match.group(1) for match in pattern.finditer(text)]


def check_duplicate_declarations(path: str, names: list[str]) -> list[Finding]:
    findings: list[Finding] = []
    for name, count in Counter(names).items():
        if count > 1:
            findings.append(
                Finding(
                    path=path,
                    rule="duplicate-top-level-declaration",
                    detail=f"{name!r} is declared {count} times in the same file",
                )
            )
    return findings


def check_meaningless_names(path: str, names: list[str]) -> list[Finding]:
    findings: list[Finding] = []
    for name in names:
        if name.lower() in MEANINGLESS_NAMES:
            findings.append(
                Finding(
                    path=path,
                    rule="meaningless-top-level-name",
                    detail=f"{name!r} is too vague for a maintained top-level symbol",
                )
            )
    return findings


def check_python_module_name(path: str) -> list[Finding]:
    if not path.startswith(PYTHON_PREFIXES) or not path.endswith(".py"):
        return []
    filename = Path(path).name
    if filename in STANDARD_PYTHON_MODULES:
        return []
    if SNAKE_CASE_MODULE.match(filename):
        return []
    return [
        Finding(
            path=path,
            rule="python-module-name",
            detail="Python module names must use snake_case",
        )
    ]


def check_project_contracts(path: str, text: str) -> list[Finding]:
    findings: list[Finding] = []
    if path in FORBIDDEN_ALGORITHM_ROOT_AUXILIARY_FILES:
        findings.append(
            Finding(
                path=path,
                rule="algorithm-root-auxiliary-migration",
                detail="algorithm regression tests and benchmarks must live under dedicated subpackages, not the package root",
            )
        )

    if path.startswith("backend/src/main/java/com/at/controller/") and "ResponseEntity<Result" in text:
        findings.append(
            Finding(
                path=path,
                rule="response-envelope-contract",
                detail="business controllers should return Result directly, not ResponseEntity<Result>",
            )
        )

    if path == "backend/src/main/java/com/at/mapper/LoginMapper.java":
        findings.append(
            Finding(
                path=path,
                rule="backend-user-aggregate-single-mapper",
                detail="authentication and admin user management must share UserMapper instead of maintaining a parallel LoginMapper",
            )
        )

    if path == "backend/src/main/java/com/at/config/PasswordEncoderConfig.java":
        required_fragments = (
            "Argon2PasswordEncoder.defaultsForSpringSecurity_v5_8()",
            'encoders.put("argon2id", argon2id)',
            'new DelegatingPasswordEncoder("argon2id", encoders)',
        )
        forbidden_fragments = (
            "BCrypt",
            "bcrypt",
            "setDefaultPasswordEncoderForMatches",
        )
        missing_fragments = [fragment for fragment in required_fragments if fragment not in text]
        bad_fragments = [fragment for fragment in forbidden_fragments if fragment in text]
        if missing_fragments or bad_fragments:
            findings.append(
                Finding(
                    path=path,
                    rule="password-argon2id-only",
                    detail=(
                        "password storage must stay Argon2id-only with no bcrypt compatibility "
                        f"fallback: missing={missing_fragments}, forbidden={bad_fragments}"
                    ),
                )
            )

    if path == "backend/src/test/java/com/at/config/PasswordEncoderConfigTest.java":
        required_fragments = (
            "encodesNewPasswordsWithArgon2idPrefix",
            "rejectsBcryptCompatibilityHashes",
            'startsWith("{argon2id}")',
            '"{bcrypt}$2a$12$',
            "isInstanceOf(IllegalArgumentException.class)",
        )
        missing_fragments = [fragment for fragment in required_fragments if fragment not in text]
        if missing_fragments:
            findings.append(
                Finding(
                    path=path,
                    rule="password-argon2id-only-test",
                    detail=(
                        "password encoder tests must prove new Argon2id hashes and rejected bcrypt "
                        f"compatibility hashes: missing={missing_fragments}"
                    ),
                )
            )

    user_aggregate_forbidden_fragments = {
        "backend/src/main/java/com/at/service/impl/LoginServiceImpl.java": (
            "LoginMapper",
            "loginMapper",
            "getByUsername",
        ),
        "backend/src/test/java/com/at/service/impl/LoginServiceImplTest.java": (
            "LoginMapper",
            "loginMapper",
            "getByUsername",
        ),
        "backend/src/main/java/com/at/mapper/UserMapper.java": (
            "LoginMapper",
            "职责分离",
        ),
    }.get(path)
    if user_aggregate_forbidden_fragments:
        bad_fragments = [fragment for fragment in user_aggregate_forbidden_fragments if fragment in text]
        if bad_fragments:
            findings.append(
                Finding(
                    path=path,
                    rule="backend-user-aggregate-single-mapper",
                    detail=f"user aggregate must not split auth/admin persistence across LoginMapper and UserMapper: {bad_fragments}",
                )
            )

    typed_catalog_responses = {
        "backend/src/main/java/com/at/controller/GasController.java": (
            ("GasResponseDTO", "Result<List<GasResponseDTO>>", "GasResponseDTO::fromEntity"),
            ("Result.success(list)", "Result<?> getAllGases()"),
            "gas list must return response DTOs, not Gas entities",
        ),
        "backend/src/main/java/com/at/controller/SensorController.java": (
            ("SensorResponseDTO", "Result<List<SensorResponseDTO>>", "SensorResponseDTO::fromEntity"),
            ("Result.success(list)", "Result<?> getAllSensors()"),
            "sensor list must return response DTOs, not Sensor entities",
        ),
        "backend/src/main/java/com/at/controller/EmergencyPlanController.java": (
            ("EmergencyPlanResponseDTO", "Result<List<EmergencyPlanResponseDTO>>", "EmergencyPlanResponseDTO::fromEntity"),
            ("Result.success(plans)", "Result<?> list()"),
            "emergency plan list must return response DTOs, not EmergencyPlan entities",
        ),
        "backend/src/main/java/com/at/controller/WarningHistoryController.java": (
            ("WarningHistoryResponseDTO", "Result<List<WarningHistoryResponseDTO>>", "WarningHistoryResponseDTO::fromEntity"),
            ("Result.success(list)", "Result<?> getHistoryList()"),
            "warning history list must return response DTOs, not WarningHistory entities",
        ),
        "backend/src/main/java/com/at/controller/MonitorPointController.java": (
            ("MonitorPointResponseDTO", "Result<List<MonitorPointResponseDTO>>", "Result<MonitorPointResponseDTO>", "MonitorPointResponseDTO::fromEntity"),
            ("Result.success(list)", "Result.success(point)", "Result<?> list()", "Result<?> create("),
            "monitor point read/create endpoints must return response DTOs, not MonitorPoint entities",
        ),
        "backend/src/main/java/com/at/controller/EmployeeController.java": (
            ("EmployeeResponseDTO", "Result<List<EmployeeResponseDTO>>", "Result<EmployeeResponseDTO>", "EmployeeResponseDTO::fromEntity"),
            ("Result.success(list)", "Result.success(employee)", "Result<?> list()", "Result<?> create(", "Result<?> update("),
            "employee read/write endpoints must return response DTOs, not Employee entities",
        ),
        "backend/src/main/java/com/at/controller/UserController.java": (
            ("UserResponseDTO", "Result<List<UserResponseDTO>>", "UserResponseDTO::fromEntity"),
            ("Result.success(users)", "Result<?> list()"),
            "user list must return password-free response DTOs, not User entities",
        ),
        "backend/src/main/java/com/at/controller/CarController.java": (
            ("CarResponseDTO", "Result<List<CarResponseDTO>>", "CarResponseDTO::fromEntity"),
            ("Result.success(carList)", "Result<?> getAllCars()"),
            "car list must return response DTOs, not Car entities",
        ),
        "backend/src/main/java/com/at/controller/EnvironmentReadingController.java": (
            ("EnvironmentReadingResponseDTO", "Result<EnvironmentReadingResponseDTO>", "Result<List<EnvironmentReadingResponseDTO>>", "EnvironmentReadingService"),
            ("Result<EnvironmentReading>", "Result<List<EnvironmentReading>>", "Result.success(reading)"),
            "environment reading endpoints must return response DTOs, not EnvironmentReading entities",
        ),
        "backend/src/main/java/com/at/controller/SimulationMonitoringController.java": (
            ("SimulationScenarioResponseDTO", "SensorReadingResponseDTO", "Result<SimulationScenarioResponseDTO>", "Result<List<SimulationScenarioResponseDTO>>", "Result<SensorReadingResponseDTO>", "Result<List<SensorReadingResponseDTO>>"),
            ("Result<SimulationScenario>", "Result<List<SimulationScenario>>", "Result<SensorReading>", "Result<List<SensorReading>>", "Result.success(scenario)", "Result.success(reading)"),
            "simulation monitoring endpoints must return response DTOs, not simulation entities",
        ),
        "backend/src/main/java/com/at/controller/SensorLayoutController.java": (
            ("SensorLayoutSummaryResponseDTO", "SensorLayoutDetailResponseDTO", "Result<List<SensorLayoutSummaryResponseDTO>>", "SensorLayoutResponseDTO("),
            ("Result.success(list)", "Result<?> getAllLayouts()", "new SensorLayoutResponseDTO(layout, details)"),
            "sensor layout endpoints must return response DTOs, not SensorLayout entities",
        ),
        "backend/src/main/java/com/at/controller/ImageAnalysisController.java": (
            ("ImageAnalysisService", "Result<List<InspectRecordResponseDTO>>"),
            ("InspectRecordMapper", "CarMapper", "Result.success(inspectRecordMapper.listAll())", "Result<?> getList()"),
            "image analysis controller must delegate list DTO creation to ImageAnalysisService",
        ),
    }
    if path in typed_catalog_responses:
        required_fragments, forbidden_fragments, message = typed_catalog_responses[path]
        missing_fragments = [fragment for fragment in required_fragments if fragment not in text]
        bad_fragments = [fragment for fragment in forbidden_fragments if fragment in text]
        if missing_fragments or bad_fragments:
            findings.append(
                Finding(
                    path=path,
                    rule="backend-catalog-typed-response",
                    detail=f"{message}: missing={missing_fragments}, forbidden={bad_fragments}",
                )
            )

    if path == "backend/src/main/java/com/at/controller/SensorLayoutController.java":
        required_fragments = (
            "SensorLayoutResponseDTO",
            "IdResponseDTO",
            "SensorLayoutSummaryResponseDTO.fromEntity(layout)",
            "SensorLayoutDetailResponseDTO::fromEntity",
            "new IdResponseDTO(layoutId)",
            '@DeleteMapping("/{id}")',
        )
        forbidden_fragments = (
            'Map.of("layout", layout, "details", details)',
            'Map.of("id", layoutId)',
            '@PostMapping("/delete/{id}")',
        )
        missing_fragments = [fragment for fragment in required_fragments if fragment not in text]
        bad_fragments = [fragment for fragment in forbidden_fragments if fragment in text]
        if missing_fragments or bad_fragments:
            findings.append(
                Finding(
                    path=path,
                    rule="backend-sensor-layout-typed-response",
                    detail=f"sensor layout controller must return typed DTOs, not anonymous maps: missing={missing_fragments}, forbidden={bad_fragments}",
                )
            )

    if path == "backend/src/main/java/com/at/controller/CarController.java":
        required_fragments = (
            "int rows = carService.setWarning(dto.getCarId())",
            "int rows = carService.resetStatus(dto.getCarId())",
            'Result.error(404, "小车不存在")',
        )
        forbidden_fragments = (
            "carService.setWarning(dto.getCarId());\n        log.info",
            "carService.resetStatus(dto.getCarId());\n        log.info",
        )
        missing_fragments = [fragment for fragment in required_fragments if fragment not in text]
        bad_fragments = [fragment for fragment in forbidden_fragments if fragment in text]
        if missing_fragments or bad_fragments:
            findings.append(
                Finding(
                    path=path,
                    rule="car-actions-empty-write-contract",
                    detail=(
                        "car warning/reset writes must expose missing rows instead of returning success: "
                        f"missing={missing_fragments}, forbidden={bad_fragments}"
                    ),
                )
            )

    if path == "backend/src/test/java/com/at/controller/CarControllerTest.java":
        required_fragments = (
            "setWarningReturnsNotFoundWhenNoRowsUpdated",
            "resetStatusReturnsNotFoundWhenNoRowsUpdated",
            'assertThat(body.getCode()).isEqualTo(404)',
            'assertThat(body.getMessage()).isEqualTo("小车不存在")',
        )
        missing_fragments = [fragment for fragment in required_fragments if fragment not in text]
        if missing_fragments:
            findings.append(
                Finding(
                    path=path,
                    rule="car-actions-empty-write-contract",
                    detail=f"car action controller tests must cover missing-row writes: {missing_fragments}",
                )
            )

    if path == "backend/src/main/java/com/at/service/MonitoringDataService.java":
        forbidden_fragments = (
            "WarningHistoryService",
            "WarningHistory",
            "warningHistoryService",
            "warning_history",
            "buildTrend(List<WarningHistory>",
            "buildLatestReadings(List<WarningHistory>",
        )
        bad_fragments = [fragment for fragment in forbidden_fragments if fragment in text]
        if bad_fragments:
            findings.append(
                Finding(
                    path=path,
                    rule="monitoring-overview-sensor-reading-only",
                    detail=(
                        "monitoring overview readings/trends must come from sensor_reading only; "
                        f"warning_history is an event log, not a sampling fallback: forbidden={bad_fragments}"
                    ),
                )
            )

    if path == "backend/src/test/java/com/at/service/MonitoringDataServiceTest.java":
        required_fragments = (
            "overviewKeepsReadingsEmptyWhenSensorReadingsAreAbsent",
            "assertThat(overview.concentrationTrend()).isEmpty()",
            "assertThat(overview.latestReadings()).isEmpty()",
        )
        forbidden_fragments = (
            "overviewFallsBackToWarningHistoryWhenSensorReadingsAreAbsent",
            "warningHistoryService",
            "warning_history",
        )
        missing_fragments = [fragment for fragment in required_fragments if fragment not in text]
        bad_fragments = [fragment for fragment in forbidden_fragments if fragment in text]
        if missing_fragments or bad_fragments:
            findings.append(
                Finding(
                    path=path,
                    rule="monitoring-overview-sensor-reading-only-test",
                    detail=(
                        "monitoring overview tests must prove missing sensor_reading stays empty "
                        f"instead of falling back to warning_history: missing={missing_fragments}, "
                        f"forbidden={bad_fragments}"
                    ),
                )
            )

    if path == "frontend/src/views/smart_map/smartMapLightweightConcentration.ts":
        required_fragments = (
            "simulated/manual observations",
            "explicit sensor_reading records",
        )
        forbidden_fragments = (
            "placeholder sensor readings",
            "real sensor readings",
        )
        missing_fragments = [fragment for fragment in required_fragments if fragment not in text]
        bad_fragments = [fragment for fragment in forbidden_fragments if fragment in text]
        if missing_fragments or bad_fragments:
            findings.append(
                Finding(
                    path=path,
                    rule="smart-map-lightweight-observation-source-label",
                    detail=(
                        "lightweight concentration helper must preserve simulated/manual source semantics: "
                        f"missing={missing_fragments}, forbidden={bad_fragments}"
                    ),
                )
            )

    if path in PACKAGE_BOUNDARY_CLEAN_FILES and ("sys.path" in text or "except ImportError" in text):
        findings.append(
            Finding(
                path=path,
                rule="algorithm-package-boundary",
                detail="cleaned algorithm modules must use package imports, not sys.path injection or dual import fallback",
            )
        )

    if path == "algorithm/gas_diffusion_astar.py":
        findings.append(
            Finding(
                path=path,
                rule="algorithm-root-planning-compat-wrapper-removed",
                detail="algorithm package root must not restore gas_diffusion_astar compatibility exports",
            )
        )

    if path == "frontend/src/views/smart_map/components/LODManager.ts":
        findings.append(
            Finding(
                path=path,
                rule="smart-map-unused-lod-placeholder-removed",
                detail="unused smart_map LOD placeholder must not return as an uncalled no-op capability",
            )
        )

    if path.startswith("algorithm/") and "algorithm.gas_diffusion_astar" in text:
        findings.append(
            Finding(
                path=path,
                rule="algorithm-internal-root-compat-usage",
                detail="algorithm internals must import planning implementations from algorithm.planning, not the package-root compatibility wrapper",
            )
        )

    if path in {"algorithm/api_server.py", "algorithm/polo.py", "algorithm/service_config.py"}:
        auth_default_false = re.search(
            r"ALGORITHM_REQUIRE_AUTH['\"],\s*['\"]false['\"]",
            text,
            re.IGNORECASE,
        )
        if auth_default_false:
            findings.append(
                Finding(
                    path=path,
                    rule="algorithm-auth-default",
                    detail="algorithm services must require auth by default",
                )
            )

    if path.startswith("backend/src/main/java/") and "ResponseEntity" in text:
        response_entity_result = re.search(
            r"ResponseEntity\s*<\s*Result\b|ResponseEntity\s*\.\s*(?:ok|status|badRequest)\s*\(\s*Result\.",
            text,
        )
        if response_entity_result:
            findings.append(
                Finding(
                    path=path,
                    rule="backend-single-response-semantics",
                    detail="backend endpoints must not wrap Result in ResponseEntity; use one response semantics layer",
                )
            )

    if path.startswith("backend/src/main/java/com/at/service/"):
        unchecked_insert = re.search(
            r"(?m)^\s*(?!int\s+\w*rows\b)\w+Mapper\.insert\([^;]+;",
            text,
        )
        if unchecked_insert:
            findings.append(
                Finding(
                    path=path,
                    rule="backend-service-insert-affected-rows",
                    detail="service writes must inspect mapper insert affected rows instead of assuming success",
                )
            )

    if path == "backend/src/main/java/com/at/pojo/dto/EmployeeSaveDTO.java":
        required_fragments = (
            "@Min(value = 1, message = \"性别只能为 1=男 或 2=女\")",
            "@Max(value = 2, message = \"性别只能为 1=男 或 2=女\")",
            "@Pattern(regexp = \"^(在岗|休假|离职)$\"",
            "@Min(value = 18, message = \"年龄不能小于18\")",
            "@Max(value = 60, message = \"年龄不能大于60\")",
        )
        missing_fragments = [fragment for fragment in required_fragments if fragment not in text]
        if missing_fragments:
            findings.append(
                Finding(
                    path=path,
                    rule="employee-dto-domain-validation",
                    detail=f"employee save DTO must validate domain values, not only required fields: {missing_fragments}",
                )
            )

    if path == "backend/src/main/java/com/at/service/EmployeeService.java":
        required_fragments = (
            "ensureEmployeeNoAvailable(dto.getEmployeeNo(), null)",
            "ensureEmployeeNoAvailable(dto.getEmployeeNo(), id)",
            "int rows = employeeMapper.update(employee)",
            "if (rows == 0)",
            "throw new IllegalArgumentException(\"Employee does not exist: \" + id)",
            "return rows > 0",
            "employeeMapper.selectByEmployeeNo(employeeNo)",
            "Employee number already exists",
        )
        missing_fragments = [fragment for fragment in required_fragments if fragment not in text]
        if missing_fragments:
            findings.append(
                Finding(
                    path=path,
                    rule="employee-crud-write-semantics",
                    detail=(
                        "employee service must reject duplicate employeeNo and zero-row update/delete semantics: "
                        f"{missing_fragments}"
                    ),
                )
            )

    if path == "backend/src/test/java/com/at/service/EmployeeServiceTest.java":
        required_fragments = (
            "updateEmployeeRejectsMissingRow",
            "createEmployeeRejectsDuplicateEmployeeNoBeforeInsert",
            "updateEmployeeRejectsEmployeeNoOwnedByAnotherRow",
            "deleteEmployeeReturnsFalseWhenNoRowsDeleted",
            "createEmployeeRejectsZeroInsertedRows",
        )
        missing_fragments = [fragment for fragment in required_fragments if fragment not in text]
        if missing_fragments:
            findings.append(
                Finding(
                    path=path,
                    rule="employee-crud-write-semantics-tests",
                    detail=f"employee service tests must cover write semantic regressions: {missing_fragments}",
                )
            )

    if path == "backend/src/test/java/com/at/service/WarningHistoryServiceImplTest.java":
        required_fragments = (
            "addWarningRecordReturnsFalseWhenMapperInsertsNoRows",
            "when(warningHistoryMapper.insert(any(WarningHistory.class))).thenReturn(0)",
            "assertThat(saved).isFalse()",
        )
        missing_fragments = [fragment for fragment in required_fragments if fragment not in text]
        if missing_fragments:
            findings.append(
                Finding(
                    path=path,
                    rule="warning-history-insert-affected-rows-test",
                    detail=(
                        "warning history service tests must cover zero-row insert handling: "
                        f"missing={missing_fragments}"
                    ),
                )
            )

    if path.startswith("frontend/src/") and path != "frontend/src/types/api.ts":
        duplicate_result_contract = re.search(
            r"(?:interface|type)\s+(?:ApiResult|Result|ResponseData)\b",
            text,
        )
        if duplicate_result_contract:
            findings.append(
                Finding(
                    path=path,
                    rule="frontend-shared-api-result-contract",
                    detail="frontend API response envelope types must be imported from frontend/src/types/api.ts",
                )
            )

    if path in {
        "README.md",
        "backend/README.md",
        "docs/development-guide.md",
        "docs/changelog.md",
    }:
        if re.search(r"(?m)^\s*mvn(?:\.cmd)?\s+spring-boot:run\s*$", text):
            findings.append(
                Finding(
                    path=path,
                    rule="backend-local-profile-docs",
                    detail="manual backend startup docs must pass -Dspring-boot.run.profiles=local; bare mvn spring-boot:run defaults to prod",
                )
            )

    if path == "docs/changelog.md":
        required_fragments = (
            "历史开发改造总结",
            "不作为当前启动、部署、接口或账号操作手册",
            "本文件不再维护启动命令、访问地址或测试账号",
        )
        forbidden_fragments = (
            "## 七、服务启动配置",
            "### 启动命令",
            "### 访问地址",
            "| 前端 | http://localhost:5173 |",
            "uv run uvicorn algorithm.api_server:app --host 127.0.0.1 --port 8000 --reload",
        )
        missing_fragments = [fragment for fragment in required_fragments if fragment not in text]
        bad_fragments = [fragment for fragment in forbidden_fragments if fragment in text]
        if missing_fragments or bad_fragments:
            findings.append(
                Finding(
                    path=path,
                    rule="changelog-history-not-runbook",
                    detail=(
                        "changelog must stay a historical record and not duplicate current runbook commands: "
                        f"missing={missing_fragments}, forbidden={bad_fragments}"
                    ),
                )
            )

    if path in {
        "README.md",
        "algorithm/README.md",
        "docs/technical-route-to-deployment.md",
        "docs/coding-standards.md",
        "docs/dataset-sources.md",
        "docs/audit-remediation-matrix-2026-06-18.md",
    }:
        stale_algorithm_commands = (
            "python -m diffusion.",
            "python -m inversion.",
            "python -m planning.",
            "uv run --no-sync python -m diffusion.",
            "uv run --no-sync python -m inversion.",
            "uv run --no-sync python -m planning.",
        )
        bad_fragments = [fragment for fragment in stale_algorithm_commands if fragment in text]
        if bad_fragments:
            findings.append(
                Finding(
                    path=path,
                    rule="algorithm-command-docs-package-root",
                    detail=f"algorithm verification commands must use package-root algorithm.* modules: {bad_fragments}",
                )
            )

    if path in {
        "README.md",
        "docs/coding-standards.md",
        "docs/technical-route-to-deployment.md",
        "algorithm/PATH_GAS_CONSTRAINTS.md",
    }:
        forbidden_fragments = (
            "Python 算法服务暂时保留 `success` 和 `error` 字段兼容旧前端调用",
            "算法服务当前仍复制 `success/error` 兼容字段",
            "Python 算法服务当前会复制 `success` 和 `error` 作为兼容字段",
            "route.success",
        )
        bad_fragments = [fragment for fragment in forbidden_fragments if fragment in text]
        if bad_fragments:
            findings.append(
                Finding(
                    path=path,
                    rule="algorithm-envelope-docs-no-legacy-status-fields",
                    detail=f"docs must not describe legacy outer success/error compatibility: {bad_fragments}",
                )
            )

    if path == "frontend/README.md":
        required_fragments = (
            "npm run typecheck:strict",
            "npm.cmd run typecheck:strict",
            "YOLO11m 巡检图片人员识别",
        )
        forbidden_fragments = (
            "npm run typecheck\n",
            "npm.cmd run typecheck\n",
            "YOLO11m 人员识别与厂区实时监测",
        )
        missing_fragments = [fragment for fragment in required_fragments if fragment not in text]
        bad_fragments = [fragment for fragment in forbidden_fragments if fragment in text]
        if missing_fragments or bad_fragments:
            findings.append(
                Finding(
                    path=path,
                    rule="frontend-readme-strict-typecheck-gate",
                    detail=(
                        "frontend README must match CI/Husky strict typecheck gates: "
                        f"missing={missing_fragments}, forbidden={bad_fragments}"
                    ),
                )
            )

    if path == "README.md":
        required_fragments = (
            "npm run typecheck:strict",
            "npm run build:pro",
        )
        forbidden_fragments = (
            "npm run typecheck\n",
        )
        missing_fragments = [fragment for fragment in required_fragments if fragment not in text]
        bad_fragments = [fragment for fragment in forbidden_fragments if fragment in text]
        if missing_fragments or bad_fragments:
            findings.append(
                Finding(
                    path=path,
                    rule="root-readme-strict-typecheck-gate",
                    detail=(
                        "root README verification commands must match strict frontend gates: "
                        f"missing={missing_fragments}, forbidden={bad_fragments}"
                    ),
                )
            )

    if path == "docs/项目总体要求.md":
        required_fragments = (
            "视频识别需先补齐帧抽取、标注样本和指标报告",
            "视频识别作为后续扩展，不得冒充当前已交付能力",
            "小车管理页面可处理 JPG/PNG 图片上传并调用 YOLO11m 识别；视频识别尚未交付",
            "当前已交付的 Java 后端接口统一使用 `/api/...` 路径",
            "/api/diffusion/simulate",
            "/api/inversion/...",
            "/api/planning/evacuation",
            "/api/analysis/person",
            '"ok": true',
            '"requestId": "uuid"',
            '"payloadDigest"',
            '"grayRelease"',
            '"fallback"',
            '"strategy": "NONE"',
            "不得在外层复制旧的 `success/error` 兼容字段",
        )
        forbidden_fragments = (
            "图片或视频可通过 YOLO11m",
            "小车图片/视频上传记录表",
            "小车摄像头图片/视频",
            "摄像头上传图片/视频",
            '"success": true',
            '"success": false',
            "| success | boolean | 是 | 请求是否成功 |",
            '"request_id": "uuid"',
            "/api/v1/...",
            "/api/v1/algorithm/...",
            "/api/v1/device/...",
            "/api/v1/openapi.json",
            "/api/v1/docs",
        )
        missing_fragments = [fragment for fragment in required_fragments if fragment not in text]
        bad_fragments = [fragment for fragment in forbidden_fragments if fragment in text]
        if missing_fragments or bad_fragments:
            findings.append(
                Finding(
                    path=path,
                    rule="requirements-api-contract-current",
                    detail=(
                        "requirements doc must match delivered API/Yolo capability and current response contract: "
                        f"missing={missing_fragments}, forbidden={bad_fragments}"
                    ),
                )
            )

    if path == "frontend/.env.production":
        forbidden_fragments = (
            "VITE_SERVE",
            "VITE_ALGORITHM_SERVE",
        )
        bad_fragments = [fragment for fragment in forbidden_fragments if fragment in text]
        if bad_fragments:
            findings.append(
                Finding(
                    path=path,
                    rule="frontend-production-env-relative-api",
                    detail=f"production frontend env must not declare dev proxy targets or fixed server URLs: {bad_fragments}",
                )
            )

    if path == "frontend/src/vite-env.d.ts":
        forbidden_fragments = (
            "VITE_SERVE",
            "VITE_ALGORITHM_SERVE",
        )
        bad_fragments = [fragment for fragment in forbidden_fragments if fragment in text]
        if bad_fragments:
            findings.append(
                Finding(
                    path=path,
                    rule="frontend-runtime-env-types",
                    detail=f"browser env types must only expose runtime variables consumed by frontend code: {bad_fragments}",
                )
            )

    if path == "docs/architecture.md":
        required_fragments = (
            "气体监测与仿真读数",
            "当前仓库没有真实硬件采集链路",
            "仿真读数/手工观测/巡检图片素材",
            "不具备真实车载传感器连续采样链路",
        )
        forbidden_fragments = (
            "气体实时监控",
            "传感器/小车 → Java 后端",
            "派遣小车现场采样复核",
            "已接入实时采样存储",
        )
        missing_fragments = [fragment for fragment in required_fragments if fragment not in text]
        bad_fragments = [fragment for fragment in forbidden_fragments if fragment in text]
        if missing_fragments or bad_fragments:
            findings.append(
                Finding(
                    path=path,
                    rule="architecture-monitoring-truth-boundary",
                    detail=f"architecture docs must not imply real hardware telemetry: missing={missing_fragments}, forbidden={bad_fragments}",
                )
            )

    monitoring_truth_boundaries = {
        "backend/src/main/java/com/at/controller/EnvironmentReadingController.java": (
            "至少需要一个实测环境指标",
            "环境实测数据已保存",
        ),
        "backend/src/main/java/com/at/controller/MonitoringDataController.java": (
            "未接入实测环境数据",
            "CarMapper",
            "EnvironmentReadingMapper",
            "SensorReadingMapper",
            "buildEnvironmentSnapshot",
            "buildTrendFromSensorReadings",
        ),
        "frontend/src/layout/monitor.vue": (
            "未接入实测环境数据",
            "设备或气象站数据",
        ),
        "frontend/src/views/emergency/index.vue": (
            "未接入实测环境数据",
        ),
    }
    forbidden_truth_fragments = monitoring_truth_boundaries.get(path)
    if forbidden_truth_fragments:
        bad_fragments = [fragment for fragment in forbidden_truth_fragments if fragment in text]
        if bad_fragments:
            findings.append(
                Finding(
                    path=path,
                    rule="environment-reading-truth-boundary",
                    detail=f"environment readings must not imply a park hardware measured-data chain: {bad_fragments}",
                )
            )

    if path == "frontend/src/views/home/README.md":
        required_fragments = (
            "监测点总数",
            "在线监测点",
            "来自 `monitoring/overview`",
            "园区公告（示例）",
            "当前没有后端公告接口",
            "`/api/monitoring/overview`",
            "`/api/history/list`",
            "`/person/approval`",
            "`/monitor`",
            "数字园区 `/screen` 当前不在主页快捷按钮中",
        )
        forbidden_fragments = (
            "企业数、设备数",
            "设备在线率",
            "后续应接入后端公告接口",
            "/api/dashboard/notices",
            "/api/dashboard/summary",
            "/api/dashboard/alarm-distribution",
            "/api/dashboard/gas-trend",
            "/api/dashboard/recent-alarms",
            "按现有监控页面路由",
            "数字园区 | `/screen`",
        )
        missing_fragments = [fragment for fragment in required_fragments if fragment not in text]
        bad_fragments = [fragment for fragment in forbidden_fragments if fragment in text]
        if missing_fragments or bad_fragments:
            findings.append(
                Finding(
                    path=path,
                    rule="home-readme-current-page-contract",
                    detail=f"home README must describe the current dashboard, route, and simulation boundaries: missing={missing_fragments}, forbidden={bad_fragments}",
                )
            )

    if path in {"algorithm/api_server.py", "algorithm/polo.py"}:
        required_fragments = (
            "install_algorithm_cors",
            "algorithm_api_key",
            "algorithm_auth_required",
            "validate_algorithm_api_key",
        )
        forbidden_fragments = (
            "CORSMiddleware",
            'os.getenv("ALGORITHM_CORS_ORIGINS"',
            'os.getenv("ALGORITHM_REQUIRE_AUTH"',
        )
        missing_fragments = [fragment for fragment in required_fragments if fragment not in text]
        bad_fragments = [fragment for fragment in forbidden_fragments if fragment in text]
        if missing_fragments or bad_fragments:
            findings.append(
                Finding(
                    path=path,
                    rule="algorithm-service-config-boundary",
                    detail=(
                        "algorithm FastAPI entrypoints must share CORS/auth configuration helpers: "
                        f"missing={missing_fragments}, forbidden={bad_fragments}"
                    ),
                )
            )

    if path == "algorithm/service_config.py":
        required_fragments = (
            "DEFAULT_ALGORITHM_CORS_ORIGINS",
            "parse_cors_origins",
            "install_algorithm_cors",
            "algorithm_api_key",
            "algorithm_auth_required",
            "validate_algorithm_api_key",
        )
        missing_fragments = [fragment for fragment in required_fragments if fragment not in text]
        if missing_fragments:
            findings.append(
                Finding(
                    path=path,
                    rule="algorithm-service-config-boundary",
                    detail=f"shared algorithm service config helper is incomplete: {missing_fragments}",
                )
            )

    if path == "algorithm/tests/test_service_config.py":
        required_fragments = (
            "test_algorithm_auth_required_defaults_to_true",
            "test_install_algorithm_cors_uses_shared_default_surface",
            "test_validate_algorithm_api_key_requires_configured_key_by_default",
            "test_validate_algorithm_api_key_rejects_bad_key",
            "self.assertEqual(raised.exception.status_code, 503)",
            "self.assertEqual(raised.exception.status_code, 401)",
            "contains_cors_origin(origins, \"http://localhost:5173\")",
        )
        missing_fragments = [fragment for fragment in required_fragments if fragment not in text]
        if missing_fragments:
            findings.append(
                Finding(
                    path=path,
                    rule="algorithm-service-config-tests",
                    detail=(
                        "shared algorithm CORS/auth defaults must stay covered by tests: "
                        f"{missing_fragments}"
                    ),
                )
            )

    if path == "algorithm/planning/evacuation_runner.py":
        required_fragments = (
            "def _as_public_route",
            "def _as_public_batch",
            '"isReachable"',
            '"hasAnyReachable"',
            '"reachableCount"',
            'public_route.pop("success", None)',
            'public_result.pop("hasAnySuccess", None)',
            'public_result.pop("successCount", None)',
        )
        missing_fragments = [fragment for fragment in required_fragments if fragment not in text]
        if missing_fragments:
            findings.append(
                Finding(
                    path=path,
                    rule="algorithm-evacuation-public-reachability-contract",
                    detail=(
                        "public evacuation runner must translate internal success fields into "
                        f"isReachable/reachableCount contract: missing={missing_fragments}"
                    ),
                )
            )

    if path == "algorithm/tests/test_evacuation_runner_public_contract.py":
        required_fragments = (
            "test_single_route_exposes_reachability_without_internal_success",
            "test_batch_route_exposes_reachability_without_legacy_counts",
            'self.assertNotIn("success", result)',
            'self.assertNotIn("hasAnySuccess", result)',
            'self.assertNotIn("successCount", result)',
            'self.assertIn("isReachable", route)',
        )
        missing_fragments = [fragment for fragment in required_fragments if fragment not in text]
        if missing_fragments:
            findings.append(
                Finding(
                    path=path,
                    rule="algorithm-evacuation-public-reachability-contract-test",
                    detail=f"evacuation public contract test is incomplete: {missing_fragments}",
                )
            )

    if path == "algorithm/api_server.py":
        required_fragments = (
            "_success_with_trace",
            "algorithm_error_response",
            '"requestId"',
            '"inputSummary"',
            '"algorithm"',
            '"runtime"',
            '"algorithmVersion"',
            '"configVersion"',
            '"costMs"',
            '"errors"',
            '"grayRelease"',
            '"fallback"',
            "payload.setdefault(\"errors\"",
            "payload.setdefault(\"fallback\", _fallback_meta())",
            "def _fallback_meta",
            "ALGORITHM_RELEASE_CHANNEL",
            "ALGORITHM_ROLLBACK_TARGET",
            "algorithm_task_completed",
            "algorithm_task_failed",
            '"grayChannel": payload["grayRelease"]["channel"]',
            '"grayTrafficPercent": payload["grayRelease"]["trafficPercent"]',
            '"grayEnabled": payload["grayRelease"]["enabled"]',
            '"rollbackTarget": payload["grayRelease"]["rollbackTarget"]',
            '"fallbackUsed": payload["fallback"]["used"]',
            '"fallbackStrategy": payload["fallback"]["strategy"]',
            '"fallbackReason": payload["fallback"]["reason"]',
            "ALGORITHM_CONFIG_VERSION",
            "_payload_digest",
            "_request_input_summary",
            "observationPayload",
            "activeSensors",
            '"frameCount"',
            '"hasRefinementConfig"',
            '"algorithm-http-exception"',
            '"algorithm-unhandled-exception"',
            'content["data"] = payload',
        )
        missing_fragments = [fragment for fragment in required_fragments if fragment not in text]
        forbidden_fragments = (
            '{"status": "error", "success": False',
            '_result_with_http_semantics',
            '@app.post("/api/gas-path"',
            '@app.post("/api/time-series"',
            "def gas_path",
            "def time_series_simulation",
            "calculate_gas_and_path",
            "simulate_time_series",
            "content=error_response(message, exc.status_code",
            'content=error_response("算法服务内部错误"',
        )
        bad_fragments = [fragment for fragment in forbidden_fragments if fragment in text]
        if missing_fragments or bad_fragments:
            findings.append(
                Finding(
                    path=path,
                    rule="algorithm-traceable-response-contract",
                    detail=(
                        "main algorithm service must return reproducible runtime metadata and keep "
                        f"retired legacy endpoints out of the public service: missing={missing_fragments}, "
                        f"forbidden={bad_fragments}"
                    ),
                )
            )

    if path == "algorithm/tests/test_api_server_http_semantics.py":
        required_fragments = (
            "test_public_algorithm_endpoints_expose_trace_envelope",
            "test_yolo_health_and_error_payloads_expose_errors_array",
            "test_yolo_success_payload_exposes_trace_contract",
            "api_server.diffusion_simulate",
            "api_server.grid_search",
            "api_server.analytic_inversion",
            "api_server.particle_filter_inversion",
            "api_server.evacuation_planning",
            '"payloadDigest"',
            '"sensorCount"',
            '"frameCount"',
            '"errors"',
            '"grayRelease"',
            '"fallback"',
            '"strategy"',
            '"NONE"',
            'assertNotIn("success", body["data"])',
            'assertNotIn("success", data)',
            'polo.detect_and_render',
            "run_diffusion_simulation",
            "run_evacuation_planning",
        )
        missing_fragments = [fragment for fragment in required_fragments if fragment not in text]
        if missing_fragments:
            findings.append(
                Finding(
                    path=path,
                    rule="algorithm-traceable-response-contract",
                    detail=f"public algorithm endpoint trace fields must stay covered by tests: {missing_fragments}",
                )
            )

    if path == "algorithm/inversion/inversion_dataset.py":
        required_fragments = (
            "LEGACY_PAYLOAD_KEYS",
            "_reject_legacy_payload_aliases",
            "_observation_payload",
            "the current schema is mandatory",
        )
        forbidden_fragments = (
            "ALGORITHM_ALLOW_LEGACY_INVERSION_PAYLOAD",
            "os.getenv(",
            'payload.get("exportPayload")',
            'payload.get("pinnExportPayload")',
            'payload.get("trainingConfig")',
            'refinement_input.get("trainingConfig")',
        )
        missing_fragments = [fragment for fragment in required_fragments if fragment not in text]
        bad_fragments = [fragment for fragment in forbidden_fragments if fragment in text]
        if missing_fragments or bad_fragments:
            findings.append(
                Finding(
                    path=path,
                    rule="inversion-single-payload-schema",
                    detail=f"inversion dataset must default to the current schema: missing={missing_fragments}, forbidden={bad_fragments}",
                )
            )

    if path == "algorithm/inversion/particle_filter.py":
        required_fragments = (
            "LEGACY_PAYLOAD_KEYS",
            "legacy particle-filter payload aliases are disabled; ",
            "offenders = [key for key in LEGACY_PAYLOAD_KEYS if key in payload]",
        )
        forbidden_fragments = (
            "ALGORITHM_ALLOW_LEGACY_INVERSION_PAYLOAD",
            "os.getenv(",
            "if not ALLOW_LEGACY_INVERSION_PAYLOAD",
            'payload.get("exportPayload")',
            'payload.get("pinnExportPayload")',
        )
        missing_fragments = [fragment for fragment in required_fragments if fragment not in text]
        bad_fragments = [fragment for fragment in forbidden_fragments if fragment in text]
        if missing_fragments or bad_fragments:
            findings.append(
                Finding(
                    path=path,
                    rule="inversion-single-payload-schema",
                    detail=f"particle filter must default to current sensor schema: missing={missing_fragments}, forbidden={bad_fragments}",
                )
            )

        timing_required_fragments = (
            "observed_arrival_times",
            "_arrival_time_log_likelihood",
            "arrivalTimeConstraint",
            "arrival_time_weight",
            "upwind_signal_weight",
        )
        missing_timing_fragments = [
            fragment for fragment in timing_required_fragments if fragment not in text
        ]
        if missing_timing_fragments:
            findings.append(
                Finding(
                    path=path,
                    rule="inversion-wind-timing-constraint",
                    detail=(
                        "particle filter must preserve wind-projected arrival-time constraints: "
                        f"missing={missing_timing_fragments}"
                    ),
                )
            )

    if path == "algorithm/response_utils.py":
        required_fragments = (
            '"code": code',
            '"message": message',
            '"data": data',
            '"ok": ok',
            '"timestamp": int(time.time() * 1000)',
            '"requestId": resolved_request_id',
        )
        forbidden_fragments = (
            '"success": ok',
            '"error": None if ok else message',
            "preserving old algorithm fields",
        )
        missing_fragments = [fragment for fragment in required_fragments if fragment not in text]
        bad_fragments = [fragment for fragment in forbidden_fragments if fragment in text]
        if missing_fragments or bad_fragments:
            findings.append(
                Finding(
                    path=path,
                    rule="algorithm-envelope-no-legacy-status-fields",
                    detail=(
                        "algorithm HTTP envelope must use ok/code/message/data/requestId only; "
                        f"missing={missing_fragments}, forbidden={bad_fragments}"
                    ),
                )
            )

    if path == "algorithm/inversion/grid_search.py":
        required_fragments = (
            "_arrival_consistency_score",
            "_combine_candidate_score",
            "_candidate_score_floor",
            "windConsistency",
            "arrivalScore",
            "UPWIND_SIGNAL_TOLERANCE_M",
            "absoluteRmseSec",
            "relativeRmseSec",
            "gated_arrival",
            "math.sqrt(signal_weight)",
            "scoreFloor",
        )
        missing_fragments = [fragment for fragment in required_fragments if fragment not in text]
        if missing_fragments:
            findings.append(
                Finding(
                    path=path,
                    rule="inversion-wind-timing-constraint",
                    detail=(
                        "coarse search must preserve wind-projected arrival-time scoring: "
                        f"missing={missing_fragments}"
                    ),
                )
            )

    if path == "algorithm/inversion/plume_losses.py":
        required_fragments = (
            "compute_arrival_time_loss",
            "UPWIND_SIGNAL_TOLERANCE_M",
            "ARRIVAL_TIME_SIGMA_SEC",
            "absolute_rmse",
            "relative_rmse",
            "upwind_penalty",
        )
        missing_fragments = [fragment for fragment in required_fragments if fragment not in text]
        if missing_fragments:
            findings.append(
                Finding(
                    path=path,
                    rule="inversion-wind-timing-constraint",
                    detail=(
                        "refinement losses must preserve wind-projected arrival-time scoring: "
                        f"missing={missing_fragments}"
                    ),
                )
            )

    if path == "algorithm/inversion/test_wind_timing_constraints.py":
        required_fragments = (
            "test_particle_filter_arrival_likelihood_penalizes_far_upwind_shift",
            "test_coarse_search_arrival_score_uses_wind_projected_absolute_time",
            "test_coarse_arrival_score_weights_near_high_signal_sensors",
            "test_coarse_score_does_not_let_arrival_only_candidate_rank_high",
            "test_coarse_candidate_score_floor_treats_top_k_as_upper_bound",
            "test_refinement_arrival_loss_rejects_same_wind_axis_upstream_shift",
            "arrivalTimeSec",
        )
        missing_fragments = [fragment for fragment in required_fragments if fragment not in text]
        if missing_fragments:
            findings.append(
                Finding(
                    path=path,
                    rule="inversion-wind-timing-constraint",
                    detail=(
                        "wind timing regression tests must cover particle, coarse, and refinement paths: "
                        f"missing={missing_fragments}"
                    ),
                )
            )

    if path == "algorithm/planning/gas_diffusion_astar.py":
        required_fragments = (
            "from .astar_path_planner import AStarPathPlanner",
            "from .factory_layout import FactoryLayout, Point, _edge_key",
            "from .gas_catalog import GAS_PROPERTIES_MAP, GasProperties, GasType, get_gas_types_info",
            "from .integrated_escape_system import DiffusionSource, IntegratedEscapeSystem",
            "from .legacy_diffusion_model import ClassicGaussianPlumeModel, DiffusionConfig, DiffusionResult",
            "LEGACY_REGRESSION_ONLY = True",
            "PUBLIC_SERVICE_EXPOSED = False",
            'PRIMARY_DIFFUSION_MODULE = "algorithm.diffusion.phase1_diffusion"',
            'PRIMARY_PLANNING_MODULE = "algorithm.planning.dstar_lite"',
            "def _require_point",
            '_require_point(data, "startPoint")',
            '_require_point(data, "leakPoint")',
        )
        forbidden_fragments = (
            "class FactoryLayout",
            "class Building",
            "class AStarPathPlanner",
            "heapq",
            "class DiffusionConfig",
            "class DiffusionResult",
            "class ClassicGaussianPlumeModel",
            "deep_sensor_response",
            "ConditionedAdvectionParams",
            "_STABILITY_INT_TO_PASQUILL",
            "class DiffusionSource",
            "class IntegratedEscapeSystem",
            "def build_danger_road_mask",
            "def plan_escape_for_building",
            "def validate_map_and_routes",
            "class GasType",
            "class GasProperties",
            "GAS_PROPERTIES_MAP: Dict",
            "def _pt_key",
            "def find_nearest_safe_main_exit",
            "def get_gas_types_info",
            'data.get("startPoint",',
            'data.get("leakPoint",',
            "from .deep_learning",
            "from .diffusion",
        )
        missing_fragments = [fragment for fragment in required_fragments if fragment not in text]
        bad_fragments = [fragment for fragment in forbidden_fragments if fragment in text]
        if missing_fragments or bad_fragments:
            findings.append(
                Finding(
                    path=path,
                    rule="gas-path-required-points",
                    detail=f"gas-path implementation must reject missing scenario points and use package-relative imports: missing={missing_fragments}, forbidden={bad_fragments}",
                )
            )

    if path == "algorithm/planning/integrated_escape_system.py":
        required_fragments = (
            "class DiffusionSource",
            "class IntegratedEscapeSystem",
            "def build_sources",
            "def build_danger_road_mask",
            "def compute_diffusion_snapshot",
            "def plan_escape_for_building",
            "def validate_map_and_routes",
            "from .legacy_diffusion_model import ClassicGaussianPlumeModel, DiffusionConfig",
            "LEGACY_REGRESSION_ONLY = True",
            "PUBLIC_SERVICE_EXPOSED = False",
            'PRIMARY_DIFFUSION_MODULE = "algorithm.diffusion.phase1_diffusion"',
            'PRIMARY_PLANNING_MODULE = "algorithm.planning.dstar_lite"',
        )
        missing_fragments = [fragment for fragment in required_fragments if fragment not in text]
        if missing_fragments:
            findings.append(
                Finding(
                    path=path,
                    rule="algorithm-integrated-escape-boundary",
                    detail=f"integrated escape module must own legacy orchestration: {missing_fragments}",
                )
            )

    if path == "algorithm/planning/legacy_diffusion_model.py":
        required_fragments = (
            "class DiffusionConfig",
            "class DiffusionResult",
            "class ClassicGaussianPlumeModel",
            "deep_sensor_response",
            "ConditionedAdvectionParams",
            "_STABILITY_INT_TO_PASQUILL",
            "LEGACY_REGRESSION_ONLY = True",
            "PUBLIC_SERVICE_EXPOSED = False",
            'PRIMARY_DIFFUSION_MODULE = "algorithm.diffusion.phase1_diffusion"',
        )
        missing_fragments = [fragment for fragment in required_fragments if fragment not in text]
        if missing_fragments:
            findings.append(
                Finding(
                    path=path,
                    rule="algorithm-legacy-diffusion-boundary",
                    detail=f"legacy diffusion module must own diffusion config and model wrapper: {missing_fragments}",
                )
            )

    if path == "algorithm/planning/astar_path_planner.py":
        required_fragments = (
            "class AStarPathPlanner",
            "def find_path",
            "def find_nearest_safe_main_exit",
            "heapq.heappush",
            "from .factory_layout import FactoryLayout, Point, _dist, _edge_key",
        )
        missing_fragments = [fragment for fragment in required_fragments if fragment not in text]
        if missing_fragments:
            findings.append(
                Finding(
                    path=path,
                    rule="algorithm-astar-planner-boundary",
                    detail=f"A* planner module must own route search implementation: {missing_fragments}",
                )
            )

    if path == "algorithm/planning/factory_layout.py":
        required_fragments = (
            "class Building",
            "class FactoryLayout",
            "def _dist",
            "def _pt_key",
            "def _edge_key",
            "def export_map_data",
        )
        missing_fragments = [fragment for fragment in required_fragments if fragment not in text]
        if missing_fragments:
            findings.append(
                Finding(
                    path=path,
                    rule="algorithm-factory-layout-boundary",
                    detail=f"factory layout module must own road graph and building metadata: {missing_fragments}",
                )
            )

    if path == "algorithm/planning/gas_catalog.py":
        required_fragments = (
            "class GasType",
            "class GasProperties",
            "GAS_PROPERTIES_MAP: Dict[GasType, GasProperties]",
            "def get_gas_types_info",
        )
        missing_fragments = [fragment for fragment in required_fragments if fragment not in text]
        if missing_fragments:
            findings.append(
                Finding(
                    path=path,
                    rule="algorithm-gas-catalog-boundary",
                    detail=f"gas catalog must own gas type and properties metadata: {missing_fragments}",
                )
            )

    if path == "algorithm/polo.py":
        required_fragments = (
            "success_response",
            "error_response",
            "@app.exception_handler(StarletteHTTPException)",
            "modelVersion",
            'models" / "manifest.json',
            'str(_REPOSITORY_ROOT / "models" / "yolo11m.pt")',
            "detectionSchemaVersion",
            '"detections": detections',
            '"bbox"',
            '"confidence"',
            '"frameIndex"',
            '"capturedAt"',
            '"requestId": request_id',
            '"inputSummary"',
            '"payloadDigest"',
            "def _payload_digest",
            "def _bytes_digest",
            "def _ensure_input_summary_digest",
            'summary["payloadDigest"] = _payload_digest(summary)',
            '"algorithm"',
            '"runtime"',
            '"errors"',
            '"grayRelease"',
            '"fallback"',
            '"strategy": "NONE"',
            '"channel": "stable"',
            '"trafficPercent": 100',
            '"rollbackTarget": model_identity["modelVersion"]',
            "yolo_inference_completed",
            "yolo_inference_failed",
            '"grayChannel": payload["grayRelease"]["channel"]',
            '"grayTrafficPercent": payload["grayRelease"]["trafficPercent"]',
            '"grayEnabled": payload["grayRelease"]["enabled"]',
            '"rollbackTarget": payload["grayRelease"]["rollbackTarget"]',
            '"grayChannel": response_payload["grayRelease"]["channel"]',
            '"grayTrafficPercent": response_payload["grayRelease"]["trafficPercent"]',
            '"grayEnabled": response_payload["grayRelease"]["enabled"]',
            '"rollbackTarget": response_payload["grayRelease"]["rollbackTarget"]',
            '"fallbackUsed": payload["fallback"]["used"]',
            '"fallbackUsed": response_payload["fallback"]["used"]',
            '"fallbackStrategy": response_payload["fallback"]["strategy"]',
            '"fallbackReason": response_payload["fallback"]["reason"]',
            '"errors": [message]',
            '"errors": []',
            "yolo_error_response",
            "async def health_check(request: Request)",
            '"name": "yolo-health"',
            '"algorithmVersion": model_identity["modelVersion"]',
            '"configVersion": _YOLO_CONFIG_VERSION',
            '"costMs": cost_ms',
            '"worker": socket.gethostname()',
            'content["data"] = payload',
        )
        forbidden_fragments = (
            'os.getenv("YOLO_MODEL_PATH", "yolo11m.pt")',
            '"success": False,\n        "requestId": resolved_request_id',
            '"status": "ok",\n        "success": True',
            '"success": True,\n        "requestId": request_id',
        )
        missing_fragments = [fragment for fragment in required_fragments if fragment not in text]
        bad_fragments = [fragment for fragment in forbidden_fragments if fragment in text]
        if missing_fragments or bad_fragments:
            findings.append(
                Finding(
                    path=path,
                    rule="algorithm-response-envelope",
                    detail=(
                        "YOLO service must use the shared algorithm response envelope "
                        f"without data.success compatibility fields: missing={missing_fragments}, "
                        f"forbidden={bad_fragments}"
                    ),
                )
            )
        direct_trace_fragments = (
            '"algorithmVersion": model_identity["modelVersion"]',
            '"configVersion": _YOLO_CONFIG_VERSION',
            '"costMs": cost_ms',
            '"worker": socket.gethostname()',
        )
        missing_direct_counts = [
            fragment for fragment in direct_trace_fragments if text.count(fragment) < 3
        ]
        if missing_direct_counts:
            findings.append(
                Finding(
                    path=path,
                    rule="algorithm-response-direct-trace-fields",
                    detail=(
                        "YOLO health, success, and error payloads must all expose direct "
                        f"algorithm trace fields: {missing_direct_counts}"
                    ),
                )
            )

    if path == "frontend/src/views/smart_map/useSmartMapYolo.ts":
        required_fragments = (
            "from '@/api/analysis'",
            "YoloAnalysisData",
            "YoloAlgorithmMeta",
            "YoloDetection",
            "YoloRuntimeMeta",
            "export type YoloCaptureResult = YoloAnalysisData",
        )
        forbidden_fragments = (
            "export interface YoloDetectionBbox",
            "export interface YoloDetection",
            "export interface YoloRuntimeMeta",
            "export interface YoloAlgorithmMeta",
            "export interface YoloCaptureResult",
        )
        missing_fragments = [fragment for fragment in required_fragments if fragment not in text]
        bad_fragments = [fragment for fragment in forbidden_fragments if fragment in text]
        if missing_fragments or bad_fragments:
            findings.append(
                Finding(
                    path=path,
                    rule="frontend-yolo-shared-response-types",
                    detail=(
                        "smart_map must reuse shared YOLO API response types instead of copying "
                        f"a private response contract: missing={missing_fragments}, forbidden={bad_fragments}"
                    ),
                )
            )

    if path == "backend/src/main/java/com/at/service/ImageAnalysisService.java":
        required_fragments = (
            'headers.set("X-Request-Id", RequestContext.requestIdForResponse())',
            "normalizeAlgorithmResponse",
            'rawResponse.getBoolean("ok")',
            'rawResponse.getInteger("code")',
        )
        forbidden_fragments = (
            'rawResponse.containsKey("success")',
            'rawResponse.getBoolean("success")',
            'rawResponse.getString("error")',
        )
        missing_fragments = [fragment for fragment in required_fragments if fragment not in text]
        bad_fragments = [fragment for fragment in forbidden_fragments if fragment in text]
        if missing_fragments or bad_fragments:
            findings.append(
                Finding(
                    path=path,
                    rule="yolo-request-trace-propagation",
                    detail=(
                        "YOLO proxy must propagate request trace id and unwrap the current "
                        f"ok/code algorithm envelope: missing={missing_fragments}, forbidden={bad_fragments}"
                    ),
                )
            )

    if path in {
        "backend/src/main/java/com/at/controller/ImageAnalysisController.java",
        "backend/src/main/java/com/at/service/ImageAnalysisService.java",
    }:
        if "recordSaved" in text:
            findings.append(
                Finding(
                    path=path,
                    rule="yolo-partial-success-contract",
                    detail="YOLO analysis endpoint must not express persistence failure through recordSaved",
                )
            )

    if path in {"frontend/src/views/yolo/Home.vue", "frontend/src/views/car/CarHome.vue"} and "recordSaved" in text:
        findings.append(
            Finding(
                path=path,
                rule="yolo-partial-success-contract",
                detail="frontend must not depend on recordSaved partial-success payload",
            )
        )

    if path == "frontend/src/api/algorithm.ts":
        forbidden_fragments = (
            "post<unknown, AlgorithmResponse",
            "get<unknown, AlgorithmResponse",
            "AlgorithmResponse>",
            "runGasPathScenario",
            "runGasTimeSeriesScenario",
            "GasPathResult",
            "TimeSeriesDiffusionResult",
            "'/api/gas-path'",
            "'/api/time-series'",
        )
        bad_fragments = [fragment for fragment in forbidden_fragments if fragment in text]
        if bad_fragments:
            findings.append(
                Finding(
                    path=path,
                    rule="frontend-algorithm-api-types",
                    detail=f"algorithm API wrapper must return typed AlgorithmResponse<T>: {bad_fragments}",
                )
            )
        required_fragments = (
            "AlgorithmTraceFields",
            "AlgorithmHealth extends AlgorithmTraceFields",
            "DiffusionSimulationResult extends AlgorithmRecord, AlgorithmTraceFields",
            "SourceInversionResult extends AlgorithmRecord, AlgorithmTraceFields",
            "EvacuationPlanningResult extends AlgorithmRecord, AlgorithmTraceFields",
        )
        missing_fragments = [fragment for fragment in required_fragments if fragment not in text]
        if missing_fragments:
            findings.append(
                Finding(
                    path=path,
                    rule="frontend-algorithm-trace-types",
                    detail=f"algorithm API result types must expose trace metadata: {missing_fragments}",
                )
            )

    if path == "frontend/src/api/analysis.ts":
        required_fragments = (
            "YoloInputSummary = AlgorithmInputSummary",
            "status?: string",
            "runtime?: YoloRuntimeMeta",
            "inputSummary?: YoloInputSummary",
        )
        forbidden_fragments = (
            "success?: boolean",
            "recordSaved",
        )
        missing_fragments = [fragment for fragment in required_fragments if fragment not in text]
        bad_fragments = [fragment for fragment in forbidden_fragments if fragment in text]
        if missing_fragments or bad_fragments:
            findings.append(
                Finding(
                    path=path,
                    rule="frontend-yolo-response-types",
                    detail=(
                        "YOLO frontend types must model the current traceable data payload without "
                        f"legacy success/recordSaved fields: missing={missing_fragments}, forbidden={bad_fragments}"
                    ),
                )
            )

    if path == "backend/src/main/java/com/at/service/ImageAnalysisService.java":
        required_fragments = (
            'throw new ImageAnalysisException(500, "算法服务响应缺少统一信封")',
            "rawResponse.containsKey(\"data\")",
            "rawResponse.containsKey(\"ok\")",
            "rawResponse.containsKey(\"code\")",
        )
        forbidden_fragments = (
            "return rawResponse;",
        )
        missing_fragments = [fragment for fragment in required_fragments if fragment not in text]
        bad_fragments = [fragment for fragment in forbidden_fragments if fragment in text]
        if missing_fragments or bad_fragments:
            findings.append(
                Finding(
                    path=path,
                    rule="backend-yolo-shared-envelope-only",
                    detail=(
                        "Java YOLO proxy must reject legacy bare payloads and require the shared envelope: "
                        f"missing={missing_fragments}, forbidden={bad_fragments}"
                    ),
                )
            )

    if path == "backend/src/test/java/com/at/service/ImageAnalysisServiceTest.java":
        required_fragments = (
            "normalizeAlgorithmResponseRejectsLegacyBarePayload",
            "算法服务响应缺少统一信封",
            "normalizeAlgorithmResponseUnwrapsSharedEnvelope",
            "normalizeAlgorithmResponseRejectsFailedEnvelope",
        )
        forbidden_fragments = (
            "normalizeAlgorithmResponseKeepsLegacyBarePayload",
        )
        missing_fragments = [fragment for fragment in required_fragments if fragment not in text]
        bad_fragments = [fragment for fragment in forbidden_fragments if fragment in text]
        if missing_fragments or bad_fragments:
            findings.append(
                Finding(
                    path=path,
                    rule="backend-yolo-shared-envelope-only",
                    detail=(
                        "ImageAnalysisService tests must reject legacy bare payloads: "
                        f"missing={missing_fragments}, forbidden={bad_fragments}"
                    ),
                )
            )

    if path == "frontend/src/api/algorithmClient.ts":
        required_fragments = (
            "onRejected: (error) =>",
            "return Promise.reject(normalizedError)",
            "normalizedError.response = response",
            "normalizedError.cause = error",
        )
        forbidden_fragments = (
            "as AlgorithmResponse",
            "return {",
            "success: false",
            "ok: false",
        )
        missing_fragments = [fragment for fragment in required_fragments if fragment not in text]
        bad_fragments = [fragment for fragment in forbidden_fragments if fragment in text]
        if missing_fragments or bad_fragments:
            findings.append(
                Finding(
                    path=path,
                    rule="frontend-algorithm-client-error-semantics",
                    detail=(
                        "algorithmClient must reject transport failures instead of resolving a fake "
                        f"AlgorithmResponse: missing={missing_fragments}, forbidden={bad_fragments}"
                    ),
                )
            )

    if path == "frontend/src/types/api.ts":
        required_fragments = (
            "export type AlgorithmResponse<T = unknown> = ApiResult<T | null>",
            "AlgorithmTraceFields",
            "AlgorithmIdentityMeta",
            "AlgorithmRuntimeMeta",
            "AlgorithmInputSummary",
            "AlgorithmFallbackMeta",
            "AlgorithmGrayReleaseMeta",
            "requestId?: string",
            "runtime?: AlgorithmRuntimeMeta",
            "errors?: string[]",
            "algorithmVersion?: string",
            "configVersion?: string",
            "costMs?: number",
            "grayRelease?: AlgorithmGrayReleaseMeta",
            "fallback?: AlgorithmFallbackMeta",
        )
        forbidden_fragments = (
            "interface AlgorithmResponse",
            "success: boolean",
        )
        missing_fragments = [fragment for fragment in required_fragments if fragment not in text]
        bad_fragments = [fragment for fragment in forbidden_fragments if fragment in text]
        if missing_fragments or bad_fragments:
            findings.append(
                Finding(
                    path=path,
                    rule="frontend-algorithm-trace-types",
                    detail=(
                        "shared API types must define algorithm trace metadata without old "
                        f"outer success/error compatibility: missing={missing_fragments}, forbidden={bad_fragments}"
                    ),
                )
            )

    if path == "frontend/src/views/emergency/index.vue":
        required_fragments = (
            "{ code, message, data, ok, requestId }",
            "response?.ok === true || response?.code === 200",
            "疏散业务对象用 isReachable 表达可达性",
            "routeReachable",
            "adaptedResult?.isReachable !== false",
        )
        forbidden_fragments = (
            "{ code, message, data, success, error }",
            "success/error 始终取自信封本身",
            "response?.success",
            "response?.error",
            "LEGACY_ROUTE_SUCCESS_FIELD",
            "success?: boolean",
            "route.success",
            "adaptedResult?.success",
        )
        missing_fragments = [fragment for fragment in required_fragments if fragment not in text]
        bad_fragments = [fragment for fragment in forbidden_fragments if fragment in text]
        if missing_fragments or bad_fragments:
            findings.append(
                Finding(
                    path=path,
                    rule="frontend-algorithm-envelope-ok-contract",
                    detail=(
                        "emergency page must unwrap algorithm envelopes via ok/code, not legacy "
                        f"outer success/error: missing={missing_fragments}, forbidden={bad_fragments}"
                    ),
                )
            )

    if path == "frontend/src/views/smart_map/useSmartMapAlgorithmExecutors.ts":
        required_fragments = (
            "function responseOk",
            "response?.ok === true || response?.code === 200",
        )
        forbidden_fragments = (
            "response.success",
            "response?.success",
        )
        missing_fragments = [fragment for fragment in required_fragments if fragment not in text]
        bad_fragments = [fragment for fragment in forbidden_fragments if fragment in text]
        if missing_fragments or bad_fragments:
            findings.append(
                Finding(
                    path=path,
                    rule="frontend-algorithm-envelope-ok-contract",
                    detail=(
                        "smart_map algorithm executors must use ok/code for the outer envelope: "
                        f"missing={missing_fragments}, forbidden={bad_fragments}"
                    ),
                )
            )

    smart_map_evacuation_checks = {
        "frontend/src/views/smart_map/useSmartMapEvacuationPlanning.ts": (
            (
                "isReachable?: boolean",
                "hasAnyReachable?: boolean",
                "reachableCount?: number",
                "route.isReachable",
            ),
            (
                "success?: boolean",
                "hasAnySuccess?: boolean",
                "successCount?: number",
                "route.success",
            ),
        ),
        "frontend/src/views/smart_map/useSmartMapEvacuationPlanningActions.ts": (
            (
                "normalizeEvacuationRoute",
                "normalizeEvacuationBatch",
                "result?.isReachable",
                "result?.hasAnyReachable",
                "result.reachableCount",
                "evacuationPlan.value?.isReachable",
            ),
            (
                "success?: boolean",
                "LEGACY_ROUTE_SUCCESS_FIELD",
                "LEGACY_BATCH_HAS_ANY_SUCCESS_FIELD",
                "LEGACY_BATCH_SUCCESS_COUNT_FIELD",
                "result?.success",
                "result?.hasAnySuccess",
                "result.successCount",
                "evacuationPlan.value?.success",
                "as SmartMapEvacuationRoute | null",
                "as SmartMapEvacuationBatchResult | null",
            ),
        ),
        "frontend/src/views/smart_map/useSmartMapEvacuationRouteCanvas.ts": (
            (
                "route.isReachable",
                "item.isReachable",
            ),
            (
                "route.success",
                "item.success",
            ),
        ),
        "frontend/src/views/smart_map/useSmartMapWorkflowSteps.ts": (
            (
                "isReachable?: boolean",
                "value?.isReachable",
            ),
            (
                "success?: boolean",
                "value?.success",
            ),
        ),
    }
    smart_map_evacuation_check = smart_map_evacuation_checks.get(path)
    if smart_map_evacuation_check:
        required_fragments, forbidden_fragments = smart_map_evacuation_check
        missing_fragments = [fragment for fragment in required_fragments if fragment not in text]
        bad_fragments = [fragment for fragment in forbidden_fragments if fragment in text]
        if missing_fragments or bad_fragments:
            findings.append(
                Finding(
                    path=path,
                    rule="smart-map-evacuation-reachability-contract",
                    detail=(
                        "smart_map must keep route reachability separate from legacy algorithm "
                        f"success payload fields: missing={missing_fragments}, forbidden={bad_fragments}"
                    ),
                )
            )

    if path == "frontend/src/views/smart_map/useSmartMapValidationReports.ts" and "envelope.success" in text:
        findings.append(
            Finding(
                path=path,
                rule="frontend-algorithm-envelope-ok-contract",
                detail="validation report loader must not accept legacy outer envelope.success",
            )
        )

    if path == "frontend/src/views/smart_map/useSmartMapInversion.ts":
        required_fragments = (
            "classifyObservationSource",
            "buildObservationSourceSummary",
            "SMART_MAP_FORMAL_VALIDATION_POLICY",
            "requires_trusted_sensor_reading",
            "observationSourceSummary",
            "formalValidationAllowed",
            "simulation_or_manual_only",
            "contains_non_simulated_sensor_reading_needs_audit",
            "auditedSensorReadingCount",
            "hasAuditedSensorReadings",
            "后端非仿真读数（需来源审计）",
            "trustedForRealValidation: false",
            "仿真/手工/待审计，不可作真实验证",
            "sensor_reading",
            "sensor_reading_simulated",
            "qualityStatus",
            "SIMULATED",
            "当前观测 payload 仅包含仿真/手工读数",
            "当前观测 payload 含后端非仿真读数，但仓库未接入真实硬件链路",
        )
        missing_fragments = [fragment for fragment in required_fragments if fragment not in text]
        forbidden_fragments = (
            "后端真实传感器读数",
            "含真实传感器读数",
            "mixed_or_real_sensor_reading",
            "realSensorReadingCount",
            "hasRealSensorReadings",
            "trustedForRealValidation: true",
            "实测${",
        )
        bad_fragments = [fragment for fragment in forbidden_fragments if fragment in text]
        if missing_fragments or bad_fragments:
            findings.append(
                Finding(
                    path=path,
                    rule="smart-map-observation-source-contract",
                    detail=(
                        "smart_map observation payload must preserve simulated/manual/audited source semantics: "
                        f"missing={missing_fragments}, forbidden={bad_fragments}"
                    ),
                )
            )
    if path == "startup.bat":
        required_fragments = (
            'call :require_file "%ROOT%\\algorithm\\api_server.py"',
            'call :require_file "%ROOT%\\algorithm\\polo.py"',
            'call :require_file "%ROOT%\\algorithm\\service_config.py"',
            'set "MYSQL_PORT=3307"',
            'set "UV_CMD=uv.exe"',
            'set "UV_CMD=%USERPROFILE%\\.local\\bin\\uv.exe"',
            'call :command_exists "%UV_CMD%" "uv"',
            'call :start_uvicorn_service "%ALGORITHM_PORT%" "Algorithm API" "algorithm.api_server:app"',
            'call :start_uvicorn_service "%YOLO_PORT%" "YOLO Person API" "algorithm.polo:app"',
            'run --python ""%PYTHON_CMD%"" uvicorn %UVICORN_APP%',
        )
        forbidden_fragments = (
            '"%PYTHON_CMD%" "-m uvicorn algorithm.api_server:app',
            '"%PYTHON_CMD%" "-m uvicorn algorithm.polo:app',
        )
        missing_fragments = [fragment for fragment in required_fragments if fragment not in text]
        bad_fragments = [fragment for fragment in forbidden_fragments if fragment in text]
        if missing_fragments or bad_fragments:
            findings.append(
                Finding(
                    path=path,
                    rule="startup-script-current-entrypoints",
                    detail=(
                        "startup.bat must validate current algorithm entrypoints and run "
                        f"algorithm services through uv with the resolved Python: missing={missing_fragments}, "
                        f"forbidden={bad_fragments}"
                    ),
            )
        )
    if path == "start.bat":
        required_fragments = (
            'cd /d "%~dp0"',
            'call "%~dp0startup.bat" %*',
        )
        forbidden_fragments = (
            "uvicorn",
            "mvn",
            "npm",
            "docker",
        )
        missing_fragments = [fragment for fragment in required_fragments if fragment not in text]
        bad_fragments = [fragment for fragment in forbidden_fragments if fragment in text.lower()]
        if missing_fragments or bad_fragments:
            findings.append(
                Finding(
                    path=path,
                    rule="start-script-forwards-to-startup",
                    detail=f"start.bat must stay a compatibility wrapper for startup.bat: missing={missing_fragments}, forbidden={bad_fragments}",
                )
            )
    if path == "docs/login-startup-troubleshooting.md":
        required_fragments = (
            "127.0.0.1:3307",
            '$env:ALGORITHM_REQUIRE_AUTH="true"',
            '$env:ALGORITHM_API_KEY="<本地随机算法密钥>"',
            '$env:SPRING_DATASOURCE_URL="jdbc:mysql://127.0.0.1:3307/chemical?useSSL=false"',
        )
        forbidden_fragments = (
            "优先复用本机 `3306`",
            "LocalPort -eq 3306",
            "--port=3306",
        )
        missing_fragments = [fragment for fragment in required_fragments if fragment not in text]
        bad_fragments = [fragment for fragment in forbidden_fragments if fragment in text]
        if missing_fragments or bad_fragments:
            findings.append(
                Finding(
                    path=path,
                    rule="startup-doc-current-local-contract",
                    detail=f"startup troubleshooting doc must match local script ports and auth: missing={missing_fragments}, forbidden={bad_fragments}",
                )
            )
    return findings


def check_model_manifest(repo_root: Path) -> list[Finding]:
    path = "models/manifest.json"
    manifest_path = repo_root / path
    if not manifest_path.exists():
        return [
            Finding(
                path=path,
                rule="model-manifest-present",
                detail="models must have a tracked manifest for version governance",
            )
        ]
    text = manifest_path.read_text(encoding="utf-8", errors="replace")
    required_fragments = (
        '"schemaVersion": "model-manifest/v1"',
        '"id": "yolo11m-person-detector"',
        '"version":',
        '"artifactTrackedInGit": false',
        '"validationStatus": "missing-real-project-labeled-set"',
    )
    missing_fragments = [fragment for fragment in required_fragments if fragment not in text]
    if missing_fragments:
        return [
            Finding(
                path=path,
                rule="model-manifest-complete",
                detail=f"model manifest is missing required governance anchors: {missing_fragments}",
            )
        ]
    return []


def check_yolo_install_docs(repo_root: Path) -> list[Finding]:
    required = {
        "README.md": ("uv sync --extra yolo", "8001", "8100 独立模型推理容器"),
        "docs/development-guide.md": ("uv sync --extra yolo", "algorithm.polo:app", "8001"),
        "docs/项目总体要求.md": ("YOLO 人员识别服务 | 8001", "统一模型推理服务 | 8100 | 未来规划"),
    }
    findings: list[Finding] = []
    for path, fragments in required.items():
        text = (repo_root / path).read_text(encoding="utf-8", errors="replace")
        missing_fragments = [fragment for fragment in fragments if fragment not in text]
        if missing_fragments:
            findings.append(
                Finding(
                    path=path,
                    rule="yolo-install-and-port-docs",
                    detail=f"YOLO install/port docs are missing: {missing_fragments}",
                )
            )
    return findings


def check_deploy_env_docs(repo_root: Path) -> list[Finding]:
    required = {
        "README.md": (
            "MYSQL_ROOT_PASSWORD=replace_with_strong_mysql_root_password",
            "MYSQL_APP_PASSWORD=replace_with_strong_app_password",
            "JWT_SECRET=replace_with_random_32_char_min_secret",
            "ALGORITHM_API_KEY=replace_with_random_algorithm_key",
            "ANALYSIS_SERVICE_URL=http://yolo:8001/api/analysis/person",
            "YOLO_MODEL_PATH=/app/models/yolo11m.pt",
        ),
        "deploy/README.md": (
            "MYSQL_APP_PASSWORD=replace_with_strong_app_password",
            "ANALYSIS_SERVICE_URL=http://yolo:8001/api/analysis/person",
            "YOLO_MODEL_PATH=/app/models/yolo11m.pt",
        ),
        "deploy/.env.example": (
            "MYSQL_APP_PASSWORD=replace_with_strong_app_password",
            "ANALYSIS_SERVICE_URL=http://yolo:8001/api/analysis/person",
            "YOLO_MODEL_PATH=/app/models/yolo11m.pt",
        ),
    }
    forbidden = {
        "README.md": ("analysis-service:8100", "ANALYSIS_SERVICE_URL=http://analysis-service:8100"),
        "deploy/README.md": ("analysis-service:8100", "ANALYSIS_SERVICE_URL=http://analysis-service:8100"),
        "deploy/.env.example": ("analysis-service:8100", "ANALYSIS_SERVICE_URL=http://analysis-service:8100"),
    }
    findings: list[Finding] = []
    for path, fragments in required.items():
        text = (repo_root / path).read_text(encoding="utf-8", errors="replace")
        missing_fragments = [fragment for fragment in fragments if fragment not in text]
        bad_fragments = [fragment for fragment in forbidden.get(path, ()) if fragment in text]
        if missing_fragments or bad_fragments:
            findings.append(
                Finding(
                    path=path,
                    rule="deploy-env-docs-current",
                    detail=(
                        "deployment env docs must match deploy/.env.example and compose: "
                        f"missing={missing_fragments}, forbidden={bad_fragments}"
                    ),
                )
            )
    return findings


def check_docs_readme_self_check(repo_root: Path) -> list[Finding]:
    path = "docs/README.md"
    text = (repo_root / path).read_text(encoding="utf-8", errors="replace")
    findings: list[Finding] = []
    if 'rg -n "localhost|Manage|Back|python/"' in text:
        findings.append(
            Finding(
                path=path,
                rule="docs-self-check-noisy-grep",
                detail="docs README must not recommend a broad grep that matches legitimate docs",
            )
        )
    required_fragments = (
        "python tools/code_quality_audit.py",
        "--glob '!docs/README.md'",
        "<原始文件本地路径>|test_calibration.py",
        "最后一条命令应无输出",
    )
    missing_fragments = [fragment for fragment in required_fragments if fragment not in text]
    if missing_fragments:
        findings.append(
            Finding(
                path=path,
                rule="docs-self-check-targeted",
                detail=f"docs README self-check is missing targeted checks: {missing_fragments}",
            )
        )
    return findings


def check_assets_readme_current(repo_root: Path) -> list[Finding]:
    path = "assets/README.md"
    text = (repo_root / path).read_text(encoding="utf-8", errors="replace")
    bad_fragments = [fragment for fragment in ("assets/images/",) if fragment in text]
    if bad_fragments:
        return [
            Finding(
                path=path,
                rule="assets-readme-current-tree",
                detail=f"assets README must not document nonexistent asset folders: {bad_fragments}",
            )
        ]
    return []


def check_tool_dry_run_contracts(repo_root: Path) -> list[Finding]:
    checks = {
        "tools/generate_real_sensor_seed.py": (
            ("--write", "if not args.write", "dry-run: would write"),
            (),
        ),
        "tools/generate_real_map_assets.py": (
            ("--write", "if args.write", "dry-run: would write map asset"),
            (
                "meta = downsample_tiled_tiff(args.src, args.dst, args.factor, args.quality)\n"
                "    args.meta.parent.mkdir",
            ),
        ),
        "tools/prepare_btex_training_data.py": (
            ("--write", "if args.write", "dry-run: would write BTEX processed CSV and manifest"),
            ("training.to_csv(training_path, index=False)\n    censored.to_csv",),
        ),
        "tools/prepare_prairie_grass_source_validation_data.py": (
            ("--write", "if args.write", "dry-run: would write Prairie Grass processed CSV and manifest"),
            ("args.output_path.parent.mkdir(parents=True, exist_ok=True)\n    with args.output_path.open",),
        ),
    }
    readme_text = (repo_root / "tools/README.md").read_text(encoding="utf-8", errors="replace")
    findings: list[Finding] = []
    for path, (required_fragments, forbidden_fragments) in checks.items():
        text = (repo_root / path).read_text(encoding="utf-8", errors="replace")
        missing_fragments = [fragment for fragment in required_fragments if fragment not in text]
        bad_fragments = [fragment for fragment in forbidden_fragments if fragment in text]
        if Path(path).name not in readme_text or "默认 dry-run" not in readme_text:
            missing_fragments.append("tools README dry-run entry")
        if missing_fragments or bad_fragments:
            findings.append(
                Finding(
                    path=path,
                    rule="tool-dry-run-contract",
                    detail=(
                        "tools that modify repository files must default to dry-run and require --write: "
                        f"missing={missing_fragments}, forbidden={bad_fragments}"
                    ),
                )
            )
    return findings


def check_database_migration_assets(repo_root: Path) -> list[Finding]:
    findings: list[Finding] = []
    migration_path = "db/migrations/001_add_user_role.sql"
    audit_migration_path = "db/migrations/002_add_core_audit_columns.sql"
    monitor_point_migration_path = "db/migrations/003_extend_monitor_point_semantics.sql"
    migration_file = repo_root / migration_path
    audit_migration_file = repo_root / audit_migration_path
    monitor_point_migration_file = repo_root / monitor_point_migration_path
    manifest_text = (repo_root / "db/manifest.json").read_text(encoding="utf-8", errors="replace")
    readme_text = (repo_root / "db/README.md").read_text(encoding="utf-8", errors="replace")
    migration_readme_text = (repo_root / "db/migrations/README.md").read_text(encoding="utf-8", errors="replace")

    if not migration_file.exists() or not audit_migration_file.exists() or not monitor_point_migration_file.exists():
        missing_files = [
            path
            for path, file_path in (
                (migration_path, migration_file),
                (audit_migration_path, audit_migration_file),
                (monitor_point_migration_path, monitor_point_migration_file),
            )
            if not file_path.exists()
        ]
        findings.append(
            Finding(
                path="db/migrations",
                rule="database-migration-assets",
                detail=f"db/migrations must contain canonical migration scripts, not only README files: missing={missing_files}",
            )
        )
        return findings

    migration_text = migration_file.read_text(encoding="utf-8", errors="replace")
    audit_migration_text = audit_migration_file.read_text(encoding="utf-8", errors="replace")
    monitor_point_migration_text = monitor_point_migration_file.read_text(encoding="utf-8", errors="replace")
    required_migration_fragments = (
        "Migration 001: add role column to user table",
        "ALTER TABLE `user` ADD COLUMN `role`",
        "Do not bulk-promote existing users",
    )
    missing_migration = [
        fragment for fragment in required_migration_fragments if fragment not in migration_text
    ]
    required_manifest_fragments = (
        '"path": "db/migrations/001_add_user_role.sql"',
        '"path": "db/migrations/002_add_core_audit_columns.sql"',
        '"path": "db/migrations/003_extend_monitor_point_semantics.sql"',
        '"type": "migration"',
        '"type": "deployment-compat-migration"',
    )
    missing_manifest = [
        fragment for fragment in required_manifest_fragments if fragment not in manifest_text
    ]
    required_readme_fragments = (
        "`db/migrations/001_add_user_role.sql`",
        "`db/migrations/002_add_core_audit_columns.sql`",
        "`db/migrations/003_extend_monitor_point_semantics.sql`",
        "当前规范迁移入口为",
        "为核心表补来源、创建时间和更新时间字段",
        "监测点对象",
        "部署兼容迁移",
    )
    combined_readmes = readme_text + "\n" + migration_readme_text
    missing_readme = [
        fragment for fragment in required_readme_fragments if fragment not in combined_readmes
    ]
    required_audit_migration_fragments = (
        "Migration 002: add audit/source columns to core tables",
        "CALL add_column_if_missing('patrol_car', 'source'",
        "CALL add_column_if_missing('warning_history', 'updated_at'",
        "CALL add_column_if_missing('monitor_point', 'source_type'",
    )
    missing_audit_migration = [
        fragment for fragment in required_audit_migration_fragments if fragment not in audit_migration_text
    ]
    required_monitor_point_migration_fragments = (
        "Extend monitor_point from a name-only directory entry",
        "CALL add_column_if_missing('monitor_point', 'area_name'",
        "CALL add_column_if_missing('monitor_point', 'source_type'",
        "CALL add_column_if_missing('monitor_point', 'sensor_id'",
        "CALL add_column_if_missing('monitor_point', 'camera_url'",
        "CALL add_column_if_missing('monitor_point', 'quality_status'",
        "quality_status = COALESCE(NULLIF(quality_status, ''), 'UNBOUND')",
    )
    missing_monitor_point_migration = [
        fragment for fragment in required_monitor_point_migration_fragments
        if fragment not in monitor_point_migration_text
    ]
    if (
        missing_migration
        or missing_audit_migration
        or missing_monitor_point_migration
        or missing_manifest
        or missing_readme
    ):
        findings.append(
            Finding(
                path="db/migrations",
                rule="database-migration-assets",
                detail=(
                    "database migration governance must have a real canonical migration asset: "
                    f"migration_missing={missing_migration}, "
                    f"audit_migration_missing={missing_audit_migration}, "
                    f"monitor_point_migration_missing={missing_monitor_point_migration}, "
                    f"manifest_missing={missing_manifest}, readme_missing={missing_readme}"
                ),
            )
        )
    return findings


def check_database_audit_columns(repo_root: Path) -> list[Finding]:
    path = "deploy/mysql/init.sql"
    text = (repo_root / path).read_text(encoding="utf-8", errors="replace")
    required_by_table = {
        "user": ("create_time", "updated_at"),
        "patrol_car": ("source", "created_at", "updated_at"),
        "sensor_layout_detail": ("created_at", "updated_at"),
        "simulation_scenario": ("source", "created_at", "updated_at"),
        "sensor_reading": ("source", "quality_status", "created_at", "updated_at"),
        "warning_history": ("source", "warning_time", "created_at", "updated_at"),
        "environment_reading": ("source", "observed_at", "created_at", "updated_at"),
        "inspect_record": ("source", "create_time", "updated_at"),
        "monitor_point": ("source_type", "area_name", "sensor_id", "camera_url", "x", "y", "quality_status", "create_time", "updated_at"),
        "employee": ("create_time", "updated_at"),
    }
    findings: list[Finding] = []
    if "ALTER TABLE `sensor` MODIFY COLUMN `id` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;" not in text:
        findings.append(
            Finding(
                path=path,
                rule="database-sensor-id-legacy-upgrade",
                detail="canonical init.sql must upgrade old local sensor.id INT schemas before sensor_reading adds a VARCHAR foreign key",
            )
        )
    for table_name, required_columns in required_by_table.items():
        match = re.search(
            rf"CREATE TABLE IF NOT EXISTS `{re.escape(table_name)}` \((?P<body>.*?)\) ENGINE=",
            text,
            re.DOTALL,
        )
        if not match:
            findings.append(
                Finding(
                    path=path,
                    rule="database-core-audit-columns",
                    detail=f"core table missing from canonical schema: {table_name}",
                )
            )
            continue
        body = match.group("body")
        missing_columns = [
            column for column in required_columns if f"`{column}`" not in body
        ]
        if missing_columns:
            findings.append(
                Finding(
                    path=path,
                    rule="database-core-audit-columns",
                    detail=f"core table {table_name} missing audit/source columns: {missing_columns}",
                )
            )
    return findings


def check_requirements_current_paths(repo_root: Path) -> list[Finding]:
    path = "docs/项目总体要求.md"
    text = (repo_root / path).read_text(encoding="utf-8", errors="replace")
    forbidden_fragments = (
        "docs/deployment-guide.md",
        "001_init.sql",
    )
    findings = [
        Finding(
            path=path,
            rule="requirements-current-paths",
            detail=f"requirements doc still references nonexistent current asset: {fragment}",
        )
        for fragment in forbidden_fragments
        if fragment in text
    ]
    required_fragments = (
        "deploy/mysql/init.sql",
        "deploy/README.md",
        "目标测试分层，未建立前不得写成现状",
    )
    missing_fragments = [fragment for fragment in required_fragments if fragment not in text]
    if missing_fragments:
        findings.append(
            Finding(
                path=path,
                rule="requirements-current-paths",
                detail=f"requirements doc is missing current path clarifications: {missing_fragments}",
            )
        )
    return findings


def check_docs_truth_contracts(repo_root: Path) -> list[Finding]:
    findings: list[Finding] = []

    equipment_path = "docs/references/equipment/设备清单.md"
    equipment_text = (repo_root / equipment_path).read_text(encoding="utf-8", errors="replace")
    required_equipment_fragments = (
        "历史建模参考文档",
        "不再作为当前运行时园区资产、传感器点位或数据库数据源",
        "frontend/src/data/realMapAssets.js",
        "deploy/mysql/init.sql",
        "docs/real-dom-map-sensor-layout.md",
    )
    forbidden_equipment_fragments = (
        "> 基于项目 `parkAssets.js` 配置数据整理",
        "frontend/src/data/realMapAssets.ts",
    )
    missing_equipment = [
        fragment for fragment in required_equipment_fragments if fragment not in equipment_text
    ]
    bad_equipment = [
        fragment for fragment in forbidden_equipment_fragments if fragment in equipment_text
    ]
    if missing_equipment or bad_equipment:
        findings.append(
            Finding(
                path=equipment_path,
                rule="equipment-doc-current-source-boundary",
                detail=(
                    "equipment inventory must be marked as historical modelling reference, not current runtime source: "
                    f"missing={missing_equipment}, forbidden={bad_equipment}"
                ),
            )
        )

    api_path = "docs/api-reference.md"
    api_text = (repo_root / api_path).read_text(encoding="utf-8", errors="replace")
    required_api_fragments = (
        "低层算法任务网关",
        "前端业务页面不得把它作为主要调用链路",
        "响应仍必须包含统一追踪字段、输入摘要、运行时、警告和失败/兜底标记",
        "面向页面的稳定链路应直接使用 `/api/diffusion/simulate`、`/api/inversion/*` 与 `/api/planning/evacuation`",
        "`/api/history/list`",
        "`/api/history/add`",
        "`/api/history/delete`",
        "`/api/analysis/summary`",
        "`/api/user/list`",
        "`/api/user/{id}`",
        "`/api/employee/list`",
        "`/api/employee/{id}`",
        "`/api/monitoring/overview`",
        "`/api/monitor-point/list`",
        "`/api/environment-reading/latest`",
        "`/api/environment-reading/recent`",
        "`/api/simulation-monitoring/scenarios/latest`",
        "`/api/simulation-monitoring/readings/recent`",
        "`/api/emergency-plan/list`",
        "`/healthz`",
        "不在 `/api` 下，不触达数据库，不需要 token",
        "当前仓库只接受 `source=simulation` 与 `qualityStatus=SIMULATED`",
        "不从 `warning_history` 回退",
    )
    forbidden_api_fragments = (
        "| POST | `/api/engine/run` | 算法引擎统一入口。 |",
        "`/api/warning/list`",
        "`/api/warning/save`",
        "`/api/warning/delete`",
    )
    missing_api = [fragment for fragment in required_api_fragments if fragment not in api_text]
    bad_api = [fragment for fragment in forbidden_api_fragments if fragment in api_text]
    if missing_api or bad_api:
        findings.append(
            Finding(
                path=api_path,
                rule="engine-run-api-boundary",
                detail=(
                    "engine/run must be documented as an internal compatibility gateway, not the primary UI chain: "
                    f"missing={missing_api}, forbidden={bad_api}"
                ),
            )
        )
    required_yolo_api_fragments = (
        "detectionSchemaVersion",
        "yolo-detection/v1",
        '"payloadDigest"',
        '"algorithm"',
        '"runtime"',
        '"grayRelease"',
        '"fallback"',
        '"strategy": "NONE"',
    )
    missing_yolo_api_fragments = [
        fragment for fragment in required_yolo_api_fragments if fragment not in api_text
    ]
    if missing_yolo_api_fragments:
        findings.append(
            Finding(
                path=api_path,
                rule="yolo-api-trace-docs",
                detail=f"API docs must show the current traceable YOLO data contract: {missing_yolo_api_fragments}",
            )
        )

    frontend_algorithm_path = "frontend/src/api/algorithm.ts"
    frontend_algorithm_text = (repo_root / frontend_algorithm_path).read_text(
        encoding="utf-8",
        errors="replace",
    )
    required_frontend_fragments = (
        "runDiffusionSimulation",
        "runAnalyticCoarseSearch",
        "runAnalyticSourceInversion",
        "runParticleFilterInversion",
        "runEvacuationPlanning",
    )
    forbidden_frontend_fragments = (
        "runEngineTask",
        "EngineTaskResult",
        "'/api/engine/run'",
        '"/api/engine/run"',
    )
    missing_frontend = [
        fragment for fragment in required_frontend_fragments if fragment not in frontend_algorithm_text
    ]
    bad_frontend = [
        fragment for fragment in forbidden_frontend_fragments if fragment in frontend_algorithm_text
    ]
    if missing_frontend or bad_frontend:
        findings.append(
            Finding(
                path=frontend_algorithm_path,
                rule="engine-run-api-boundary",
                detail=(
                    "frontend algorithm API must expose explicit task endpoints and not the internal engine/run gateway: "
                    f"missing={missing_frontend}, forbidden={bad_frontend}"
                ),
            )
        )

    return findings


def check_algorithm_map_scale_contract(repo_root: Path) -> list[Finding]:
    findings: list[Finding] = []
    path = "algorithm/planning/dstar_lite.py"
    text = (repo_root / path).read_text(encoding="utf-8", errors="replace")
    required_fragments = (
        "def resolve_map_meters_per_unit(payload: Dict) -> float:",
        'map_payload.get("mapMetersPerUnit", payload.get("mapMetersPerUnit"))',
        "map_meters_per_unit=map_meters_per_unit",
        '"mapMetersPerUnit": map_meters_per_unit',
        "distance_meters = round(world_distance * map_meters_per_unit, 2)",
        "round(access_distance * map_meters_per_unit, 2)",
        "round(road_distance * map_meters_per_unit, 2)",
    )
    forbidden_fragments = (
        "distance_meters = round(world_distance * MAP_METERS_PER_UNIT, 2)",
        "round(access_distance * MAP_METERS_PER_UNIT, 2)",
        "round(road_distance * MAP_METERS_PER_UNIT, 2)",
    )
    missing_fragments = [fragment for fragment in required_fragments if fragment not in text]
    bad_fragments = [fragment for fragment in forbidden_fragments if fragment in text]
    if missing_fragments or bad_fragments:
        findings.append(
            Finding(
                path=path,
                rule="algorithm-planning-map-scale-contract",
                detail=(
                    "D* Lite route distances must honor payload mapMetersPerUnit instead of hard-coded fallback scale: "
                    f"missing={missing_fragments}, forbidden={bad_fragments}"
                ),
            )
        )

    test_path = "algorithm/planning/test_dstar_lite.py"
    test_text = (repo_root / test_path).read_text(encoding="utf-8", errors="replace")
    required_test_fragments = (
        "test_plan_single_route_uses_payload_map_scale",
        'payload["map"] = {"mapMetersPerUnit": 1.0}',
        'assert result["distanceMeters"] == 200.0',
    )
    missing_test_fragments = [fragment for fragment in required_test_fragments if fragment not in test_text]
    if missing_test_fragments:
        findings.append(
            Finding(
                path=test_path,
                rule="algorithm-planning-map-scale-contract",
                detail=f"D* Lite map scale behavior must stay covered by a focused test: missing={missing_test_fragments}",
            )
        )

    return findings


def check_smart_map_manual_entry_panel(repo_root: Path) -> list[Finding]:
    findings: list[Finding] = []
    index_path = "frontend/src/views/smart_map/index.vue"
    if not (repo_root / index_path).exists():
        return findings
    entry_panel_path = "frontend/src/views/smart_map/components/SmartMapSensorManualEntryPanel.vue"
    config_panel_path = "frontend/src/views/smart_map/components/SmartMapSensorManualConfigPanel.vue"
    entry_panel_file = repo_root / entry_panel_path
    config_panel_file = repo_root / config_panel_path
    index_text = (repo_root / index_path).read_text(encoding="utf-8", errors="replace")
    index_line_count = len(index_text.splitlines())
    if not entry_panel_file.exists():
        findings.append(
            Finding(
                path=entry_panel_path,
                rule="smart-map-manual-entry-panel-extracted",
                detail="smart_map sensor manual entry template must stay outside the giant page",
            )
        )
        return findings
    if not config_panel_file.exists():
        findings.append(
            Finding(
                path=config_panel_path,
                rule="smart-map-manual-config-panel-extracted",
                detail="smart_map sensor manual placement config template must stay outside the giant page",
            )
        )
        return findings

    entry_panel_text = entry_panel_file.read_text(encoding="utf-8", errors="replace")
    config_panel_text = config_panel_file.read_text(encoding="utf-8", errors="replace")
    required_index_fragments = (
        "SmartMapSensorManualConfigPanel",
        "SmartMapSensorManualEntryPanel",
        "@apply-relative-coordinates=\"applyRelativeCoordinates\"",
        "@update-draft=\"Object.assign(manualSensorDraft, $event)\"",
        "@select-target=\"selectManualSensorTarget\"",
        "@set-mode=\"setManualPanelSensorMode\"",
        "@update-current-concentration=\"sensorEditorState.currentFrameConcentration = $event\"",
        "@update-fill-concentration=\"sensorEditorState.fillAllConcentration = $event\"",
    )
    forbidden_index_fragments = (
        "<span>手动添加传感器参数</span>",
        "<span>传感器手动录入面板</span>",
        "@click=\"toggleOriginPicking\"",
        "v-model.number=\"manualSensorDraft.installationHeight\"",
        "@change=\"selectManualSensorTarget(eventValue($event))\"",
        "@change=\"setManualPanelSensorMode(eventValue($event))\"",
    )
    required_entry_panel_fragments = (
        "SmartMapSensorManualEntryPanel",
        "SmartMapEditableSensor",
        "select-target",
        "set-mode",
        "update-current-concentration",
        "update-fill-concentration",
        "写入当前帧",
        "复制自动曲线",
    )
    required_config_panel_fragments = (
        "SmartMapSensorManualConfigPanel",
        "SmartMapManualSensorDraft",
        "SmartMapManualSensorConfig",
        "apply-relative-coordinates",
        "toggle-origin-picking",
        "update-relative-x",
        "update-draft",
        "手动添加传感器参数",
        "确认添加",
    )
    missing_index = [fragment for fragment in required_index_fragments if fragment not in index_text]
    bad_index = [fragment for fragment in forbidden_index_fragments if fragment in index_text]
    missing_entry_panel = [
        fragment for fragment in required_entry_panel_fragments if fragment not in entry_panel_text
    ]
    missing_config_panel = [
        fragment for fragment in required_config_panel_fragments if fragment not in config_panel_text
    ]
    if missing_index or bad_index or missing_entry_panel or missing_config_panel or index_line_count > 1785:
        findings.append(
            Finding(
                path=index_path,
                rule="smart-map-manual-entry-panel-extracted",
                detail=(
                    "smart_map manual sensor panel extraction regressed: "
                    f"index_missing={missing_index}, index_forbidden={bad_index}, "
                    f"entry_panel_missing={missing_entry_panel}, "
                    f"config_panel_missing={missing_config_panel}, line_count={index_line_count}"
                ),
            )
        )
    return findings


def check_frontend_media_truth_boundary(repo_root: Path) -> list[Finding]:
    checks = {
        "frontend/src/layout/index.vue": (
            (
                "厂区图像巡检",
            ),
            (
                "厂区实时监测",
            ),
        ),
        "frontend/src/router/routes.ts": (
            (
                "title: '厂区图像巡检'",
                "name: 'YoloInspection'",
            ),
            (
                "title: '厂区实时监测'",
            ),
        ),
        "frontend/src/views/car/CarHome.vue": (
            (
                "厂区图像巡检",
                "视频源未绑定",
                "导入图片识别",
            ),
            (
                "实时视频监测",
                "实时视频占位",
                "Tab 4: 厂区实时监测",
                "导航函数（智慧地图 / 厂区实时监测）",
            ),
        ),
        "frontend/src/views/car/CarDetail.vue": (
            (
                "当前仓库未接入小车实时视频流",
                "可上传巡检图片进行识别",
            ),
            (
                "等待小车 {{ route.params.id }} 接入实时视频流",
            ),
        ),
        "frontend/src/views/thing/monitor_history/index.vue": (
            (
                "监测点与视频源绑定",
                "monitor-source-note",
                "未绑定项必须显示为空态",
            ),
            (
                "实时泄漏监测",
                "实时监测视频区",
            ),
        ),
    }
    findings: list[Finding] = []
    for path, (required_fragments, forbidden_fragments) in checks.items():
        text = (repo_root / path).read_text(encoding="utf-8", errors="replace")
        missing_fragments = [fragment for fragment in required_fragments if fragment not in text]
        bad_fragments = [fragment for fragment in forbidden_fragments if fragment in text]
        if missing_fragments or bad_fragments:
            findings.append(
                Finding(
                    path=path,
                    rule="frontend-media-truth-boundary",
                    detail=(
                        "frontend media panels must not imply real-time video/hardware streams before integration: "
                        f"missing={missing_fragments}, forbidden={bad_fragments}"
                    ),
                )
            )
    return findings


def check_environment_schema_truth_boundary(repo_root: Path) -> list[Finding]:
    findings: list[Finding] = []
    checks = {
        "backend/src/main/resources/schema-sensor.sql": (
            (
                "环境观测数据表",
                "当前仓库没有真实硬件采集链路",
                "只有外部系统明确写入 source 时，才能按来源解释为外部观测",
                "COMMENT '观测时间'",
            ),
            (
                "环境实测数据表",
                "实测观测时间",
                "只保存外部设备、网关、MQTT 或气象服务写入的真实采样",
            ),
        ),
        "backend/src/main/resources/init-sensor-db.sql": (
            (
                "环境观测数据表",
                "当前仓库没有真实硬件采集链路",
                "只有外部系统明确写入 source 时，才能按来源解释为外部观测",
                "COMMENT '观测时间'",
            ),
            (
                "环境实测数据表",
                "实测观测时间",
            ),
        ),
    }
    for path, (required_fragments, forbidden_fragments) in checks.items():
        text = (repo_root / path).read_text(encoding="utf-8", errors="replace")
        missing_fragments = [fragment for fragment in required_fragments if fragment not in text]
        bad_fragments = [fragment for fragment in forbidden_fragments if fragment in text]
        if missing_fragments or bad_fragments:
            findings.append(
                Finding(
                    path=path,
                    rule="environment-schema-truth-boundary",
                    detail=(
                        "environment schemas must not claim measured hardware data without an integrated source: "
                        f"missing={missing_fragments}, forbidden={bad_fragments}"
                    ),
                )
            )
    return findings


def check_smart_map_extraction(repo_root: Path) -> list[Finding]:
    findings: list[Finding] = []
    index_path = "frontend/src/views/smart_map/index.vue"
    if not (repo_root / index_path).exists():
        return findings
    index_style_path = "frontend/src/views/smart_map/index.css"
    helper_path = "frontend/src/views/smart_map/useSmartMapUi.ts"
    catalog_path = "frontend/src/views/smart_map/useSmartMapCatalogPersistence.ts"
    car_patrol_path = "frontend/src/views/smart_map/useSmartMapCarPatrol.ts"
    sensor_series_path = "frontend/src/views/smart_map/useSmartMapSensorSeries.ts"
    sensor_series_actions_path = "frontend/src/views/smart_map/useSmartMapSensorSeriesActions.ts"
    device_image_path = "frontend/src/views/smart_map/useSmartMapDeviceImage.ts"
    diffusion_timeline_path = "frontend/src/views/smart_map/components/SmartMapDiffusionTimeline.vue"
    device_fullscreen_path = "frontend/src/views/smart_map/components/SmartMapDeviceFullscreen.vue"
    emergency_scenario_panel_path = "frontend/src/views/smart_map/components/SmartMapEmergencyScenarioPanel.vue"
    sensor_edit_dialog_path = "frontend/src/views/smart_map/components/SmartMapSensorEditDialog.vue"
    search_box_path = "frontend/src/views/smart_map/components/SmartMapSearchBox.vue"
    legend_list_path = "frontend/src/views/smart_map/components/SmartMapLegendList.vue"
    zone_list_path = "frontend/src/views/smart_map/components/SmartMapZoneList.vue"
    stats_grid_path = "frontend/src/views/smart_map/components/SmartMapStatsGrid.vue"
    alert_list_path = "frontend/src/views/smart_map/components/SmartMapAlertList.vue"
    risk_stats_path = "frontend/src/views/smart_map/components/SmartMapRiskStats.vue"
    weather_panel_path = "frontend/src/views/smart_map/components/SmartMapWeatherPanel.vue"
    layout_stats_path = "frontend/src/views/smart_map/components/SmartMapLayoutStats.vue"
    layout_actions_path = "frontend/src/views/smart_map/components/SmartMapLayoutActions.vue"
    yolo_result_card_path = "frontend/src/views/smart_map/components/SmartMapYoloResultCard.vue"
    sensor_history_chart_path = "frontend/src/views/smart_map/components/SmartMapSensorHistoryChart.vue"
    sensor_device_card_path = "frontend/src/views/smart_map/components/SmartMapSensorDeviceCard.vue"
    sampling_summary_path = "frontend/src/views/smart_map/components/SmartMapSamplingSummary.vue"
    selected_sensor_actions_path = "frontend/src/views/smart_map/components/SmartMapSelectedSensorActions.vue"
    selected_sensor_data_panel_path = "frontend/src/views/smart_map/components/SmartMapSelectedSensorDataPanel.vue"
    source_inversion_panel_path = "frontend/src/views/smart_map/components/SmartMapSourceInversionPanel.vue"
    coarse_candidate_panel_path = "frontend/src/views/smart_map/components/SmartMapCoarseCandidatePanel.vue"
    gas_editor_panel_path = "frontend/src/views/smart_map/components/SmartMapGasEditorPanel.vue"
    observation_summary_panel_path = "frontend/src/views/smart_map/components/SmartMapObservationSummaryPanel.vue"
    refinement_summary_panel_path = "frontend/src/views/smart_map/components/SmartMapRefinementSummaryPanel.vue"
    sensor_batch_import_panel_path = "frontend/src/views/smart_map/components/SmartMapSensorBatchImportPanel.vue"
    gas_editor_path = "frontend/src/views/smart_map/useSmartMapGasEditor.ts"
    toast_path = "frontend/src/views/smart_map/useSmartMapToast.ts"
    toast_component_path = "frontend/src/views/smart_map/components/SmartMapToast.vue"
    validation_reports_path = "frontend/src/views/smart_map/useSmartMapValidationReports.ts"
    placement_rules_path = "frontend/src/views/smart_map/useSmartMapSensorPlacementRules.ts"
    sensor_placement_path = "frontend/src/views/smart_map/useSmartMapSensorPlacement.ts"
    sensor_batch_import_path = "frontend/src/views/smart_map/useSmartMapSensorBatchImport.ts"
    sensor_readings_path = "frontend/src/views/smart_map/useSmartMapSensorReadings.ts"
    sensor_editor_path = "frontend/src/views/smart_map/useSmartMapSensorEditor.ts"
    sensor_info_path = "frontend/src/views/smart_map/useSmartMapSensorInfo.ts"
    sensor_hover_path = "frontend/src/views/smart_map/useSmartMapSensorHoverCard.ts"
    sensor_hover_component_path = "frontend/src/views/smart_map/components/SmartMapSensorHoverCard.vue"
    car_info_path = "frontend/src/views/smart_map/useSmartMapCarInfo.ts"
    algorithm_states_path = "frontend/src/views/smart_map/useSmartMapAlgorithmStates.ts"
    algorithm_executors_path = "frontend/src/views/smart_map/useSmartMapAlgorithmExecutors.ts"
    evacuation_planning_path = "frontend/src/views/smart_map/useSmartMapEvacuationPlanning.ts"
    evacuation_planning_actions_path = "frontend/src/views/smart_map/useSmartMapEvacuationPlanningActions.ts"
    viewport_path = "frontend/src/views/smart_map/useSmartMapViewport.ts"
    viewport_controls_path = "frontend/src/views/smart_map/components/SmartMapViewportControls.vue"
    bottom_toolbar_path = "frontend/src/views/smart_map/components/SmartMapBottomToolbar.vue"
    coordinate_display_path = "frontend/src/views/smart_map/components/SmartMapCoordinateDisplay.vue"
    runtime_display_path = "frontend/src/views/smart_map/useSmartMapRuntimeDisplay.ts"
    weather_state_path = "frontend/src/views/smart_map/useSmartMapWeatherState.ts"
    measure_tool_path = "frontend/src/views/smart_map/useSmartMapMeasureTool.ts"
    view_controls_path = "frontend/src/views/smart_map/useSmartMapViewControls.ts"
    canvas_shell_path = "frontend/src/views/smart_map/useSmartMapCanvasShell.ts"
    canvas_interaction_path = "frontend/src/views/smart_map/useSmartMapCanvasInteraction.ts"
    canvas_selection_actions_path = "frontend/src/views/smart_map/useSmartMapCanvasSelectionActions.ts"
    core_state_path = "frontend/src/views/smart_map/useSmartMapCoreState.ts"
    leak_source_path = "frontend/src/views/smart_map/useSmartMapLeakSource.ts"
    workflow_steps_path = "frontend/src/views/smart_map/useSmartMapWorkflowSteps.ts"
    diffusion_playback_path = "frontend/src/views/smart_map/useSmartMapDiffusionPlayback.ts"
    refinement_playback_path = "frontend/src/views/smart_map/useSmartMapRefinementPlayback.ts"
    diffusion_scenario_path = "frontend/src/views/smart_map/useSmartMapDiffusionScenario.ts"
    diffusion_simulation_path = "frontend/src/views/smart_map/useSmartMapDiffusionSimulation.ts"
    diffusion_layer_path = "frontend/src/views/smart_map/useSmartMapDiffusionLayer.ts"
    source_overlay_path = "frontend/src/views/smart_map/useSmartMapSourceInversionOverlay.ts"
    evacuation_canvas_path = "frontend/src/views/smart_map/useSmartMapEvacuationRouteCanvas.ts"
    facility_canvas_path = "frontend/src/views/smart_map/useSmartMapFacilityCanvas.ts"
    entrance_canvas_path = "frontend/src/views/smart_map/useSmartMapEntranceCanvas.ts"
    sensor_canvas_path = "frontend/src/views/smart_map/useSmartMapSensorCanvas.ts"
    base_canvas_path = "frontend/src/views/smart_map/useSmartMapBaseCanvas.ts"
    hit_testing_path = "frontend/src/views/smart_map/useSmartMapHitTesting.ts"
    info_panel_path = "frontend/src/views/smart_map/useSmartMapInfoPanel.ts"
    facility_info_path = "frontend/src/views/smart_map/useSmartMapFacilityInfo.ts"
    car_interaction_path = "frontend/src/views/smart_map/useSmartMapCarInteraction.ts"
    risk_grid_path = "frontend/src/views/smart_map/useSmartMapRiskGrid.ts"
    risk_summary_path = "frontend/src/views/smart_map/useSmartMapRiskSummary.ts"
    sensor_layout_path = "frontend/src/views/smart_map/useSmartMapSensorLayout.ts"
    canvas_layer_path = "frontend/src/views/smart_map/useSmartMapCanvasLayerRenderers.ts"
    canvas_runtime_path = "frontend/src/views/smart_map/useSmartMapCanvasRuntime.ts"
    lifecycle_coordinator_path = "frontend/src/views/smart_map/useSmartMapLifecycleCoordinator.ts"
    renderer_path = "frontend/src/views/smart_map/useSmartMapRenderer.ts"
    render_bridge_path = "frontend/src/views/smart_map/useSmartMapRenderBridge.ts"
    page_actions_path = "frontend/src/views/smart_map/useSmartMapPageActions.ts"
    source_workflow_state_path = "frontend/src/views/smart_map/useSmartMapSourceWorkflowState.ts"
    observation_builders_path = "frontend/src/views/smart_map/useSmartMapObservationBuilders.ts"
    source_inversion_actions_path = "frontend/src/views/smart_map/useSmartMapSourceInversionActions.ts"
    observation_payload_actions_path = "frontend/src/views/smart_map/useSmartMapObservationPayloadActions.ts"
    monitoring_summary_path = "frontend/src/views/smart_map/useSmartMapMonitoringSummaryState.ts"
    selection_display_path = "frontend/src/views/smart_map/useSmartMapSelectionDisplayState.ts"
    lightweight_concentration_path = "frontend/src/views/smart_map/smartMapLightweightConcentration.ts"
    sensor_dimensions_path = "frontend/src/views/smart_map/smartMapSensorDimensions.ts"
    sensor_focus_path = "frontend/src/views/smart_map/smartMapSensorFocus.ts"
    sensor_catalog_path = "frontend/src/data/sensorCatalog.ts"
    simulation_monitoring_api_path = "frontend/src/api/simulationMonitoring.ts"
    index_style_file = repo_root / index_style_path
    helper_file = repo_root / helper_path
    catalog_file = repo_root / catalog_path
    car_patrol_file = repo_root / car_patrol_path
    sensor_series_file = repo_root / sensor_series_path
    sensor_series_actions_file = repo_root / sensor_series_actions_path
    device_image_file = repo_root / device_image_path
    diffusion_timeline_file = repo_root / diffusion_timeline_path
    device_fullscreen_file = repo_root / device_fullscreen_path
    emergency_scenario_panel_file = repo_root / emergency_scenario_panel_path
    sensor_edit_dialog_file = repo_root / sensor_edit_dialog_path
    search_box_file = repo_root / search_box_path
    legend_list_file = repo_root / legend_list_path
    zone_list_file = repo_root / zone_list_path
    stats_grid_file = repo_root / stats_grid_path
    alert_list_file = repo_root / alert_list_path
    risk_stats_file = repo_root / risk_stats_path
    weather_panel_file = repo_root / weather_panel_path
    layout_stats_file = repo_root / layout_stats_path
    layout_actions_file = repo_root / layout_actions_path
    yolo_result_card_file = repo_root / yolo_result_card_path
    sensor_history_chart_file = repo_root / sensor_history_chart_path
    sensor_device_card_file = repo_root / sensor_device_card_path
    sampling_summary_file = repo_root / sampling_summary_path
    selected_sensor_actions_file = repo_root / selected_sensor_actions_path
    selected_sensor_data_panel_file = repo_root / selected_sensor_data_panel_path
    source_inversion_panel_file = repo_root / source_inversion_panel_path
    coarse_candidate_panel_file = repo_root / coarse_candidate_panel_path
    gas_editor_panel_file = repo_root / gas_editor_panel_path
    observation_summary_panel_file = repo_root / observation_summary_panel_path
    refinement_summary_panel_file = repo_root / refinement_summary_panel_path
    sensor_batch_import_panel_file = repo_root / sensor_batch_import_panel_path
    gas_editor_file = repo_root / gas_editor_path
    toast_file = repo_root / toast_path
    toast_component_file = repo_root / toast_component_path
    validation_reports_file = repo_root / validation_reports_path
    placement_rules_file = repo_root / placement_rules_path
    sensor_placement_file = repo_root / sensor_placement_path
    sensor_batch_import_file = repo_root / sensor_batch_import_path
    sensor_readings_file = repo_root / sensor_readings_path
    sensor_editor_file = repo_root / sensor_editor_path
    sensor_info_file = repo_root / sensor_info_path
    sensor_hover_file = repo_root / sensor_hover_path
    sensor_hover_component_file = repo_root / sensor_hover_component_path
    car_info_file = repo_root / car_info_path
    algorithm_states_file = repo_root / algorithm_states_path
    algorithm_executors_file = repo_root / algorithm_executors_path
    evacuation_planning_file = repo_root / evacuation_planning_path
    evacuation_planning_actions_file = repo_root / evacuation_planning_actions_path
    viewport_file = repo_root / viewport_path
    viewport_controls_file = repo_root / viewport_controls_path
    bottom_toolbar_file = repo_root / bottom_toolbar_path
    coordinate_display_file = repo_root / coordinate_display_path
    runtime_display_file = repo_root / runtime_display_path
    weather_state_file = repo_root / weather_state_path
    measure_tool_file = repo_root / measure_tool_path
    view_controls_file = repo_root / view_controls_path
    canvas_shell_file = repo_root / canvas_shell_path
    canvas_interaction_file = repo_root / canvas_interaction_path
    canvas_selection_actions_file = repo_root / canvas_selection_actions_path
    core_state_file = repo_root / core_state_path
    leak_source_file = repo_root / leak_source_path
    workflow_steps_file = repo_root / workflow_steps_path
    diffusion_playback_file = repo_root / diffusion_playback_path
    refinement_playback_file = repo_root / refinement_playback_path
    diffusion_scenario_file = repo_root / diffusion_scenario_path
    diffusion_simulation_file = repo_root / diffusion_simulation_path
    diffusion_layer_file = repo_root / diffusion_layer_path
    source_overlay_file = repo_root / source_overlay_path
    evacuation_canvas_file = repo_root / evacuation_canvas_path
    facility_canvas_file = repo_root / facility_canvas_path
    entrance_canvas_file = repo_root / entrance_canvas_path
    sensor_canvas_file = repo_root / sensor_canvas_path
    base_canvas_file = repo_root / base_canvas_path
    hit_testing_file = repo_root / hit_testing_path
    info_panel_file = repo_root / info_panel_path
    facility_info_file = repo_root / facility_info_path
    car_interaction_file = repo_root / car_interaction_path
    risk_grid_file = repo_root / risk_grid_path
    risk_summary_file = repo_root / risk_summary_path
    sensor_layout_file = repo_root / sensor_layout_path
    canvas_layer_file = repo_root / canvas_layer_path
    canvas_runtime_file = repo_root / canvas_runtime_path
    lifecycle_coordinator_file = repo_root / lifecycle_coordinator_path
    renderer_file = repo_root / renderer_path
    render_bridge_file = repo_root / render_bridge_path
    page_actions_file = repo_root / page_actions_path
    source_workflow_state_file = repo_root / source_workflow_state_path
    observation_builders_file = repo_root / observation_builders_path
    source_inversion_actions_file = repo_root / source_inversion_actions_path
    observation_payload_actions_file = repo_root / observation_payload_actions_path
    monitoring_summary_file = repo_root / monitoring_summary_path
    selection_display_file = repo_root / selection_display_path
    lightweight_concentration_file = repo_root / lightweight_concentration_path
    sensor_dimensions_file = repo_root / sensor_dimensions_path
    sensor_focus_file = repo_root / sensor_focus_path
    sensor_catalog_file = repo_root / sensor_catalog_path
    simulation_monitoring_api_file = repo_root / simulation_monitoring_api_path
    if not index_style_file.exists():
        return [
            Finding(
                path=index_style_path,
                rule="smart-map-style-extracted",
                detail="smart_map scoped style must stay outside the giant page",
            )
        ]
    if not helper_file.exists():
        return [
            Finding(
                path=helper_path,
                rule="smart-map-ui-helper-extracted",
                detail="smart_map UI and error helpers must stay outside the giant page",
            )
        ]
    if not catalog_file.exists():
        return [
            Finding(
                path=catalog_path,
                rule="smart-map-catalog-persistence-extracted",
                detail="smart_map sensor/gas persistence must stay outside the giant page",
            )
        ]
    if not car_patrol_file.exists():
        return [
            Finding(
                path=car_patrol_path,
                rule="smart-map-car-patrol-extracted",
                detail="smart_map car patrol and mobile sensor sampling must stay outside the giant page",
            )
        ]
    if not measure_tool_file.exists():
        return [
            Finding(
                path=measure_tool_path,
                rule="smart-map-measure-tool-extracted",
                detail="smart_map measure tool state and drawing must stay outside the giant page",
            )
        ]
    if not sensor_series_file.exists():
        return [
            Finding(
                path=sensor_series_path,
                rule="smart-map-sensor-series-extracted",
                detail="smart_map sensor concentration and history chart helpers must stay outside the giant page",
            )
        ]
    if not sensor_series_actions_file.exists():
        return [
            Finding(
                path=sensor_series_actions_path,
                rule="smart-map-sensor-series-actions-extracted",
                detail="smart_map sensor series dependency wiring must stay outside the giant page",
            )
        ]
    if not device_image_file.exists():
        return [
            Finding(
                path=device_image_path,
                rule="smart-map-device-image-extracted",
                detail="smart_map device image fullscreen controls must stay outside the giant page",
            )
        ]
    if not emergency_scenario_panel_file.exists():
        return [
            Finding(
                path=emergency_scenario_panel_path,
                rule="smart-map-emergency-scenario-panel-extracted",
                detail="smart_map emergency scenario controls must stay outside the giant page",
            )
        ]
    if not source_inversion_panel_file.exists():
        return [
            Finding(
                path=source_inversion_panel_path,
                rule="smart-map-source-inversion-panel-extracted",
                detail="smart_map source inversion controls must stay outside the giant page",
            )
        ]
    if not selected_sensor_data_panel_file.exists():
        return [
            Finding(
                path=selected_sensor_data_panel_path,
                rule="smart-map-selected-sensor-data-panel-extracted",
                detail="smart_map selected sensor data-mode controls must stay outside the giant page",
            )
        ]
    if not selected_sensor_actions_file.exists():
        return [
            Finding(
                path=selected_sensor_actions_path,
                rule="smart-map-selected-sensor-actions-extracted",
                detail="smart_map selected sensor edit/delete actions must stay outside the giant page",
            )
        ]
    if not observation_summary_panel_file.exists():
        return [
            Finding(
                path=observation_summary_panel_path,
                rule="smart-map-observation-summary-panel-extracted",
                detail="smart_map observation truth-boundary panel must stay outside the giant page",
            )
        ]
    if not refinement_summary_panel_file.exists():
        return [
            Finding(
                path=refinement_summary_panel_path,
                rule="smart-map-refinement-summary-panel-extracted",
                detail="smart_map refinement result panel must stay outside the giant page",
            )
        ]
    if not coarse_candidate_panel_file.exists():
        return [
            Finding(
                path=coarse_candidate_panel_path,
                rule="smart-map-coarse-candidate-panel-extracted",
                detail="smart_map coarse candidate list must stay outside the giant page",
            )
        ]
    if not gas_editor_panel_file.exists():
        return [
            Finding(
                path=gas_editor_panel_path,
                rule="smart-map-gas-editor-panel-extracted",
                detail="smart_map gas editor template must stay outside the giant page",
            )
        ]
    if not sensor_batch_import_panel_file.exists():
        return [
            Finding(
                path=sensor_batch_import_panel_path,
                rule="smart-map-sensor-batch-import-panel-extracted",
                detail="smart_map sensor batch import template must stay outside the giant page",
            )
        ]
    if not diffusion_timeline_file.exists():
        return [
            Finding(
                path=diffusion_timeline_path,
                rule="smart-map-diffusion-timeline-component-extracted",
                detail="smart_map diffusion timeline template and styles must stay outside the giant page",
            )
        ]
    if not device_fullscreen_file.exists():
        return [
            Finding(
                path=device_fullscreen_path,
                rule="smart-map-device-fullscreen-component-extracted",
                detail="smart_map device fullscreen template and styles must stay outside the giant page",
            )
        ]
    if not sensor_edit_dialog_file.exists():
        return [
            Finding(
                path=sensor_edit_dialog_path,
                rule="smart-map-sensor-edit-dialog-component-extracted",
                detail="smart_map sensor edit dialog template and styles must stay outside the giant page",
            )
        ]
    if not search_box_file.exists():
        return [
            Finding(
                path=search_box_path,
                rule="smart-map-search-box-component-extracted",
                detail="smart_map search box template and styles must stay outside the giant page",
            )
        ]
    if not legend_list_file.exists():
        return [
            Finding(
                path=legend_list_path,
                rule="smart-map-legend-list-component-extracted",
                detail="smart_map legend list template and styles must stay outside the giant page",
            )
        ]
    if not zone_list_file.exists():
        return [
            Finding(
                path=zone_list_path,
                rule="smart-map-zone-list-component-extracted",
                detail="smart_map zone list template and styles must stay outside the giant page",
            )
        ]
    if not stats_grid_file.exists():
        return [
            Finding(
                path=stats_grid_path,
                rule="smart-map-stats-grid-component-extracted",
                detail="smart_map overview stats template and styles must stay outside the giant page",
            )
        ]
    if not alert_list_file.exists():
        return [
            Finding(
                path=alert_list_path,
                rule="smart-map-alert-list-component-extracted",
                detail="smart_map alert list template and styles must stay outside the giant page",
            )
        ]
    if not risk_stats_file.exists():
        return [
            Finding(
                path=risk_stats_path,
                rule="smart-map-risk-stats-component-extracted",
                detail="smart_map risk statistics template and styles must stay outside the giant page",
            )
        ]
    if not weather_panel_file.exists():
        return [
            Finding(
                path=weather_panel_path,
                rule="smart-map-weather-panel-component-extracted",
                detail="smart_map weather panel template and inline styles must stay outside the giant page",
            )
        ]
    if not layout_stats_file.exists():
        return [
            Finding(
                path=layout_stats_path,
                rule="smart-map-layout-stats-component-extracted",
                detail="smart_map layout statistics template and styles must stay outside the giant page",
            )
        ]
    if not layout_actions_file.exists():
        return [
            Finding(
                path=layout_actions_path,
                rule="smart-map-layout-actions-component-extracted",
                detail="smart_map sensor layout action buttons must stay outside the giant page",
            )
        ]
    if not yolo_result_card_file.exists():
        return [
            Finding(
                path=yolo_result_card_path,
                rule="smart-map-yolo-result-card-component-extracted",
                detail="smart_map YOLO result card template and styles must stay outside the giant page",
            )
        ]
    if not sensor_history_chart_file.exists():
        return [
            Finding(
                path=sensor_history_chart_path,
                rule="smart-map-sensor-history-chart-component-extracted",
                detail="smart_map sensor history chart template and styles must stay outside the giant page",
            )
        ]
    if not sensor_device_card_file.exists():
        return [
            Finding(
                path=sensor_device_card_path,
                rule="smart-map-sensor-device-card-component-extracted",
                detail="smart_map sensor device card template and styles must stay outside the giant page",
            )
        ]
    if not sampling_summary_file.exists():
        return [
            Finding(
                path=sampling_summary_path,
                rule="smart-map-sampling-summary-component-extracted",
                detail="smart_map sensor sampling summary template must stay outside the giant page",
            )
        ]
    if not gas_editor_file.exists():
        return [
            Finding(
                path=gas_editor_path,
                rule="smart-map-gas-editor-extracted",
                detail="smart_map gas editor state and save/delete workflow must stay outside the giant page",
            )
        ]
    if not toast_file.exists():
        return [
            Finding(
                path=toast_path,
                rule="smart-map-toast-extracted",
                detail="smart_map toast state and timer cleanup must stay outside the giant page",
            )
        ]
    if not toast_component_file.exists():
        return [
            Finding(
                path=toast_component_path,
                rule="smart-map-toast-component-extracted",
                detail="smart_map toast template and styles must stay outside the giant page",
            )
        ]
    if not validation_reports_file.exists():
        return [
            Finding(
                path=validation_reports_path,
                rule="smart-map-validation-reports-extracted",
                detail="smart_map validation report summaries must stay outside the giant page",
            )
        ]
    if not placement_rules_file.exists():
        return [
            Finding(
                path=placement_rules_path,
                rule="smart-map-sensor-placement-rules-extracted",
                detail="smart_map sensor placement and risk rules must stay outside the giant page",
            )
        ]
    if not sensor_placement_file.exists():
        return [
            Finding(
                path=sensor_placement_path,
                rule="smart-map-sensor-placement-state-extracted",
                detail="smart_map manual sensor placement state must stay outside the giant page",
            )
        ]
    if not sensor_batch_import_file.exists():
        return [
            Finding(
                path=sensor_batch_import_path,
                rule="smart-map-sensor-batch-import-extracted",
                detail="smart_map sensor batch import parsing and persistence loop must stay outside the giant page",
            )
        ]
    if not sensor_readings_file.exists() or not simulation_monitoring_api_file.exists():
        return [
            Finding(
                path=sensor_readings_path,
                rule="smart-map-sensor-reading-source-extracted",
                detail="smart_map backend sensor_reading loading must stay in a typed API wrapper and composable",
            )
        ]
    if not algorithm_executors_file.exists():
        return [
            Finding(
                path=algorithm_executors_path,
                rule="smart-map-algorithm-executors-extracted",
                detail="smart_map algorithm API calls must stay outside the giant page",
            )
        ]
    if not algorithm_states_file.exists():
        return [
            Finding(
                path=algorithm_states_path,
                rule="smart-map-algorithm-states-extracted",
                detail="smart_map algorithm execution state and config defaults must stay outside the giant page",
            )
        ]
    if not sensor_editor_file.exists():
        return [
            Finding(
                path=sensor_editor_path,
                rule="smart-map-sensor-editor-extracted",
                detail="smart_map sensor editor and manual-series state must stay outside the giant page",
            )
        ]
    if not sensor_info_file.exists():
        return [
            Finding(
                path=sensor_info_path,
                rule="smart-map-sensor-info-extracted",
                detail="smart_map sensor info panel row construction must stay outside the giant page",
            )
        ]
    if not sensor_hover_file.exists():
        return [
            Finding(
                path=sensor_hover_path,
                rule="smart-map-sensor-hover-card-extracted",
                detail="smart_map sensor hover card view model must stay outside the giant page",
            )
        ]
    if not sensor_hover_component_file.exists():
        return [
            Finding(
                path=sensor_hover_component_path,
                rule="smart-map-sensor-hover-card-component-extracted",
                detail="smart_map sensor hover card template and styles must stay outside the giant page",
            )
        ]
    if not car_info_file.exists():
        return [
            Finding(
                path=car_info_path,
                rule="smart-map-car-info-extracted",
                detail="smart_map car info panel row construction must stay outside the giant page",
            )
        ]
    if not evacuation_planning_file.exists():
        return [
            Finding(
                path=evacuation_planning_path,
                rule="smart-map-evacuation-planning-extracted",
                detail="smart_map evacuation state and route summary must stay outside the giant page",
            )
        ]
    if not evacuation_planning_actions_file.exists():
        return [
            Finding(
                path=evacuation_planning_actions_path,
                rule="smart-map-evacuation-planning-actions-extracted",
                detail="smart_map evacuation planning actions must stay outside the giant page",
            )
        ]
    if not viewport_file.exists():
        return [
            Finding(
                path=viewport_path,
                rule="smart-map-viewport-extracted",
                detail="smart_map viewport coordinate and zoom state must stay outside the giant page",
            )
        ]
    if not viewport_controls_file.exists():
        return [
            Finding(
                path=viewport_controls_path,
                rule="smart-map-viewport-controls-component-extracted",
                detail="smart_map viewport controls template and styles must stay outside the giant page",
            )
        ]
    if not bottom_toolbar_file.exists():
        return [
            Finding(
                path=bottom_toolbar_path,
                rule="smart-map-bottom-toolbar-component-extracted",
                detail="smart_map bottom toolbar template and styles must stay outside the giant page",
            )
        ]
    if not coordinate_display_file.exists():
        return [
            Finding(
                path=coordinate_display_path,
                rule="smart-map-coordinate-display-component-extracted",
                detail="smart_map coordinate display template and styles must stay outside the giant page",
            )
        ]
    if not runtime_display_file.exists():
        return [
            Finding(
                path=runtime_display_path,
                rule="smart-map-runtime-display-extracted",
                detail="smart_map clock and coordinate display state must stay outside the giant page",
            )
        ]
    if not weather_state_file.exists():
        return [
            Finding(
                path=weather_state_path,
                rule="smart-map-weather-state-extracted",
                detail="smart_map weather display state must stay outside the giant page",
            )
        ]
    if not view_controls_file.exists():
        return [
            Finding(
                path=view_controls_path,
                rule="smart-map-view-controls-extracted",
                detail="smart_map filter, layer, search, and zoom controls must stay outside the giant page",
            )
        ]
    if not canvas_shell_file.exists():
        return [
            Finding(
                path=canvas_shell_path,
                rule="smart-map-canvas-shell-extracted",
                detail="smart_map canvas refs and view-mode shell state must stay outside the giant page",
            )
        ]
    if not refinement_playback_file.exists():
        return [
            Finding(
                path=refinement_playback_path,
                rule="smart-map-refinement-playback-extracted",
                detail="smart_map source refinement playback state must stay outside the giant page",
            )
        ]
    if not diffusion_scenario_file.exists():
        return [
            Finding(
                path=diffusion_scenario_path,
                rule="smart-map-diffusion-scenario-extracted",
                detail="smart_map diffusion scenario form and metadata state must stay outside the giant page",
            )
        ]
    if not hit_testing_file.exists():
        return [
            Finding(
                path=hit_testing_path,
                rule="smart-map-hit-testing-extracted",
                detail="smart_map hit testing must stay outside the giant page",
            )
        ]
    if not info_panel_file.exists():
        return [
            Finding(
                path=info_panel_path,
                rule="smart-map-info-panel-extracted",
                detail="smart_map info panel state must stay outside the giant page",
            )
        ]
    if not facility_info_file.exists():
        return [
            Finding(
                path=facility_info_path,
                rule="smart-map-facility-info-extracted",
                detail="smart_map facility info panel row construction must stay outside the giant page",
            )
        ]
    if not car_interaction_file.exists():
        return [
            Finding(
                path=car_interaction_path,
                rule="smart-map-car-interaction-extracted",
                detail="smart_map car selection, warning, and YOLO actions must stay outside the giant page",
            )
        ]
    if not risk_grid_file.exists():
        return [
            Finding(
                path=risk_grid_path,
                rule="smart-map-risk-grid-extracted",
                detail="smart_map risk grid calculation and heatmap drawing must stay outside the giant page",
            )
        ]
    if not risk_summary_file.exists():
        return [
            Finding(
                path=risk_summary_path,
                rule="smart-map-risk-summary-extracted",
                detail="smart_map risk coverage and level summaries must stay outside the giant page",
            )
        ]
    if not sensor_layout_file.exists():
        return [
            Finding(
                path=sensor_layout_path,
                rule="smart-map-sensor-layout-extracted",
                detail="smart_map standard sensor layout and code generation must stay outside the giant page",
            )
        ]
    if not source_workflow_state_file.exists():
        return [
            Finding(
                path=source_workflow_state_path,
                rule="smart-map-source-workflow-state-extracted",
                detail="smart_map source inversion workflow state must stay outside the giant page",
            )
        ]
    if not observation_builders_file.exists():
        return [
            Finding(
                path=observation_builders_path,
                rule="smart-map-observation-builders-extracted",
                detail="smart_map observation and particle payload builders must stay outside the giant page",
            )
        ]
    if not source_inversion_actions_file.exists():
        return [
            Finding(
                path=source_inversion_actions_path,
                rule="smart-map-source-inversion-actions-extracted",
                detail="smart_map source inversion workflow actions must stay outside the giant page",
            )
        ]
    if not observation_payload_actions_file.exists():
        return [
            Finding(
                path=observation_payload_actions_path,
                rule="smart-map-observation-payload-actions-extracted",
                detail="smart_map observation payload write/export actions must stay outside the giant page",
            )
        ]
    if not monitoring_summary_file.exists():
        return [
            Finding(
                path=monitoring_summary_path,
                rule="smart-map-monitoring-summary-state-extracted",
                detail="smart_map monitoring and diffusion summary computed state must stay outside the giant page",
            )
        ]
    if not selection_display_file.exists():
        return [
            Finding(
                path=selection_display_path,
                rule="smart-map-selection-display-state-extracted",
                detail="smart_map selected sensor and observation display computed state must stay outside the giant page",
            )
        ]
    if not lightweight_concentration_file.exists():
        return [
            Finding(
                path=lightweight_concentration_path,
                rule="smart-map-lightweight-concentration-extracted",
                detail="smart_map lightweight simulated concentration helper must stay outside the giant page",
            )
        ]
    if not sensor_dimensions_file.exists():
        return [
            Finding(
                path=sensor_dimensions_path,
                rule="smart-map-sensor-dimensions-extracted",
                detail="smart_map sensor dimension resolvers must stay outside the giant page",
            )
        ]
    if not sensor_focus_file.exists():
        return [
            Finding(
                path=sensor_focus_path,
                rule="smart-map-sensor-focus-extracted",
                detail="smart_map sensor focus viewport math must stay outside the giant page",
            )
        ]
    if not canvas_interaction_file.exists():
        return [
            Finding(
                path=canvas_interaction_path,
                rule="smart-map-canvas-interaction-extracted",
                detail="smart_map canvas mouse interaction and selection dispatch must stay outside the giant page",
            )
        ]
    if not canvas_selection_actions_file.exists():
        return [
            Finding(
                path=canvas_selection_actions_path,
                rule="smart-map-canvas-selection-actions-extracted",
                detail="smart_map canvas selection action dispatch must stay outside the giant page",
            )
        ]
    if not core_state_file.exists():
        return [
            Finding(
                path=core_state_path,
                rule="smart-map-core-state-extracted",
                detail="smart_map shared sensor/gas/risk refs must stay outside the giant page",
            )
        ]
    if not leak_source_file.exists():
        return [
            Finding(
                path=leak_source_path,
                rule="smart-map-leak-source-extracted",
                detail="smart_map leak source selection state and validation must stay outside the giant page",
            )
        ]
    if not workflow_steps_file.exists():
        return [
            Finding(
                path=workflow_steps_path,
                rule="smart-map-workflow-steps-extracted",
                detail="smart_map workflow step computed state must stay outside the giant page",
            )
        ]
    if not diffusion_playback_file.exists():
        return [
            Finding(
                path=diffusion_playback_path,
                rule="smart-map-diffusion-playback-extracted",
                detail="smart_map diffusion playback state and frame stepping must stay outside the giant page",
            )
        ]
    if not diffusion_simulation_file.exists():
        return [
            Finding(
                path=diffusion_simulation_path,
                rule="smart-map-diffusion-simulation-extracted",
                detail="smart_map diffusion simulation payload and result orchestration must stay outside the giant page",
            )
        ]
    if not diffusion_layer_file.exists():
        return [
            Finding(
                path=diffusion_layer_path,
                rule="smart-map-diffusion-layer-extracted",
                detail="smart_map diffusion frame drawing must stay outside the giant page",
            )
        ]
    if not source_overlay_file.exists():
        return [
            Finding(
                path=source_overlay_path,
                rule="smart-map-source-overlay-extracted",
                detail="smart_map source inversion overlay drawing must stay outside the giant page",
            )
        ]
    if not evacuation_canvas_file.exists():
        return [
            Finding(
                path=evacuation_canvas_path,
                rule="smart-map-evacuation-route-canvas-extracted",
                detail="smart_map evacuation route canvas drawing must stay outside the giant page",
            )
        ]
    if not facility_canvas_file.exists():
        return [
            Finding(
                path=facility_canvas_path,
                rule="smart-map-facility-canvas-extracted",
                detail="smart_map facility bounds and canvas overlays must stay outside the giant page",
            )
        ]
    if not entrance_canvas_file.exists():
        return [
            Finding(
                path=entrance_canvas_path,
                rule="smart-map-entrance-canvas-extracted",
                detail="smart_map entrance canvas drawing must stay outside the giant page",
            )
        ]
    if not sensor_canvas_file.exists():
        return [
            Finding(
                path=sensor_canvas_path,
                rule="smart-map-sensor-canvas-extracted",
                detail="smart_map sensor canvas drawing must stay outside the giant page",
            )
        ]
    if not base_canvas_file.exists():
        return [
            Finding(
                path=base_canvas_path,
                rule="smart-map-base-canvas-extracted",
                detail="smart_map base canvas drawing must stay outside the giant page",
            )
        ]
    if not canvas_layer_file.exists():
        return [
            Finding(
                path=canvas_layer_path,
                rule="smart-map-canvas-layer-renderers-extracted",
                detail="smart_map canvas layer rendering adapters must stay outside the giant page",
            )
        ]
    if not canvas_runtime_file.exists():
        return [
            Finding(
                path=canvas_runtime_path,
                rule="smart-map-canvas-runtime-extracted",
                detail="smart_map canvas lifecycle and animation runtime must stay outside the giant page",
            )
        ]
    if not lifecycle_coordinator_file.exists():
        return [
            Finding(
                path=lifecycle_coordinator_path,
                rule="smart-map-lifecycle-coordinator-extracted",
                detail="smart_map startup, watcher, and teardown orchestration must stay outside the giant page",
            )
        ]
    if not renderer_file.exists():
        return [
            Finding(
                path=renderer_path,
                rule="smart-map-renderer-extracted",
                detail="smart_map canvas rendering orchestration must stay outside the giant page",
            )
        ]
    if not render_bridge_file.exists():
        return [
            Finding(
                path=render_bridge_path,
                rule="smart-map-render-bridge-extracted",
                detail="smart_map canvas/context render bridge must stay outside the giant page",
            )
        ]
    if not page_actions_file.exists():
        return [
            Finding(
                path=page_actions_path,
                rule="smart-map-page-actions-extracted",
                detail="smart_map navigation, panel, and demo actions must stay outside the giant page",
            )
        ]
    index_text = (repo_root / index_path).read_text(encoding="utf-8", errors="replace")
    index_style_text = index_style_file.read_text(encoding="utf-8", errors="replace")
    helper_text = helper_file.read_text(encoding="utf-8", errors="replace")
    catalog_text = catalog_file.read_text(encoding="utf-8", errors="replace")
    car_patrol_text = car_patrol_file.read_text(encoding="utf-8", errors="replace")
    sensor_series_text = sensor_series_file.read_text(encoding="utf-8", errors="replace")
    sensor_series_actions_text = sensor_series_actions_file.read_text(encoding="utf-8", errors="replace")
    device_image_text = device_image_file.read_text(encoding="utf-8", errors="replace")
    diffusion_timeline_text = diffusion_timeline_file.read_text(encoding="utf-8", errors="replace")
    gas_editor_text = gas_editor_file.read_text(encoding="utf-8", errors="replace")
    toast_text = toast_file.read_text(encoding="utf-8", errors="replace")
    toast_component_text = toast_component_file.read_text(encoding="utf-8", errors="replace")
    validation_reports_text = validation_reports_file.read_text(encoding="utf-8", errors="replace")
    placement_rules_text = placement_rules_file.read_text(encoding="utf-8", errors="replace")
    sensor_placement_text = sensor_placement_file.read_text(encoding="utf-8", errors="replace")
    sensor_batch_import_text = sensor_batch_import_file.read_text(encoding="utf-8", errors="replace")
    sensor_readings_text = sensor_readings_file.read_text(encoding="utf-8", errors="replace")
    sensor_editor_text = sensor_editor_file.read_text(encoding="utf-8", errors="replace")
    sensor_info_text = sensor_info_file.read_text(encoding="utf-8", errors="replace")
    sensor_hover_text = sensor_hover_file.read_text(encoding="utf-8", errors="replace")
    sensor_hover_component_text = sensor_hover_component_file.read_text(encoding="utf-8", errors="replace")
    car_info_text = car_info_file.read_text(encoding="utf-8", errors="replace")
    algorithm_states_text = algorithm_states_file.read_text(encoding="utf-8", errors="replace")
    algorithm_executors_text = algorithm_executors_file.read_text(encoding="utf-8", errors="replace")
    evacuation_planning_text = evacuation_planning_file.read_text(encoding="utf-8", errors="replace")
    evacuation_planning_actions_text = evacuation_planning_actions_file.read_text(encoding="utf-8", errors="replace")
    viewport_text = viewport_file.read_text(encoding="utf-8", errors="replace")
    viewport_controls_text = viewport_controls_file.read_text(encoding="utf-8", errors="replace")
    bottom_toolbar_text = bottom_toolbar_file.read_text(encoding="utf-8", errors="replace")
    coordinate_display_text = coordinate_display_file.read_text(encoding="utf-8", errors="replace")
    runtime_display_text = runtime_display_file.read_text(encoding="utf-8", errors="replace")
    weather_state_text = weather_state_file.read_text(encoding="utf-8", errors="replace")
    view_controls_text = view_controls_file.read_text(encoding="utf-8", errors="replace")
    canvas_shell_text = canvas_shell_file.read_text(encoding="utf-8", errors="replace")
    canvas_interaction_text = canvas_interaction_file.read_text(encoding="utf-8", errors="replace")
    canvas_selection_actions_text = canvas_selection_actions_file.read_text(encoding="utf-8", errors="replace")
    core_state_text = core_state_file.read_text(encoding="utf-8", errors="replace")
    leak_source_text = leak_source_file.read_text(encoding="utf-8", errors="replace")
    workflow_steps_text = workflow_steps_file.read_text(encoding="utf-8", errors="replace")
    diffusion_playback_text = diffusion_playback_file.read_text(encoding="utf-8", errors="replace")
    refinement_playback_text = refinement_playback_file.read_text(encoding="utf-8", errors="replace")
    diffusion_scenario_text = diffusion_scenario_file.read_text(encoding="utf-8", errors="replace")
    diffusion_simulation_text = diffusion_simulation_file.read_text(encoding="utf-8", errors="replace")
    diffusion_layer_text = diffusion_layer_file.read_text(encoding="utf-8", errors="replace")
    source_overlay_text = source_overlay_file.read_text(encoding="utf-8", errors="replace")
    evacuation_canvas_text = evacuation_canvas_file.read_text(encoding="utf-8", errors="replace")
    facility_canvas_text = facility_canvas_file.read_text(encoding="utf-8", errors="replace")
    entrance_canvas_text = entrance_canvas_file.read_text(encoding="utf-8", errors="replace")
    sensor_canvas_text = sensor_canvas_file.read_text(encoding="utf-8", errors="replace")
    base_canvas_text = base_canvas_file.read_text(encoding="utf-8", errors="replace")
    hit_testing_text = hit_testing_file.read_text(encoding="utf-8", errors="replace")
    info_panel_text = info_panel_file.read_text(encoding="utf-8", errors="replace")
    facility_info_text = facility_info_file.read_text(encoding="utf-8", errors="replace")
    car_interaction_text = car_interaction_file.read_text(encoding="utf-8", errors="replace")
    risk_grid_text = risk_grid_file.read_text(encoding="utf-8", errors="replace")
    risk_summary_text = risk_summary_file.read_text(encoding="utf-8", errors="replace")
    sensor_layout_text = sensor_layout_file.read_text(encoding="utf-8", errors="replace")
    canvas_layer_text = canvas_layer_file.read_text(encoding="utf-8", errors="replace")
    canvas_runtime_text = canvas_runtime_file.read_text(encoding="utf-8", errors="replace")
    lifecycle_coordinator_text = lifecycle_coordinator_file.read_text(encoding="utf-8", errors="replace")
    renderer_text = renderer_file.read_text(encoding="utf-8", errors="replace")
    render_bridge_text = render_bridge_file.read_text(encoding="utf-8", errors="replace")
    page_actions_text = page_actions_file.read_text(encoding="utf-8", errors="replace")
    source_workflow_state_text = source_workflow_state_file.read_text(encoding="utf-8", errors="replace")
    observation_builders_text = observation_builders_file.read_text(encoding="utf-8", errors="replace")
    source_inversion_actions_text = source_inversion_actions_file.read_text(encoding="utf-8", errors="replace")
    observation_payload_actions_text = observation_payload_actions_file.read_text(encoding="utf-8", errors="replace")
    monitoring_summary_text = monitoring_summary_file.read_text(encoding="utf-8", errors="replace")
    selection_display_text = selection_display_file.read_text(encoding="utf-8", errors="replace")
    lightweight_concentration_text = lightweight_concentration_file.read_text(encoding="utf-8", errors="replace")
    sensor_dimensions_text = sensor_dimensions_file.read_text(encoding="utf-8", errors="replace")
    sensor_focus_text = sensor_focus_file.read_text(encoding="utf-8", errors="replace")
    sensor_catalog_text = sensor_catalog_file.read_text(encoding="utf-8", errors="replace")
    simulation_monitoring_api_text = simulation_monitoring_api_file.read_text(encoding="utf-8", errors="replace")
    device_fullscreen_text = device_fullscreen_file.read_text(encoding="utf-8", errors="replace")
    emergency_scenario_panel_text = emergency_scenario_panel_file.read_text(encoding="utf-8", errors="replace")
    sensor_edit_dialog_text = sensor_edit_dialog_file.read_text(encoding="utf-8", errors="replace")
    search_box_text = search_box_file.read_text(encoding="utf-8", errors="replace")
    legend_list_text = legend_list_file.read_text(encoding="utf-8", errors="replace")
    zone_list_text = zone_list_file.read_text(encoding="utf-8", errors="replace")
    stats_grid_text = stats_grid_file.read_text(encoding="utf-8", errors="replace")
    alert_list_text = alert_list_file.read_text(encoding="utf-8", errors="replace")
    risk_stats_text = risk_stats_file.read_text(encoding="utf-8", errors="replace")
    weather_panel_text = weather_panel_file.read_text(encoding="utf-8", errors="replace")
    layout_stats_text = layout_stats_file.read_text(encoding="utf-8", errors="replace")
    layout_actions_text = layout_actions_file.read_text(encoding="utf-8", errors="replace")
    yolo_result_card_text = yolo_result_card_file.read_text(encoding="utf-8", errors="replace")
    sensor_history_chart_text = sensor_history_chart_file.read_text(encoding="utf-8", errors="replace")
    sensor_device_card_text = sensor_device_card_file.read_text(encoding="utf-8", errors="replace")
    sampling_summary_text = sampling_summary_file.read_text(encoding="utf-8", errors="replace")
    selected_sensor_actions_text = selected_sensor_actions_file.read_text(encoding="utf-8", errors="replace")
    selected_sensor_data_panel_text = selected_sensor_data_panel_file.read_text(encoding="utf-8", errors="replace")
    source_inversion_panel_text = source_inversion_panel_file.read_text(encoding="utf-8", errors="replace")
    coarse_candidate_panel_text = coarse_candidate_panel_file.read_text(encoding="utf-8", errors="replace")
    gas_editor_panel_text = gas_editor_panel_file.read_text(encoding="utf-8", errors="replace")
    observation_summary_panel_text = observation_summary_panel_file.read_text(encoding="utf-8", errors="replace")
    refinement_summary_panel_text = refinement_summary_panel_file.read_text(encoding="utf-8", errors="replace")
    sensor_batch_import_panel_text = sensor_batch_import_panel_file.read_text(encoding="utf-8", errors="replace")
    required_index_fragments = (
        "from './useSmartMapUi'",
        "useSmartMapCatalogPersistence",
        "useSmartMapCarPatrol",
        "from './useSmartMapSensorSeries'",
        "useSmartMapSensorSeriesActions",
        "useSmartMapDeviceImage",
        "SmartMapDiffusionTimeline",
        "SmartMapDeviceFullscreen",
        "SmartMapEmergencyScenarioPanel",
        "SmartMapSensorEditDialog",
        "SmartMapSearchBox",
        "SmartMapLegendList",
        "SmartMapZoneList",
        "SmartMapStatsGrid",
        "SmartMapAlertList",
        "SmartMapRiskStats",
        "SmartMapWeatherPanel",
        "SmartMapLayoutStats",
        "SmartMapLayoutActions",
        "SmartMapYoloResultCard",
        "SmartMapSensorHistoryChart",
        "SmartMapSensorDeviceCard",
        "SmartMapSamplingSummary",
        "SmartMapSelectedSensorActions",
        "SmartMapSelectedSensorDataPanel",
        "SmartMapSourceInversionPanel",
        "useSmartMapGasEditor",
        "useSmartMapToast",
        "SmartMapToast",
        "useSmartMapValidationReports",
        "useSmartMapSensorPlacementRules",
        "useSmartMapSensorPlacement",
        "useSmartMapSensorBatchImport",
        "useSmartMapSensorReadings",
        "useSmartMapSensorEditor",
        "useSmartMapSensorInfoActions",
        "useSmartMapSensorHoverCard",
        "SmartMapSensorHoverCard",
        "useSmartMapCarInteraction",
        "useSmartMapAlgorithmStates",
        "useSmartMapDiffusionSimulation",
        "useSmartMapEvacuationPlanning",
        "useSmartMapViewport",
        "SmartMapViewportControls",
        "SmartMapBottomToolbar",
        "SmartMapCoordinateDisplay",
        "useSmartMapRuntimeDisplay",
        "useSmartMapWeatherState",
        "useSmartMapViewControls",
        "useSmartMapCanvasShell",
        "useSmartMapCanvasInteraction",
        "useSmartMapCanvasSelectionActions",
        "useSmartMapCoreState",
        "useSmartMapLeakSource",
        "useSmartMapWorkflowSteps",
        "useSmartMapDiffusionPlayback",
        "useSmartMapRefinementPlayback",
        "useSmartMapDiffusionScenario",
        "useSmartMapCanvasRuntime",
        "useSmartMapLifecycleCoordinator",
        "useSmartMapRenderer",
        "useSmartMapRenderBridge",
        "useSmartMapPageActions",
        "useSmartMapHitTestingActions",
        "useSmartMapInfoPanel",
        "from './useSmartMapRiskGrid'",
        "useSmartMapRiskSummary",
        "from './useSmartMapSensorLayout'",
        "generateSmartMapSensorCode",
        "useSmartMapSourceWorkflowState",
        "useSmartMapObservationBuilders",
        "useSmartMapSourceInversionActions",
        "useSmartMapObservationPayloadActions",
        "useSmartMapMonitoringSummaryState",
        "useSmartMapSelectionDisplayState",
        "normalizeSmartMapPoint",
        "smartMapSensorDimensions",
        "sensorReadingStatusText",
        "SmartMapCoarseCandidatePanel",
        "SmartMapGasEditorPanel",
        "SmartMapObservationSummaryPanel",
        "SmartMapRefinementSummaryPanel",
        "SmartMapSensorBatchImportPanel",
    )
    required_coarse_candidate_panel_fragments = (
        "SmartMapCoarseCandidatePanel",
        "SmartMapSourceCandidateRegion",
        "select-candidate",
        "candidate.score.toFixed(3)",
        "selectedCandidateId",
        "先点击“生成候选区域”查看粗搜结果",
    )
    required_gas_editor_panel_fragments = (
        "SmartMapGasEditorPanel",
        "GasRecord",
        "GasSavePayload",
        "toggle-visible",
        "edit-gas",
        "remove-gas",
        "save-draft",
        "v-model.trim=\"draft.id\"",
    )
    required_sensor_batch_import_panel_fragments = (
        "SmartMapSensorBatchImportPanel",
        "SmartMapBatchImportPoint",
        "直接粘贴Excel数据",
        "update:text",
        "update:defaultHeight",
        "update:defaultRange",
        "preview.slice(0, 20)",
        "一键导入",
    )
    required_observation_summary_panel_fragments = (
        "SmartMapObservationSummaryPanel",
        "SmartMapObservationSummary",
        "SmartMapCoarseSummary",
        "真实性边界",
        "后端边界",
        "sourceBreakdownText",
        "sensorReadingBoundaryText",
        "sensorReadingStatusText",
        "observationPayloadPreview",
    )
    required_refinement_summary_panel_fragments = (
        "SmartMapRefinementSummaryPanel",
        "SmartMapSourceRefinementIteration",
        "SmartMapRefinementSummary",
        "seek-step",
        "playbackText",
        "已收敛到预测源点",
        "summary?.sourceMatchError",
    )
    required_emergency_scenario_panel_fragments = (
        "SmartMapEmergencyScenarioPanel",
        "SmartMapWorkflowStep",
        "diffusionForm",
        "diffusionSourceValidation",
        "btexValidationSummary",
        "prairieValidationSummary",
        "toggle-advanced",
        "run-diffusion",
        "run-batch-evacuation",
        "当前设施设为源点",
        "高级场景参数",
    )
    required_source_inversion_panel_fragments = (
        "SmartMapSourceInversionPanel",
        "SmartMapSourceInversionConfig",
        "SmartMapParticleFilterConfig",
        "SmartMapRefinementPlaybackState",
        "sourceInversionConfig",
        "particleFilterConfig",
        "prepare-observations",
        "run-coarse-search",
        "run-particle-filter",
        "导出观测JSON",
        "专家算法参数",
    )
    required_selected_sensor_data_panel_fragments = (
        "SmartMapSelectedSensorDataPanel",
        "SmartMapEditableSensor",
        "set-mode",
        "update-current-concentration",
        "update-fill-concentration",
        "写入当前帧",
        "复制自动曲线",
        "自动采样：系统定时生成仿真采样数据",
    )
    required_selected_sensor_actions_fragments = (
        "SmartMapSelectedSensorActions",
        "编辑参数",
        "删除此传感器",
        "defineEmits",
    )
    required_helper_fragments = ("eventValue", "getErrorMessage", "getErrorStatus")
    required_index_style_fragments = (
        ".chempark-container",
        ".map-container",
    )
    forbidden_index_style_fragments = (
        ".device-fullscreen-overlay",
        ".device-fullscreen-card",
        ".device-img-zoom-bar",
        ".timeline-panel",
        ".timeline-head",
        ".timeline-btn",
        ".timeline-settings",
        ".map-controls",
        ".map-btn",
        ".scale-bar",
        ".scale-line",
        ".bottom-toolbar",
        ".coord-display",
        ".coord-item",
        ".coord-label",
        ".search-box",
        ".legend-list",
        ".legend-item",
        ".legend-swatch",
        ".zone-list",
        ".zone-item",
        ".zone-name",
        ".zone-tag",
        ".stat-grid",
        ".stat-card",
        ".stat-value",
        ".stat-label",
        ".alert-list",
        ".alert-item",
        ".alert-icon",
        ".alert-text",
        ".alert-time",
        ".risk-stat-list",
        ".risk-stat-item",
        ".risk-dot",
        ".weather-stat-grid",
        ".weather-stat-mini",
        ".weather-observed-time",
        ".sensor-stat-grid",
        ".stat-mini",
        ".yolo-result-card",
        ".yolo-result-img",
        ".yolo-result-time",
        ".sensor-history-svg",
        ".sensor-axis",
        ".sensor-threshold",
        ".sensor-line",
        ".sensor-marker",
        ".sensor-marker-dot",
        ".sensor-device-card",
        ".sensor-device-compact",
        ".sensor-device-thumb",
        ".sensor-btn-white",
        ".sensor-status-dot",
        ".sensor-conc-val",
        ".sensor-edit-overlay",
        ".sensor-edit-panel",
        ".sensor-edit-body",
        ".sensor-hover-card",
        ".sensor-hover-head",
        ".sensor-hover-grid",
        ".toast",
    )
    required_catalog_fragments = ("reqSensorList", "reqAddSensor", "reqGasList", "reqAddGas")
    required_car_patrol_fragments = (
        "SmartMapCarLayerState",
        "carLayerState",
        "syncCarMarkers",
        "syncCarMobileSensors",
        "refreshCarData",
        "updateCarPatrol",
        "drawSmartMapCars",
        "carHitTest",
    )
    required_sensor_series_fragments = (
        "buildSmartMapActiveSensorSeries",
        "attachSensorSampleSeries",
        "mergeSmartMapSensorReadings",
        "getSmartMapSensorCurrentConcentration",
        "getSmartMapSensorAutoConcentration",
        "getSmartMapSensorAlarmLevel",
        "buildSmartMapSensorHistoryChart",
    )
    required_sensor_series_actions_fragments = (
        "useSmartMapSensorSeriesActions",
        "buildActiveSensorSeries",
        "resampleSensorsFromDiffusion",
        "seedDemoSensors",
        "computeSmartMapLightweightGasConcentration",
        "normalizeSmartMapPoint",
        "sensorReadingRecords",
    )
    required_device_image_fragments = (
        "useSmartMapDeviceImage",
        "sensorDeviceCard",
        "getSensorDeviceImage",
        "sensorDeviceImageCache",
        "deviceFullscreenVisible",
        "onDeviceImgWheel",
        "onDeviceImgDragStart",
        "deviceImgZoomReset",
    )
    required_diffusion_timeline_fragments = (
        "SmartMapDiffusionTimeline",
        "SmartMapDiffusionTimelineSummary",
        "timeline-panel",
        "update-speed",
        "update-loop",
    )
    required_device_fullscreen_fragments = (
        "SmartMapDeviceFullscreen",
        "device-fullscreen-overlay",
        "device-img-zoom-bar",
        "defineEmits",
        "zoom-reset",
    )
    required_sensor_edit_dialog_fragments = (
        "SmartMapSensorEditDialog",
        "sensor-edit-overlay",
        "update-draft",
        "SmartMapSensorEditDraft",
    )
    required_search_box_fragments = (
        "SmartMapSearchBox",
        "search-box",
        "update:modelValue",
        "handleInput",
    )
    required_legend_list_fragments = (
        "SmartMapLegendList",
        "legend-list",
        "legend-swatch",
        "legends",
    )
    required_zone_list_fragments = (
        "SmartMapZoneList",
        "zone-list",
        "zone-tag",
        "select-zone",
    )
    required_stats_grid_fragments = (
        "SmartMapStatsGrid",
        "stat-grid",
        "stat-value",
        "set-filter",
    )
    required_alert_list_fragments = (
        "SmartMapAlertList",
        "alert-list",
        "alert-icon",
        "alerts",
    )
    required_risk_stats_fragments = (
        "SmartMapRiskStats",
        "SmartMapRiskLevelSummary",
        "risk-stat-list",
        "riskItems",
    )
    required_weather_panel_fragments = (
        "SmartMapWeatherPanel",
        "SmartMapWeatherState",
        "SmartMapWeatherSource",
        "weather-stat-grid",
        "weather-observed-time",
    )
    required_layout_stats_fragments = (
        "SmartMapLayoutStats",
        "SmartMapCoverageSummary",
        "sensor-stat-grid",
        "riskCoverRate",
    )
    required_layout_actions_fragments = (
        "SmartMapLayoutActions",
        "sensor-layout-actions",
        "add-manual-sensor",
        "clear-all-sensors",
    )
    required_yolo_result_card_fragments = (
        "SmartMapYoloResultCard",
        "SmartMapYoloResult",
        "normalizeYoloImage",
        "modelVersion",
        "yolo-result-card",
    )
    required_sensor_history_chart_fragments = (
        "SmartMapSensorHistoryChart",
        "SmartMapSensorHistoryChart }",
        "sensor-history-chart-svg",
        "chart.currentLabel",
        "chart.warningY",
        "chart.peakLabel",
    )
    required_sensor_device_card_fragments = (
        "SmartMapSensorDeviceCard",
        "SmartMapDeviceImageCard",
        "open-fullscreen",
        "sensor-device-card",
        "card.deviceName",
        "card.concentration",
    )
    required_sampling_summary_fragments = (
        "SmartMapSamplingSummary",
        "summary.sampled",
        "summary.warning",
        "summary.danger",
        "当前帧有读数",
    )
    required_gas_editor_fragments = (
        "useSmartMapGasEditor",
        "gasPanelVisible",
        "gasEditDraft",
        "editGas",
        "removeGas",
        "resetGasDraft",
        "saveGasDraft",
        "GasSavePayload",
        "confirmDelete",
        "confirmGasDelete",
    )
    required_toast_fragments = (
        "useSmartMapToast",
        "SmartMapToastType",
        "toastVisible",
        "toastText",
        "toastType",
        "toastIcon",
        "showToast",
        "clearToastTimer",
        "toastIconFor",
    )
    required_toast_component_fragments = (
        "SmartMapToast",
        "SmartMapToastType",
        'class="toast"',
        "visible ? 'show' : ''",
    )
    required_validation_reports_fragments = (
        "useSmartMapValidationReports",
        "getBtexValidationReport",
        "getPrairieGrassSourceValidationReport",
        "unwrapAlgorithmReport",
        "loadBtexValidationReport",
        "loadPrairieGrassValidationReport",
        "btexValidationStatusClass",
        "btexValidationSummary",
        "prairieValidationStatusClass",
        "prairieValidationSummary",
    )
    required_placement_rules_fragments = (
        "computeSmartMapSensorRisk",
        "findNearestSmartMapFacility",
        "createSmartMapNearestFacilityLookup",
        "getSmartMapFacilitySensorAnchor",
        "isSmartMapPointNearFacility",
        "getSmartMapPriorityLabel",
        "getSmartMapPriorityColor",
        "SmartMapRiskGridCell",
    )
    required_sensor_placement_fragments = (
        "useSmartMapSensorPlacement",
        "sensorPlacementState",
        "manualSensorDraft",
        "manualSensorDraftValidation",
        "getNormalizedManualSensorDraft",
        "useSmartMapSensorPlacementCancelBridge",
        "setCancelSensorPickingAction",
        "setCancelSensorOriginPickingAction",
        "startManualSensorPicking",
        "captureManualSensorPoint",
        "cancelSensorPicking",
        "cancelSensorOriginPicking",
        "isSensorPicking",
        "isSensorOriginPicking",
        "getSensorPlacementOrigin",
        "confirmManualSensorPlacement",
        "placeManualSensorAtPoint",
        "generateSensorCode",
        "saveSensorToDB",
        "clearAllSensor",
        "deleteCurrSensor",
    )
    required_sensor_batch_import_fragments = (
        "useSmartMapSensorBatchImport",
        "batchImportText",
        "batchImportPreview",
        "parseBatchImport",
        "pasteFromClipboard",
        "executeBatchImport",
        "saveSensorToDB",
        "fetchSensorsFromDB",
    )
    required_sensor_readings_fragments = (
        "reqRecentSensorReadings",
        "SMART_MAP_MONITORING_DATA_TRUTH_MODE",
        "simulation_only",
        "mergeSmartMapSensorReadings",
        "sensor_reading_simulated",
        "qualityStatus",
        "SIMULATED",
        "trustedForRealValidation: false",
        "后端非仿真读数（需来源审计）",
        "backend_sensor_reading_table",
        "backend_sensor_reading_table_requires_source_audit",
    )
    required_sensor_editor_fragments = (
        "useSmartMapSensorEditor",
        "useSmartMapSensorEditorSyncBridge",
        "setSyncSensorEditorStateAction",
        "sensorEditorState",
        "manualSensorTarget",
        "openSensorEdit",
        "saveSensorEdit",
        "applySelectedSensorManualValueToCurrentFrame",
        "copyAutoSeriesToSelectedSensorManual",
        "clearSelectedSensorManualSeries",
    )
    required_sensor_info_fragments = (
        "buildSmartMapSensorInfo",
        "useSmartMapSensorInfoActions",
        "useSmartMapSensorInfoActionBridge",
        "setShowSensorInfoAction",
        "SmartMapSensorInfoActionOptions",
        "SmartMapSensorInfoOptions",
        "SmartMapSensorInfoRecord",
        "panelCollapsed",
        "manualSensorTargetId",
        "getCurrentConcentration",
        "getAutoConcentration",
        "resolveEffectiveRange",
        "resolveInstallationHeight",
        "resolveDetectionRange",
        "resolveInstallRemark",
        "经纬海拔",
    )
    required_sensor_hover_fragments = (
        "useSmartMapSensorHoverCard",
        "SmartMapSensorHoverCard",
        "hoveredSensorCard",
        "getCurrentGas",
        "getCurrentFrame",
        "getCurrentConcentration",
        "getAlarmLevel",
        "getPriorityLabel",
        "levelText",
        "coordLabel",
    )
    required_sensor_hover_component_fragments = (
        "SmartMapSensorHoverCard",
        "sensor-hover-card",
        "priorityColor",
        "SmartMapSensorHoverCard | null",
    )
    required_car_info_fragments = (
        "buildSmartMapCarInfo",
        "SmartMapCarInfoOptions",
        "SMART_MAP_CAR_GAS_NAMES",
        "formatCarThreshold",
        "navigateToCarDetail",
        "toggleCarWarning",
        "triggerYoloForCar",
        "AI巡检",
    )
    required_car_interaction_fragments = (
        "useSmartMapCarInteraction",
        "SmartMapCarInteractionLayerState",
        "carInteractionLayerState",
        "reqAnalyzePersonImage",
        "buildSmartMapCarInfo",
        "captureCarSnapshot",
        "buildYoloResult",
        "selectedCar",
        "hoveredCar",
        "yoloResult",
        "toggleCarWarning",
        "triggerYoloForCar",
    )
    required_algorithm_executors_fragments = (
        "runDiffusionSimulation",
        "runAnalyticCoarseSearch",
        "runAnalyticSourceInversion",
        "runParticleFilterInversion",
        "runEvacuationPlanning",
        "executeSmartMapDiffusion",
        "executeSmartMapCoarseSearch",
        "executeSmartMapParticleFilter",
        "executeSmartMapEvacuationPlanning",
    )
    required_algorithm_states_fragments = (
        "useSmartMapAlgorithmStates",
        "SmartMapExecutorState",
        "SmartMapSourceInversionState",
        "SmartMapSourceInversionRunState",
        "sourceInversionRunState",
        "SmartMapSourceInversionConfig",
        "SmartMapSourceRefinementConfig",
        "SmartMapParticleFilterConfig",
        "diffusionExecutorState",
        "evacuationExecutorState",
        "sourceInversionExecutorState",
        "sourceInversionConfig",
        "sourceRefinementConfig",
        "particleFilterConfig",
    )
    required_evacuation_planning_fragments = (
        "useSmartMapEvacuationPlanning",
        "SmartMapEvacuationRoute",
        "SmartMapEvacuationBatchResult",
        "SmartMapEvacuationLayerState",
        "evacuationLayerState",
        "evacuationSummary",
        "syncSelectedEvacuationCandidate",
        "syncSelectedEvacuationBuilding",
        "clearEvacuationPlanningState",
        "routeSummary",
    )
    required_evacuation_planning_actions_fragments = (
        "useSmartMapEvacuationPlanningActions",
        "resolveEvacuationStart",
        "runEvacuationPlanning",
        "runBatchEvacuationPlanning",
        "rerunEvacuationAfterDiffusion",
        "clearEvacuationPlanningSilently",
        "syncSelectedFacilityToEvacuationPlan",
        "executeSmartMapEvacuationPlanning",
        "getErrorMessage",
    )
    required_viewport_fragments = (
        "useSmartMapViewport",
        "SmartMapViewportRenderControls",
        "viewportRenderControls",
        "worldToScreen",
        "screenToWorld",
        "getBoundarySafeScale",
        "fitInitialMapView",
        "clampMapViewToCanvas",
        "applyWheelZoom",
        "focusWorldPoint",
    )
    required_viewport_controls_fragments = (
        "SmartMapViewportControls",
        "map-controls",
        "scale-bar",
        "toggle-labels",
    )
    required_bottom_toolbar_fragments = (
        "SmartMapBottomToolbar",
        "bottom-toolbar",
        "set-tool",
        "toggle-entrances",
        "toggle-sensor-ranges",
    )
    required_coordinate_display_fragments = (
        "SmartMapCoordinateDisplay",
        "coord-display",
        "coord-label",
        "longitude",
        "altitude",
    )
    required_runtime_display_fragments = (
        "useSmartMapRuntimeDisplay",
        "clock",
        "coordLongitude",
        "coordLatitude",
        "coordAltitude",
        "updateCoordDisplay",
        "updateClock",
    )
    required_weather_state_fragments = (
        "useSmartMapWeatherState",
        "SmartMapWeatherState",
        "SmartMapWeatherSource",
        "weatherState",
        "weatherSource",
        "initializeWeatherData",
        "'simulated'",
    )
    required_view_controls_fragments = (
        "useSmartMapViewControls",
        "SmartMapFilterKey",
        "setFilter",
        "selectZone",
        "setTool",
        "toggleHeatmap",
        "toggleEntrances",
        "toggleSensors",
        "toggleSensorRanges",
        "toggleLabels",
        "viewVisibility",
        "zoomReset",
        "onSearch",
    )
    required_canvas_shell_fragments = (
        "useSmartMapCanvasShell",
        "mapCanvasRef",
        "mapContainerRef",
        "isDragging",
        "viewMode",
        "scene3DRef",
    )
    required_measure_tool_fragments = (
        "useSmartMapMeasureTool",
        "SmartMapMeasureLayer",
        "SmartMapToolMode",
        "measureMode",
        "measureLayer",
        "addMeasurePoint",
        "setSmartMapTool",
        "drawSmartMapMeasure",
        "measureCursor",
    )
    required_canvas_interaction_fragments = (
        "useSmartMapCanvasInteraction",
        "onCanvasMouseDown",
        "onCanvasMouseMove",
        "onCanvasMouseUp",
        "onCanvasMouseLeave",
        "onCanvasWheel",
        "selectFacility",
        "selectSensor",
        "selectCandidate",
        "selectCar",
    )
    required_canvas_selection_actions_fragments = (
        "useSmartMapCanvasSelectionActions",
        "SmartMapCanvasSelectionActionOptions",
        "SmartMapCandidateSelection",
        "selectSensor",
        "selectCandidate",
        "selectFacility",
        "setSelectedFacilityById",
        "clearSelection",
        "selectCoarseCandidate(candidate.candidateId, true)",
    )
    required_core_state_fragments = (
        "useSmartMapCoreState",
        "SmartMapCoreLayerState",
        "coreLayerState",
        "const sensors = ref",
        "const gases = ref",
        "const riskGrid = ref",
        "const selectedSensor = ref",
        "getSensors",
        "getRiskGrid",
        "getSelectedSensorId",
    )
    required_leak_source_fragments = (
        "useSmartMapLeakSource",
        "leakSourceState",
        "buildLeakSourceValidation",
        "updateDiffusionMetaSource",
        "applyLeakSourcePoint",
        "applyMapLeakSourcePoint",
        "toggleLeakSourcePicking",
        "applyManualGeoLeakSource",
        "syncDiffusionSourceSelection",
        "useSelectedFacilityAsLeakSource",
        "currentLeakSourcePoint",
        "getCurrentLeakSourcePoint",
        "cancelLeakSourcePicking",
        "isLeakSourcePicking",
        "diffusionSourceLayer",
        "leakSourceEntryLabel",
        "leakSourceLocationText",
        "watch(() => options.diffusionForm.gasId",
        "watch(() => options.diffusionForm.sourceFacilityId",
    )
    required_workflow_steps_fragments = (
        "useSmartMapWorkflowSteps",
        "commandWorkflowSteps",
        "sourceWorkflowSteps",
        "SmartMapWorkflowStep",
        "diffusionRunState",
        "sourceInversionRunState",
        "options.currentLeakSourcePoint",
        "options.diffusionFrames",
        "options.activeEvacuationRoute",
        "options.observationSummary",
        "options.coarseCandidateRegions",
        "options.isDeepParticleResult",
    )
    required_diffusion_playback_fragments = (
        "useSmartMapDiffusionPlayback",
        "SmartMapDiffusionPlaybackState",
        "SmartMapDiffusionRunState",
        "diffusionRunState",
        "currentDiffusionFrame",
        "diffusionState",
        "getCurrentDiffusionFrame",
        "getCurrentDiffusionFrameIndex",
        "setDiffusionRunning",
        "resetDiffusionPlayback",
        "startDiffusionPlaybackFromFirstFrame",
        "toggleDiffusionPlayback",
        "seekDiffusionFrame",
        "stepDiffusionFrame",
        "updateDiffusionPlayback",
    )
    required_refinement_playback_fragments = (
        "useSmartMapRefinementPlayback",
        "SmartMapRefinementPlaybackState",
        "SmartMapRefinementLayerState",
        "refinementLayerState",
        "refinementState",
        "refinementCurrentIteration",
        "startRefinementPlayback",
        "resetRefinementPlayback",
        "toggleRefinementPlayback",
        "seekRefinementStep",
        "updateRefinementPlayback",
    )
    required_diffusion_scenario_fragments = (
        "useSmartMapDiffusionScenario",
        "PHASE1_DEFAULT_SCENARIO",
        "PHASE1_GASES",
        "diffusionGasOptions",
        "playbackSpeedOptions",
        "diffusionForm",
        "showAdvancedDiffusion",
        "showSourceInversionExpertSettings",
        "diffusionSourceOptions",
        "selectedDiffusionSource",
        "getSelectedDiffusionSource",
        "diffusionFrames",
        "diffusionMeta",
        "currentDiffusionGas",
        "getCurrentDiffusionGas",
    )
    required_diffusion_simulation_fragments = (
        "useSmartMapDiffusionSimulation",
        "buildDiffusionPayload",
        "resultToDiffusionMeta",
        "resetDiffusionMeta",
        "executeSmartMapDiffusion",
        "runDiffusionSimulation",
        "resetDiffusionSimulation",
        "rerunEvacuationAfterDiffusion",
        "sourceMapPoint",
        "sensorSeries",
    )
    required_diffusion_layer_fragments = (
        "drawSmartMapDiffusionLayer",
        "SmartMapDiffusionFrame",
        "SmartMapDiffusionCell",
        "SmartMapDiffusionBoundary",
        "SmartMapDiffusionSkeleton",
        "SmartMapDiffusionPlume",
        "boundaryPolygons",
        "contourSkeletons",
        "plume",
    )
    required_source_overlay_fragments = (
        "drawSmartMapSourceCandidateRegions",
        "drawSmartMapSourceRefinementOverlay",
        "SmartMapSourceCandidateRegion",
        "SmartMapSourceRefinementIteration",
        "SmartMapEstimatedSource",
        "drawRefinementPolygon",
        "drawEstimatedSourceIcon",
    )
    required_evacuation_canvas_fragments = (
        "drawSmartMapEvacuationRoutes",
        "SmartMapEvacuationRouteCanvasOptions",
        "drawSingleEvacuationRoute",
        "planningMode",
        "displayMode",
        "buildingRoutes",
        "activeRoute",
    )
    required_facility_canvas_fragments = (
        "getSmartMapFacilityBounds",
        "smartMapHasRadiusFacility",
        "drawSmartMapDiffusionSourceMarker",
        "drawSmartMapFacilitySelection",
        "drawSmartMapFacilityHover",
        "SmartMapFacilityBounds",
        "SmartMapSourceMarkerOptions",
    )
    required_entrance_canvas_fragments = (
        "drawSmartMapEntrances",
        "SmartMapEntranceCanvasItem",
        "SmartMapEntranceCanvasSize",
        "drawEntranceMarker",
        "drawEntranceTooltip",
        "drawEntranceConnector",
        "drawRoundedRect",
    )
    required_sensor_canvas_fragments = (
        "drawSmartMapSensors",
        "SmartMapSensorCanvasRecord",
        "SmartMapSensorCanvasOptions",
        "resolveRange",
        "getPriorityColor",
        "showSensorRanges",
        "selectedSensorId",
    )
    required_base_canvas_fragments = (
        "drawSmartMapGround",
        "drawSmartMapRoads",
        "drawSmartMapKeyAreas",
        "drawSmartMapPipes",
        "drawSmartMapBuildings",
        "drawSmartMapTanks",
        "drawSmartMapTowers",
        "drawSmartMapLabels",
        "drawSmartMapHeatmap",
        "getSmartMapFacilityBounds",
        "smartMapHasRadiusFacility",
    )
    required_hit_testing_fragments = (
        "useSmartMapHitTestingActions",
        "SmartMapHitTestingActionsOptions",
        "SmartMapHitTestingLayer",
        "smartMapFacilityMatchesFilter",
        "getSmartMapVisibleEntrances",
        "smartMapFacilityHitTest",
        "smartMapEntranceHitTest",
        "smartMapCandidateRegionHitTest",
        "smartMapPointHitTest",
    )
    required_info_panel_fragments = (
        "useSmartMapInfoPanel",
        "SmartMapInfoPanelContent",
        "SmartMapFacilityLayerState",
        "facilityLayerState",
        "selectedFacility",
        "hoveredFacility",
        "hoveredEntrance",
        "hoveredSensor",
        "panelCollapsed",
        "setInfoPanel",
        "showFacilityInfo",
        "clearFacilityInfo",
    )
    required_facility_info_fragments = (
        "buildSmartMapFacilityInfo",
        "smartMapStatusTagClass",
        "getSmartMapZoneName",
        "SmartMapInfoRow",
        "SmartMapInfoSubtitle",
    )
    required_risk_grid_fragments = (
        "computeSmartMapRiskGrid",
        "useSmartMapRiskGridActions",
        "calculateSmartMapSensorCoverage",
        "summarizeSmartMapRiskGrid",
        "drawSmartMapRiskGrid",
        "getSmartMapDynamicSensorDistance",
        "SMART_MAP_SENSOR_LAYOUT_CONFIG",
        "isSmartMapDownwind",
    )
    required_risk_summary_fragments = (
        "useSmartMapRiskSummary",
        "SmartMapCoverageSummary",
        "SmartMapRiskLevelSummary",
        "layoutResult",
        "riskStat",
        "calcCoverage",
        "updateRiskStat",
        "calculateCoverage",
        "summarizeRiskGrid",
    )
    required_sensor_layout_fragments = (
        "buildSmartMapBaseStandardLayout",
        "buildSmartMapStandardSensorLayout",
        "generateSmartMapSensorCode",
        "resetSmartMapSensorCodeCounters",
        "REAL_SENSOR_LAYOUT",
        "getSmartMapDynamicSensorDistance",
    )
    required_canvas_layer_fragments = (
        "drawSmartMapEntranceLayer",
        "drawSmartMapCarLayer",
        "drawSmartMapDiffusionLayerState",
        "drawSmartMapDiffusionSourceLayer",
        "drawSmartMapRiskGridLayer",
        "drawSmartMapSensorLayer",
        "SmartMapEntranceLayerOptions",
        "SmartMapSensorLayerOptions",
    )
    required_canvas_runtime_fragments = (
        "useSmartMapCanvasRuntime",
        "bindCanvasFromRefs",
        "resizeCanvas",
        "requestAnimationFrame",
        "onAnimationFrame",
        "onAfterRuntimeStart",
        "onBeforeRuntimeStop",
        "watch(options.viewMode",
    )
    required_lifecycle_coordinator_fragments = (
        "useSmartMapLifecycleCoordinator",
        "handleCanvasReady",
        "handleAnimationFrame",
        "startBusinessRuntime",
        "stopBusinessRuntime",
        "watch(() => options.diffusionState.currentFrame",
        "watch(() => options.selectedFacility.value?.id",
        "options.diffusionForm.sourceRate",
        "options.clearSourceInversionRefinement(false)",
        "options.clearEvacuationPlanning(true)",
        "setInterval(options.refreshCarData",
    )
    required_renderer_fragments = (
        "useSmartMapRenderer",
        "withMapBoundaryClip",
        "drawSmartMapGround",
        "drawSmartMapDiffusionLayerState",
        "drawSmartMapSourceCandidateRegions",
        "drawSmartMapSourceRefinementOverlay",
        "drawSmartMapEvacuationRoutes",
        "drawSmartMapRiskGridLayer",
        "drawSmartMapSensorLayer",
        "drawSmartMapDiffusionSourceLayer",
        "drawSmartMapEntranceLayer",
        "drawSmartMapCarLayer",
    )
    required_render_bridge_fragments = (
        "useSmartMapRenderBridge",
        "SmartMapRendererLike",
        "bindCanvas",
        "bindRuntimeCanvas",
        "createRenderImage",
        "setRenderer",
        "getCanvas",
        "setCanvasCursor",
        "renderer?.render(context, canvasEl)",
    )
    required_page_actions_fragments = (
        "useSmartMapPageActions",
        "navigateToSmartMapCarDetail",
        "clearSmartMapInfo",
        "createSmartMapInfoClearAction",
        "SmartMapClearInfoOptions",
        "navigateToCarDetail",
        "goBackHome",
        "zoomToSensor",
        "closeInfo",
        "runConditionedDiffusionDemo",
        "getPhase1LeakSources",
        "focusSmartMapSensorPoint",
        "options.runDiffusionSimulation",
    )
    required_source_workflow_state_fragments = (
        "useSmartMapSourceWorkflowState",
        "SmartMapSourceWorkflowLayerState",
        "sourceWorkflowLayerState",
        "observationPayload",
        "observationPayloadPreview",
        "coarseCandidateRegions",
        "selectedCoarseCandidate",
        "isDeepParticleResult",
        "refinementIterations",
        "refinementInputSummary",
        "buildSmartMapParticleFilterHistoryIterations",
    )
    required_observation_builders_fragments = (
        "useSmartMapObservationBuilders",
        "getObservationSensorsWithSignals",
        "createObservationPayload",
        "getObservationReadySensors",
        "getInversionObservationSensors",
        "buildObservationSummary",
        "refreshSensorReadingsForObservation",
        "createParticleFilterPayload",
        "createSmartMapObservationPayload",
        "interface SmartMapObservationFrameLike extends SmartMapRecord",
        "interface SmartMapObservationDiffusionForm extends SmartMapRecord",
        "interface SmartMapObservationSourceConfig extends SmartMapRecord",
        "interface SmartMapObservationParticleConfig extends SmartMapRecord",
    )
    required_source_inversion_actions_fragments = (
        "useSmartMapSourceInversionActions",
        "runAnalyticCoarseSearchPreview",
        "clearAnalyticCoarseSearch",
        "selectCoarseCandidate",
        "runAnalyticRefinementPreview",
        "runParticleFilterInversionPreview",
        "clearSourceInversionRefinement",
        "clearSourceInversionWorkflow",
        "executeSmartMapParticleFilter",
    )
    required_observation_payload_actions_fragments = (
        "useSmartMapObservationPayloadActions",
        "setObservationPayloadState",
        "prepareObservationDataset",
        "generateObservationPayloadExport",
        "exportObservationPayloadJson",
        "formalValidationAllowed",
        "URL.createObjectURL",
    )
    required_monitoring_summary_fragments = (
        "useSmartMapMonitoringSummaryState",
        "matchedSensorReadingCount",
        "sensorReadingStatusText",
        "sensorReadingBoundaryText",
        "isSimulatedConcentration",
        "selectedDiffusionSource",
        "diffusionSummary",
        "diffusionModelLabel",
        "diffusionConditionLabel",
        "sensorSamplingSummary",
    )
    required_selection_display_fragments = (
        "useSmartMapSelectionDisplayState",
        "selectedSensorHistoryChart",
        "inversionObservationSummary",
        "getObservationReadySensors",
        "getInversionObservationSensors",
    )
    required_lightweight_concentration_fragments = (
        "computeSmartMapLightweightGasConcentration",
        "normalizeSmartMapPoint",
        "Formal diffusion fields",
        "sensor_reading records",
        "densityRatio",
        "diffusionBias",
    )
    required_sensor_dimensions_fragments = (
        "createSmartMapSensorRenderRules",
        "resolveSmartMapSensorInstallationHeight",
        "resolveSmartMapSensorEffectiveRange",
        "resolveSmartMapSensorDetectionRange",
        "resolveSmartMapSensorInstallRemark",
        "MANUAL_SENSOR_DEFAULTS",
        "normalizeSmartMapManualSensorNumber",
    )
    required_sensor_focus_fragments = (
        "focusSmartMapSensorPoint",
        "targetScale",
        "viewState.offsetX",
        "viewState.offsetY",
    )
    required_sensor_catalog_fragments = (
        "export interface ParkSensorType",
        "export const sensorTypes",
        "export const sensorDeviceMap",
        "export function getSensorDevice",
    )
    required_simulation_monitoring_api_fragments = (
        "SensorReadingRecord",
        "reqRecentSensorReadings",
        "/simulation-monitoring/readings/recent",
    )
    forbidden_index_fragments = (
        "/sensor/list",
        "/sensor/add",
        "/sensor/update",
        "/sensor/delete",
        "/gas/list",
        "/gas/add",
        "/gas/update",
        "/gas/delete",
        "reqSensorList",
        "reqGasList",
        "carPatrolState",
        "function syncCarMarkers",
        "function syncCarMobileSensors",
        "function updateCarPatrol",
        "function carHitTest",
        "function findNearestFacility",
        "function showSensorInfo(s: SmartSensor)",
        "let ctx =",
        "let canvasEl =",
        "function render()",
        "@/data/parkAssets",
        "smartMapRenderer.render(ctx, canvasEl)",
        "getCanvas: () => canvasEl",
        "canvasEl.style.cursor",
        '<div class="search-box">',
        'placeholder="搜索设施 / 区域..."',
        '<div class="legend-list">',
        'class="legend-item"',
        '<div class="zone-list">',
        'class="zone-item"',
        '<div class="stat-grid">',
        'class="stat-card"',
        '<div class="alert-list">',
        'class="alert-item"',
        '<div class="risk-stat-list">',
        'class="risk-stat-item"',
        "weatherSource === 'real' ? 'tag tag-green' : 'tag tag-gray'",
        'style="grid-template-columns:1fr 1fr 1fr;"',
        "weatherState.windSpeed.toFixed",
        "weatherState.obsTime",
        '<div class="sensor-stat-grid">',
        "layoutResult.sensorCount",
        "layoutResult.coverageRate",
        "layoutResult.riskCoverRate",
        "layoutResult.totalCost",
        "sensor-btn-group",
        'style="margin-top:12px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;"',
        "normalizeYoloImage(yoloResult.imageBase64)",
        "yoloResult.modelVersion",
        'class="yolo-result-card"',
        "selectedSensorHistoryChart.currentLabel",
        'class="sensor-history-svg"',
        "selectedSensorHistoryChart.warningY",
        '<polyline :points="selectedSensorHistoryChart.points"',
        "selectedSensorHistoryChart.peakLabel",
        'class="sensor-device-card"',
        "sensorDeviceCard.deviceName",
        "sensorDeviceCard.concentration",
        "当前帧有读数 {{ sensorSamplingSummary.sampled }} 个",
        "预警 {{ sensorSamplingSummary.warning }} 个",
        "危险 {{ sensorSamplingSummary.danger }} 个",
        "sensor-btn-white",
        "sensor-device-thumb",
        '<div v-if="sensorEditVisible" class="sensor-edit-overlay"',
        "sensorEditVisible = false",
        'v-model.number="sensorEditDraft.installationHeight"',
        'v-model.trim="sensorEditDraft.detectionRange"',
        '<div v-if="hoveredSensorCard" class="sensor-hover-card"',
        "hoveredSensorCard.id",
        "getPriorityColor(hoveredSensorCard.priority)",
        'class="toast"',
        "toastVisible ? 'show' : ''",
        '<div v-if="diffusionFrames.length" class="timeline-panel"',
        "seekDiffusionFrame(Number(eventValue($event)))",
        'v-model.number="diffusionState.speed"',
        'v-model="diffusionState.loop"',
        '<div class="scale-bar">',
        '<div class="map-controls">',
        'class="map-btn" @click="zoomIn"',
        'class="map-btn" @click="zoomOut"',
        '<div class="bottom-toolbar">',
        '<div class="coord-display" aria-live="polite">',
        "{{ coordLongitude }}",
        "{{ coordLatitude }}",
        "{{ coordAltitude }}",
        "new Image()",
        ".onload = () => render()",
        "const mapCanvasRef = ref",
        "const mapContainerRef = ref",
        "const isDragging = ref",
        "const viewMode = ref",
        "const scene3DRef = ref",
        "const sensors = ref",
        "const gases = ref",
        "const riskGrid = ref",
        "const selectedSensor = ref",
        "as unknown as DiffusionFrame",
        "as unknown as SmartMapRecord",
        "onCanvasBound: (canvas",
        "getCurrentLeakSourcePoint: () => currentLeakSourcePoint.value",
        "getInitialSourcePoint: () => getFacilityAnchorPoint(getSelectedDiffusionSource())",
        "getDiffusionSourcePoint: () => diffusionMeta.value.sourcePoint || currentLeakSourcePoint.value",
        "getDiffusionSourceName: () => (diffusionMeta.value.sourceFacility || getSelectedDiffusionSource())?.name",
        "showDiffusionSourceName: () => leakSourceState.mode !== 'facility'",
        "showCars: () => showCars.value",
        "getCarMarkers: () => carMarkers.value",
        "getMobileSensorReadings: () => mobileSensorReadings.value",
        "hasMeasurePoints,",
        "drawMeasure: drawSmartMapMeasure",
        "getSelectedFacility: () => selectedFacility.value",
        "getHoveredFacility: () => hoveredFacility.value",
        "getHoveredEntrance: () => hoveredEntrance.value",
        "getSelectedCar: () => selectedCar.value",
        "getHoveredCar: () => hoveredCar.value",
        "getEvacuationPlanningMode: () => evacuationPlanningMode.value",
        "getEvacuationDisplayMode: () => evacuationDisplayMode.value",
        "getActiveEvacuationRoute: () => activeEvacuationRoute.value",
        "getEvacuationBuildingRoutes: () => evacuationBuildingRoutes.value",
        "getSelectedEvacuationBuildingRoute: () => selectedEvacuationBuildingRoute.value",
        "getCoarseCandidateRegions: () => coarseCandidateRegions.value",
        "getSelectedCoarseCandidateId: () => selectedCoarseCandidateId.value",
        "getRefinementCurrentIteration: () => refinementCurrentIteration.value",
        "getEstimatedSource: () => refinementResult.value?.estimatedSource",
        "isRefinementEmphasized: () => Boolean(refinementCurrentIteration.value",
        "getSelectedSensorId,",
        "matchFilter: smartMapHitTesting.matchFilter",
        "getFacilityBounds: smartMapHitTesting.getFacilityBounds",
        "getVisibleEntrances: smartMapHitTesting.getVisibleEntrances",
        "defaultSensorRange: MANUAL_SENSOR_DEFAULTS.effectiveRange",
        "resolveSensorRange: resolveSensorEffectiveRange",
        "clampMapViewToCanvas,",
        "buildFrameSeriesTemplate: () => buildFrameSeriesTemplate()",
        "normalizeManualSeries: (manualSeries, frames) => normalizeManualSeries(manualSeries, frames)",
        "diffusionRunning: () => diffusionState.running",
        "isDiffusionRunning: () => diffusionState.running",
        "sourceInversionCoarseRunning: () => sourceInversionState.coarseRunning",
        "sourceInversionParticleRunning: () => sourceInversionState.particleRunning",
        "getOrigin: () => sensorPlacementState.origin",
        "rerunEvacuationAfterDiffusion: () => {",
        "clearEvacuationPlanning: () => clearEvacuationPlanning(true)",
        "leakSourcePicking: () => leakSourceState.picking",
        "sensorPicking: () => sensorPlacementState.picking",
        "sensorOriginPicking: () => sensorPlacementState.pickingOrigin",
        "getCurrentFrame: () => currentDiffusionFrame.value",
        "getCurrentFrameIndex: () => diffusionState.currentFrame",
        "getCurrentDiffusionFrame: () => currentDiffusionFrame.value",
        "getCurrentGas: () => diffusionMeta.value.gas || getGasById(diffusionForm.gasId)",
        "getCurrentDiffusionGas: () => currentDiffusionGas.value",
        "clearInfo: () => clearSmartMapInfo({ clearFacilityInfo, selectedZone, selectedCar })",
        "getRiskGrid: () => riskGrid.value",
        "getSensors: () => sensors.value",
        "getSelectedSensorId: () => selectedSensor.value?.id",
        "showHeatmap: () => showHeatmap.value",
        "showLabels: () => showLabels.value",
        "showSensors: () => showSensors.value",
        "showSensorRanges: () => showSensorRanges.value",
        "showEntrances: () => showEntrances.value",
        "selectedDiffusionSource.value",
        "syncSensorEditorState: sensor =>",
        "confirmDelete: message => confirm(message)",
        "leakSourceState.picking = false",
        "sensorPlacementState.picking = false",
        "sensorPlacementState.pickingOrigin = false",
        "selectedFacility = facilityById.get(id)",
        "useRoute,",
        "useRoute }",
        "const route =",
        "const width = 280",
        "const bottom = 80",
        "sensor.sampledSeries.map((item: AnyRecord) => `${xAt",
        "sensorDeviceImageCache",
        "const sensorDeviceCard = computed",
        "getSensorDevice(selectedSensor.value)",
        "const deviceImgDragging",
        "function openDeviceFullscreen",
        "function onDeviceImgWheel",
        "function onDeviceImgDragStart",
        "<div v-if=\"deviceFullscreenVisible\" class=\"device-fullscreen-overlay\"",
        "ref=\"deviceImgWrapRef\"",
        "overallRealSourceTracingPassed",
        "medianSourceErrorM",
        "sourceLocalizationFailed",
        "getBtexValidationReport",
        "getPrairieGrassSourceValidationReport",
        "btexValidationReport = ref",
        "prairieValidationReport = ref",
        "function computeSensorRisk",
        "function getFacilitySensorAnchor",
        "function getFacilitySensorSpan",
        "function isPointNearFacility",
        "function getPriorityLabel",
        "function getPriorityColor",
        "function getSensorCurrentConcentration",
        "function getSensorAutoConcentration",
        "function getSensorAlarmLevel",
        "function buildFrameSeriesTemplate",
        "function normalizeManualSeries",
        "function buildActiveSensorSeries",
        "function buildSensorHistoryChart",
        "function resampleSensorsFromDiffusion",
        "function seedDemoSensors",
        "function getObservationSensorsWithSignals",
        "function createObservationPayload",
        "function getObservationReadySensors",
        "function buildParticleFilterHistoryIterations",
        "function getInversionObservationSensors",
        "function buildObservationSummary",
        "async function refreshSensorReadingsForObservation",
        "function buildParticleFilterBounds",
        "function createParticleFilterPayload",
        "async function runAnalyticCoarseSearchPreview",
        "function clearAnalyticCoarseSearch",
        "function selectCoarseCandidate",
        "function buildCurrentRefinementInput",
        "async function runAnalyticRefinementPreview",
        "async function runParticleFilterInversionPreview",
        "function clearSourceInversionRefinement",
        "function clearSourceInversionWorkflow",
        "function resolveEvacuationStart",
        "function runEvacuationPlanning",
        "function runBatchEvacuationPlanning",
        "function clearEvacuationPlanning",
        "function selectEvacuationBuilding",
        "function selectEvacuationCandidate",
        "const sensorPlacementState = reactive",
        "function createManualSensorDraft",
        "function resetManualSensorDraft",
        "function startManualSensorPicking",
        "function captureManualSensorPoint",
        "function confirmManualSensorPlacement",
        "function placeManualSensorAtPoint",
        "function addManualSensor",
        "function clearAllSensor",
        "function deleteCurrSensor",
        "const batchImportText = ref",
        "const batchImportPreview = ref",
        "function parseBatchImport",
        "async function pasteFromClipboard",
        "async function executeBatchImport",
        "from '@/api/algorithm'",
        "apiRunDiffusionSimulation",
        "apiAnalyticCoarseSearch",
        "apiAnalyticSourceInversion",
        "apiParticleFilterInversion",
        "apiRunEvacuationPlanning",
        "const evacuationPlan = ref",
        "const evacuationBatchResult = ref",
        "const evacuationSummary = computed",
        "const evacuationBuildingRoutes = computed",
        "const evacuationCandidateRoutes = computed",
        "const sensorEditorState = reactive",
        "function syncSensorEditorState",
        "function updateSensorById",
        "function setSelectedSensorMode",
        "function applySelectedSensorManualValueToCurrentFrame",
        "function fillSelectedSensorManualSeries",
        "function copyAutoSeriesToSelectedSensorManual",
        "function clearSelectedSensorManualSeries",
        "const autoSampledSensors = attachSensorSampleSeries",
        "mergeSmartMapSensorReadings(",
        "baseConc * timeFactor",
        "const SENSOR_LAYOUT_CONFIG = {",
        "function dynamicMinDistance",
        "function isDownwind",
        "function hexToRgb",
        "const gridW = Math.ceil(REAL_MAP.width",
        "facilityPoints.forEach",
        "const SENSOR_CODE_COUNTERS",
        "function generateSensorCode",
        "function resetSensorCodeCounters",
        "function generateBaseStandardLayout",
        "function generateStandardBasedSensorLayout",
        "REAL_SENSOR_LAYOUT.map",
        "function worldToScreen",
        "function screenToWorld",
        "function fitInitialMapView",
        "function getBoundarySafeScale",
        "function clampMapViewToCanvas",
        "function hitTest",
        "function entranceHitTest",
        "function candidateRegionHitTest",
        "const getVisibleEntrances",
        "const matchFilter",
        "const hitTest",
        "const entranceHitTest",
        "const candidateRegionHitTest",
        "const sensorHitTest",
        "function onCanvasMouseDown",
        "function onCanvasMouseMove",
        "function onCanvasMouseUp",
        "function onCanvasMouseLeave",
        "function onCanvasWheel",
        "let measurePoints",
        "function drawMeasure",
        "ctx.moveTo(measurePoints",
        "measurePoints.push",
        "function statusTagClass",
        "function getZoneName",
        "const rows = []",
        "manualSeries?: AnyRecord[]",
        "autoSampledSeries?: AnyRecord[]",
        "sampledSeries?: AnyRecord[]",
        "type AnyRecord = Record<string, any>",
        "observationPayload = ref<AnyRecord",
        "observationSummary = ref<AnyRecord",
        "coarseSearchResult = ref<AnyRecord",
        "coarseSearchSummary = ref<AnyRecord",
        "refinementInput = ref<AnyRecord",
        "refinementResult = ref<AnyRecord",
        "function buildParticleFilterHistoryIterations(result: AnyRecord",
        "function buildObservationSummary(payload: AnyRecord",
        "function createParticleFilterPayload(exportPayload: AnyRecord",
        "function buildFrameSeriesTemplate(frames: AnyRecord",
        "function normalizeManualSeries(manualSeries: AnyRecord",
        "function buildActiveSensorSeries(sensorList: Array<SensorRecord | AnyRecord>",
        "function getSensorAlarmLevel(concentration: number, gas: AnyRecord",
        "function zoomToSensor(sensor: AnyRecord",
        "getCurrentConcentration: sensor => getSensorCurrentConcentration(sensor as AnyRecord)",
        "function getSensorCurrentConcentration(sensor: SmartSensor | AnyRecord",
        "diffusionMeta = ref<AnyRecord>",
        "getCurrentFrame: () => currentDiffusionFrame.value as AnyRecord",
        "function updateDiffusionMetaSource({ sourceFacility, sourcePoint }: { sourceFacility?: AnyRecord",
        "function applyLeakSourcePoint(point: AnyRecord",
        "const result = diffusionResult as AnyRecord",
        "syncSelectedEvacuationCandidate(routePlan: AnyRecord",
        "syncSelectedEvacuationBuilding(batchResult: AnyRecord",
        "evacuationResult as AnyRecord",
        ") as AnyRecord[]",
        "type EntranceLike = AnyRecord",
        "type CandidateRegion = AnyRecord",
        "riskGrid = ref<AnyRecord",
        "generateStandardBasedSensorLayout(grid: AnyRecord",
        "cell: AnyRecord",
        "function drawDiffusionBoundary",
        "function drawDiffusionSkeleton",
        ";(frame.cells as AnyRecord[])",
        "function drawSourceInversionCandidateRegions",
        "function drawSourceInversionRefinementOverlay",
        "function drawRefinementPolygon",
        "function drawEstimatedSourceIcon",
        "const regions: AnyRecord[] = coarseSearchResult.value?.candidateRegions",
        "function drawEvacuationRoute",
        "function drawSingleEvacuationRoute",
        "route: AnyRecord",
        "function getFacilityBounds",
        "function hasRadiusFacility",
        "function drawSelection",
        "function drawHover",
        "const pulse = 6 + Math.sin(Date.now() / 240)",
        "function drawRoundedRect",
        "function drawEntranceConnector",
        "function drawEntranceMarker",
        "function drawEntranceTooltip",
        "entrances.forEach(drawEntranceMarker)",
        "const ss = Math.max(0.1, viewState.scale || 1)",
        "const riskColorRgb = hexToRgb(riskColor)",
        "function drawGround",
        "function drawRoads",
        "function drawKeyAreas",
        "function drawPipes",
        "function drawBuildings",
        "function drawTanks",
        "function drawTowers",
        "function drawLabels",
        "function drawHeatmap",
        "drawSmartMapCars(",
        "drawSmartMapEntrances(",
        "drawSmartMapDiffusionLayer(",
        "drawSmartMapDiffusionSourceMarker(",
        "drawSmartMapRiskGrid(",
        "drawSmartMapSensors(",
        "function drawEntrances",
        "function drawCars",
        "function drawDiffusionSourceMarker",
        "function drawRiskGrid",
        "function drawSensors",
        "buildSmartMapSensorInfo({",
        "panelCollapsed.value = false",
        "manualSensorTargetId.value = s.id",
        "let lastAnimTime",
        "function resizeCanvas",
        "function animate",
        "onMounted(",
        "onUnmounted(",
        "nextTick(",
        "requestAnimationFrame(animate",
        "cancelAnimationFrame(",
        "setInterval(updateClock",
        "window.addEventListener('resize'",
        "window.removeEventListener('resize'",
        "watch(() => diffusionState.currentFrame",
        "watch(() => selectedFacility.value?.id",
        "setInterval(refreshCarData",
        "clearInterval(carRefreshTimer.value",
        "onCanvasReady: () =>",
        "onAnimationFrame: (deltaMs)",
        "onAfterRuntimeStart: () =>",
        "onBeforeRuntimeStop: () =>",
        "function withMapBoundaryClip",
        "function drawDiffusionLayer",
        "drawSmartMapGround(",
        "drawSmartMapSourceCandidateRegions(",
        "drawSmartMapSourceRefinementOverlay(",
        "drawSmartMapEvacuationRoutes(",
        "drawSmartMapRiskGridLayer(",
        "drawSmartMapSensorLayer(",
        "drawSmartMapDiffusionSourceLayer(",
        "drawSmartMapEntranceLayer(",
        "drawSmartMapCarLayer(",
        "function zoomToSensor",
        "function closeInfo",
        "const goBackHome",
        "async function runConditionedDiffusionDemo",
        "getPhase1LeakSources(facilities",
        "function navigateToCarDetail",
        "function showFacilityInfo",
        "function clearInfo",
        "selectSensor: sensor =>",
        "selectCandidate: candidate =>",
        "selectFacility: facility =>",
        "clearSelection: () =>",
        "showFacilityInfo: facility => showFacilityInfoPanel(facility, zones)",
        "applyLeakSourcePoint: point => applyLeakSourcePoint(point, 'map')",
        "findNearestFacility: (x, y) => findNearestSmartMapFacility(x, y, facilities)",
        "findNearestFacility = (x: number, y: number) => findNearestSmartMapFacility(x, y, facilities)",
        "getSelectedFacilityId: () => selectedFacility.value?.id || ''",
        "getWeather: () => weatherState.value",
        "navigateToCarDetail: carId => navigateToSmartMapCarDetail(router, carId)",
        "calculateCoverage: options => calculateSmartMapSensorCoverage",
        "getInversionObservationSensors: () => getInversionObservationSensors()",
        "getObservationReadySensors: () => getObservationReadySensors()",
        "cancelSensorPicking: () => cancelSensorPicking()",
        "cancelSensorOriginPicking: () => cancelSensorOriginPicking()",
        "buildParticleFilterHistoryIterations: result => buildParticleFilterHistoryIterations(result)",
        "computeSmartMapRiskGrid as buildSmartMapRiskGrid",
        "function computeRiskGrid",
        "const leakSourceState = reactive",
        "function buildLeakSourceValidation",
        "function updateDiffusionMetaSource",
        "function applyLeakSourcePoint",
        "function toggleLeakSourcePicking",
        "function applyManualGeoLeakSource",
        "function syncDiffusionSourceSelection",
        "function useSelectedFacilityAsLeakSource",
        "const currentLeakSourcePoint = computed",
        "const leakSourceEntryLabel = computed",
        "const leakSourceLocationText = computed",
        "const commandWorkflowSteps = computed",
        "const sourceWorkflowSteps = computed",
        "const diffusionState = reactive",
        "const currentDiffusionFrame = computed",
        "function toggleDiffusionPlayback",
        "function seekDiffusionFrame",
        "function stepDiffusionFrame",
        "function updateDiffusionPlayback",
        "const refinementState = reactive",
        "function toggleRefinementPlayback",
        "function seekRefinementStep",
        "function updateRefinementPlayback",
        "const diffusionExecutorState = reactive",
        "const evacuationExecutorState = reactive",
        "const sourceInversionExecutorState = reactive",
        "const sourceInversionState = reactive",
        "const sourceInversionConfig = reactive",
        "const sourceRefinementConfig = reactive",
        "const particleFilterConfig = reactive",
        "const diffusionGasOptions = PHASE1_GASES",
        "const initialDiffusionSourceOptions = getPhase1LeakSources",
        "const playbackSpeedOptions = [0.5, 1, 1.5, 2]",
        "const diffusionForm = reactive",
        "const showAdvancedDiffusion = ref",
        "const showSourceInversionExpertSettings = ref",
        "const diffusionSourceOptions = computed",
        "const diffusionFrames = ref<SmartMapDiffusionFrame[]>",
        "const diffusionMeta = ref<SmartMapDiffusionMeta>",
        "const currentDiffusionGas = computed",
        "const observationPayload = ref",
        "const coarseSearchResult = ref",
        "const selectedCoarseCandidateId = ref",
        "const refinementInput = ref",
        "const refinementResult = ref",
        "const refinementSummary = ref",
        "const observationPayloadPreview = computed",
        "const coarseCandidateRegions = computed",
        "const selectedCoarseCandidate = computed",
        "const isDeepParticleResult = computed",
        "const refinementIterations = computed",
        "const refinementInputSummary = computed",
        "const matchedSensorReadingCount = computed",
        "const sensorReadingStatusText = computed",
        "const sensorReadingBoundaryText = computed",
        "const isSimulatedConcentration = computed",
        "const selectedDiffusionSource = computed",
        "const diffusionSummary = computed",
        "const diffusionModelLabel = computed",
        "const diffusionConditionLabel = computed",
        "const sensorSamplingSummary = computed",
        "computed(",
        "type PointLike =",
        "function computeGasConcentration",
        "function normalizeMapPoint",
        "前端轻量物理响应",
        "const selectedCar = ref",
        "const hoveredCar = ref",
        "const yoloResult = ref",
        "function handleCarClick",
        "function showCarInfo",
        "const triggerYoloForCar",
        "const toggleCarWarning",
        "reqAnalyzePersonImage",
        "buildSmartMapCarInfo",
        "captureCarSnapshot",
        "buildYoloResult",
        "function resolveSensorInstallationHeight",
        "function resolveSensorEffectiveRange",
        "function resolveSensorDetectionRange",
        "function resolveSensorInstallRemark",
        "function setObservationPayloadState",
        "function prepareObservationDataset",
        "function generateObservationPayloadExport",
        "function exportObservationPayloadJson",
        "const targetScale = 2.0",
        "viewState.offsetX = canvasEl.width / 2 / targetScale",
        "const geo = formatGeoCoord(s.x, s.y)",
        "const currentConcentration = getSensorCurrentConcentration(s)",
        "const autoConcentration = getSensorAutoConcentration(s)",
        "const peakConcentration = s.sampledPeak || 0",
        "const effectiveRange = resolveSensorEffectiveRange",
        "const installationHeight = resolveSensorInstallationHeight(s)",
        "const detectionRange = resolveSensorDetectionRange(s)",
        "const installRemark = resolveSensorInstallRemark(s)",
        "{ key:'经纬海拔'",
        "const hoveredSensorCard = computed",
        "const sensor = hoveredSensor.value",
        "const level = getSensorAlarmLevel(concentration, gas)",
        "const pLabel = getPriorityLabel(sensor.priority)",
        "levelText: level === 'danger'",
        "infoTitle.value = `小车 ${car.id}`",
        "const gasName = ['',",
        "const thresholdText = threshold",
        "infoRows.value = [",
        "{ key: 'AI巡检'",
        "const clock = ref('--:--:--')",
        "const coordLongitude = ref",
        "const coordLatitude = ref",
        "const coordAltitude = ref",
        "function updateCoordDisplay",
        "function updateClock",
        "const weatherState = ref",
        "const weatherSource = ref",
        "function initializeWeatherData",
        "const layoutResult = ref",
        "const riskStat = ref",
        "function calcCoverage",
        "function updateRiskStat",
        "const selectedFacility = ref",
        "const hoveredFacility = ref",
        "const hoveredEntrance = ref",
        "const hoveredSensor = ref",
        "const panelCollapsed = ref",
        "const infoTitle = ref",
        "const infoSubtitle = ref",
        "const infoRows = ref",
        "buildSmartMapFacilityInfo(f, zones)",
        "async function runDiffusionSimulation",
        "function resetDiffusionSimulation",
        "executeSmartMapDiffusion(payload",
        "function editGas",
        "function removeGas",
        "function resetGasDraft",
        "function saveGasDraft",
        "function showToast",
        "toastTimer",
        "const toastVisible = ref",
        "function isFilterKey",
        "function setFilter",
        "function selectZone",
        "function setTool",
        "function toggleHeatmap",
        "function toggleEntrances",
        "function toggleSensors",
        "function toggleSensorRanges",
        "function toggleLabels",
        "function zoomReset",
        "function onSearch",
    )
    missing_index = [fragment for fragment in required_index_fragments if fragment not in index_text]
    missing_index_style = [fragment for fragment in required_index_style_fragments if fragment not in index_style_text]
    missing_helper = [fragment for fragment in required_helper_fragments if fragment not in helper_text]
    missing_catalog = [fragment for fragment in required_catalog_fragments if fragment not in catalog_text]
    missing_car_patrol = [fragment for fragment in required_car_patrol_fragments if fragment not in car_patrol_text]
    missing_sensor_series = [
        fragment for fragment in required_sensor_series_fragments if fragment not in sensor_series_text
    ]
    missing_sensor_series_actions = [
        fragment for fragment in required_sensor_series_actions_fragments
        if fragment not in sensor_series_actions_text
    ]
    missing_device_image = [
        fragment for fragment in required_device_image_fragments if fragment not in device_image_text
    ]
    missing_diffusion_timeline = [
        fragment for fragment in required_diffusion_timeline_fragments
        if fragment not in diffusion_timeline_text
    ]
    missing_device_fullscreen = [
        fragment for fragment in required_device_fullscreen_fragments
        if fragment not in device_fullscreen_text
    ]
    missing_emergency_scenario_panel = [
        fragment for fragment in required_emergency_scenario_panel_fragments
        if fragment not in emergency_scenario_panel_text
    ]
    missing_sensor_edit_dialog = [
        fragment for fragment in required_sensor_edit_dialog_fragments
        if fragment not in sensor_edit_dialog_text
    ]
    missing_search_box = [
        fragment for fragment in required_search_box_fragments if fragment not in search_box_text
    ]
    missing_legend_list = [
        fragment for fragment in required_legend_list_fragments if fragment not in legend_list_text
    ]
    missing_zone_list = [
        fragment for fragment in required_zone_list_fragments if fragment not in zone_list_text
    ]
    missing_stats_grid = [
        fragment for fragment in required_stats_grid_fragments if fragment not in stats_grid_text
    ]
    missing_alert_list = [
        fragment for fragment in required_alert_list_fragments if fragment not in alert_list_text
    ]
    missing_risk_stats = [
        fragment for fragment in required_risk_stats_fragments if fragment not in risk_stats_text
    ]
    missing_weather_panel = [
        fragment for fragment in required_weather_panel_fragments if fragment not in weather_panel_text
    ]
    missing_layout_stats = [
        fragment for fragment in required_layout_stats_fragments if fragment not in layout_stats_text
    ]
    missing_layout_actions = [
        fragment for fragment in required_layout_actions_fragments if fragment not in layout_actions_text
    ]
    missing_yolo_result_card = [
        fragment for fragment in required_yolo_result_card_fragments if fragment not in yolo_result_card_text
    ]
    missing_sensor_history_chart = [
        fragment for fragment in required_sensor_history_chart_fragments
        if fragment not in sensor_history_chart_text
    ]
    missing_sensor_device_card = [
        fragment for fragment in required_sensor_device_card_fragments
        if fragment not in sensor_device_card_text
    ]
    missing_sampling_summary = [
        fragment for fragment in required_sampling_summary_fragments
        if fragment not in sampling_summary_text
    ]
    missing_selected_sensor_actions = [
        fragment for fragment in required_selected_sensor_actions_fragments
        if fragment not in selected_sensor_actions_text
    ]
    missing_selected_sensor_data_panel = [
        fragment for fragment in required_selected_sensor_data_panel_fragments
        if fragment not in selected_sensor_data_panel_text
    ]
    missing_source_inversion_panel = [
        fragment for fragment in required_source_inversion_panel_fragments
        if fragment not in source_inversion_panel_text
    ]
    missing_coarse_candidate_panel = [
        fragment for fragment in required_coarse_candidate_panel_fragments
        if fragment not in coarse_candidate_panel_text
    ]
    missing_gas_editor_panel = [
        fragment for fragment in required_gas_editor_panel_fragments
        if fragment not in gas_editor_panel_text
    ]
    missing_sensor_batch_import_panel = [
        fragment for fragment in required_sensor_batch_import_panel_fragments
        if fragment not in sensor_batch_import_panel_text
    ]
    missing_observation_summary_panel = [
        fragment for fragment in required_observation_summary_panel_fragments
        if fragment not in observation_summary_panel_text
    ]
    missing_refinement_summary_panel = [
        fragment for fragment in required_refinement_summary_panel_fragments
        if fragment not in refinement_summary_panel_text
    ]
    missing_gas_editor = [
        fragment for fragment in required_gas_editor_fragments if fragment not in gas_editor_text
    ]
    missing_toast = [
        fragment for fragment in required_toast_fragments if fragment not in toast_text
    ]
    missing_toast_component = [
        fragment for fragment in required_toast_component_fragments
        if fragment not in toast_component_text
    ]
    missing_validation_reports = [
        fragment for fragment in required_validation_reports_fragments if fragment not in validation_reports_text
    ]
    missing_placement_rules = [
        fragment for fragment in required_placement_rules_fragments if fragment not in placement_rules_text
    ]
    missing_sensor_placement = [
        fragment for fragment in required_sensor_placement_fragments if fragment not in sensor_placement_text
    ]
    missing_sensor_batch_import = [
        fragment for fragment in required_sensor_batch_import_fragments if fragment not in sensor_batch_import_text
    ]
    missing_sensor_readings = [
        fragment for fragment in required_sensor_readings_fragments if fragment not in sensor_readings_text
    ]
    missing_sensor_editor = [
        fragment for fragment in required_sensor_editor_fragments if fragment not in sensor_editor_text
    ]
    missing_sensor_info = [
        fragment for fragment in required_sensor_info_fragments if fragment not in sensor_info_text
    ]
    missing_sensor_hover = [
        fragment for fragment in required_sensor_hover_fragments if fragment not in sensor_hover_text
    ]
    missing_sensor_hover_component = [
        fragment for fragment in required_sensor_hover_component_fragments
        if fragment not in sensor_hover_component_text
    ]
    missing_car_info = [
        fragment for fragment in required_car_info_fragments if fragment not in car_info_text
    ]
    missing_algorithm_executors = [
        fragment for fragment in required_algorithm_executors_fragments if fragment not in algorithm_executors_text
    ]
    missing_algorithm_states = [
        fragment for fragment in required_algorithm_states_fragments if fragment not in algorithm_states_text
    ]
    missing_evacuation_planning = [
        fragment for fragment in required_evacuation_planning_fragments if fragment not in evacuation_planning_text
    ]
    missing_evacuation_planning_actions = [
        fragment for fragment in required_evacuation_planning_actions_fragments
        if fragment not in evacuation_planning_actions_text
    ]
    missing_viewport = [
        fragment for fragment in required_viewport_fragments if fragment not in viewport_text
    ]
    missing_viewport_controls = [
        fragment for fragment in required_viewport_controls_fragments
        if fragment not in viewport_controls_text
    ]
    missing_bottom_toolbar = [
        fragment for fragment in required_bottom_toolbar_fragments
        if fragment not in bottom_toolbar_text
    ]
    missing_coordinate_display = [
        fragment for fragment in required_coordinate_display_fragments
        if fragment not in coordinate_display_text
    ]
    missing_runtime_display = [
        fragment for fragment in required_runtime_display_fragments if fragment not in runtime_display_text
    ]
    missing_weather_state = [
        fragment for fragment in required_weather_state_fragments if fragment not in weather_state_text
    ]
    missing_view_controls = [
        fragment for fragment in required_view_controls_fragments if fragment not in view_controls_text
    ]
    missing_canvas_shell = [
        fragment for fragment in required_canvas_shell_fragments if fragment not in canvas_shell_text
    ]
    measure_tool_text = measure_tool_file.read_text(encoding="utf-8", errors="replace")
    missing_measure_tool = [
        fragment for fragment in required_measure_tool_fragments if fragment not in measure_tool_text
    ]
    missing_canvas_interaction = [
        fragment for fragment in required_canvas_interaction_fragments if fragment not in canvas_interaction_text
    ]
    missing_canvas_selection_actions = [
        fragment for fragment in required_canvas_selection_actions_fragments
        if fragment not in canvas_selection_actions_text
    ]
    missing_core_state = [
        fragment for fragment in required_core_state_fragments if fragment not in core_state_text
    ]
    missing_leak_source = [
        fragment for fragment in required_leak_source_fragments if fragment not in leak_source_text
    ]
    missing_workflow_steps = [
        fragment for fragment in required_workflow_steps_fragments if fragment not in workflow_steps_text
    ]
    missing_diffusion_playback = [
        fragment for fragment in required_diffusion_playback_fragments if fragment not in diffusion_playback_text
    ]
    missing_refinement_playback = [
        fragment for fragment in required_refinement_playback_fragments if fragment not in refinement_playback_text
    ]
    missing_diffusion_scenario = [
        fragment for fragment in required_diffusion_scenario_fragments if fragment not in diffusion_scenario_text
    ]
    missing_diffusion_simulation = [
        fragment for fragment in required_diffusion_simulation_fragments if fragment not in diffusion_simulation_text
    ]
    missing_diffusion_layer = [
        fragment for fragment in required_diffusion_layer_fragments if fragment not in diffusion_layer_text
    ]
    missing_source_overlay = [
        fragment for fragment in required_source_overlay_fragments if fragment not in source_overlay_text
    ]
    missing_evacuation_canvas = [
        fragment for fragment in required_evacuation_canvas_fragments if fragment not in evacuation_canvas_text
    ]
    missing_facility_canvas = [
        fragment for fragment in required_facility_canvas_fragments if fragment not in facility_canvas_text
    ]
    missing_entrance_canvas = [
        fragment for fragment in required_entrance_canvas_fragments if fragment not in entrance_canvas_text
    ]
    missing_sensor_canvas = [
        fragment for fragment in required_sensor_canvas_fragments if fragment not in sensor_canvas_text
    ]
    missing_base_canvas = [
        fragment for fragment in required_base_canvas_fragments if fragment not in base_canvas_text
    ]
    missing_hit_testing = [
        fragment for fragment in required_hit_testing_fragments if fragment not in hit_testing_text
    ]
    missing_info_panel = [
        fragment for fragment in required_info_panel_fragments if fragment not in info_panel_text
    ]
    missing_facility_info = [
        fragment for fragment in required_facility_info_fragments if fragment not in facility_info_text
    ]
    missing_car_interaction = [
        fragment for fragment in required_car_interaction_fragments if fragment not in car_interaction_text
    ]
    missing_risk_grid = [
        fragment for fragment in required_risk_grid_fragments if fragment not in risk_grid_text
    ]
    missing_risk_summary = [
        fragment for fragment in required_risk_summary_fragments if fragment not in risk_summary_text
    ]
    missing_sensor_layout = [
        fragment for fragment in required_sensor_layout_fragments if fragment not in sensor_layout_text
    ]
    missing_canvas_layer = [
        fragment for fragment in required_canvas_layer_fragments if fragment not in canvas_layer_text
    ]
    missing_canvas_runtime = [
        fragment for fragment in required_canvas_runtime_fragments if fragment not in canvas_runtime_text
    ]
    missing_lifecycle_coordinator = [
        fragment for fragment in required_lifecycle_coordinator_fragments
        if fragment not in lifecycle_coordinator_text
    ]
    missing_renderer = [
        fragment for fragment in required_renderer_fragments if fragment not in renderer_text
    ]
    missing_render_bridge = [
        fragment for fragment in required_render_bridge_fragments if fragment not in render_bridge_text
    ]
    missing_page_actions = [
        fragment for fragment in required_page_actions_fragments if fragment not in page_actions_text
    ]
    missing_source_workflow_state = [
        fragment for fragment in required_source_workflow_state_fragments
        if fragment not in source_workflow_state_text
    ]
    missing_observation_builders = [
        fragment for fragment in required_observation_builders_fragments
        if fragment not in observation_builders_text
    ]
    missing_source_inversion_actions = [
        fragment for fragment in required_source_inversion_actions_fragments
        if fragment not in source_inversion_actions_text
    ]
    missing_observation_payload_actions = [
        fragment for fragment in required_observation_payload_actions_fragments
        if fragment not in observation_payload_actions_text
    ]
    missing_monitoring_summary = [
        fragment for fragment in required_monitoring_summary_fragments
        if fragment not in monitoring_summary_text
    ]
    missing_selection_display = [
        fragment for fragment in required_selection_display_fragments
        if fragment not in selection_display_text
    ]
    missing_lightweight_concentration = [
        fragment for fragment in required_lightweight_concentration_fragments
        if fragment not in lightweight_concentration_text
    ]
    missing_sensor_dimensions = [
        fragment for fragment in required_sensor_dimensions_fragments
        if fragment not in sensor_dimensions_text
    ]
    missing_sensor_focus = [
        fragment for fragment in required_sensor_focus_fragments
        if fragment not in sensor_focus_text
    ]
    missing_sensor_catalog = [
        fragment for fragment in required_sensor_catalog_fragments
        if fragment not in sensor_catalog_text
    ]
    missing_simulation_monitoring_api = [
        fragment for fragment in required_simulation_monitoring_api_fragments
        if fragment not in simulation_monitoring_api_text
    ]
    bad_index = [fragment for fragment in forbidden_index_fragments if fragment in index_text]
    bad_index_style = [fragment for fragment in forbidden_index_style_fragments if fragment in index_style_text]
    index_line_count = len(index_text.splitlines())
    if (
        missing_index
        or missing_index_style
        or missing_helper
        or missing_catalog
        or missing_car_patrol
        or missing_sensor_series
        or missing_sensor_series_actions
        or missing_device_image
        or missing_diffusion_timeline
        or missing_device_fullscreen
        or missing_emergency_scenario_panel
        or missing_sensor_edit_dialog
        or missing_search_box
        or missing_legend_list
        or missing_zone_list
        or missing_stats_grid
        or missing_alert_list
        or missing_risk_stats
        or missing_weather_panel
        or missing_layout_stats
        or missing_layout_actions
        or missing_yolo_result_card
        or missing_sensor_history_chart
        or missing_sensor_device_card
        or missing_sampling_summary
        or missing_selected_sensor_actions
        or missing_selected_sensor_data_panel
        or missing_source_inversion_panel
        or missing_coarse_candidate_panel
        or missing_gas_editor_panel
        or missing_sensor_batch_import_panel
        or missing_observation_summary_panel
        or missing_refinement_summary_panel
        or missing_gas_editor
        or missing_toast
        or missing_toast_component
        or missing_validation_reports
        or missing_placement_rules
        or missing_sensor_placement
        or missing_sensor_batch_import
        or missing_sensor_readings
        or missing_sensor_editor
        or missing_sensor_info
        or missing_sensor_hover
        or missing_sensor_hover_component
        or missing_car_info
        or missing_algorithm_states
        or missing_algorithm_executors
        or missing_evacuation_planning
        or missing_evacuation_planning_actions
        or missing_viewport
        or missing_viewport_controls
        or missing_bottom_toolbar
        or missing_coordinate_display
        or missing_runtime_display
        or missing_weather_state
        or missing_view_controls
        or missing_canvas_shell
        or missing_measure_tool
        or missing_canvas_interaction
        or missing_canvas_selection_actions
        or missing_core_state
        or missing_leak_source
        or missing_workflow_steps
        or missing_diffusion_playback
        or missing_refinement_playback
        or missing_diffusion_scenario
        or missing_diffusion_simulation
        or missing_diffusion_layer
        or missing_source_overlay
        or missing_evacuation_canvas
        or missing_facility_canvas
        or missing_entrance_canvas
        or missing_sensor_canvas
        or missing_base_canvas
        or missing_hit_testing
        or missing_info_panel
        or missing_facility_info
        or missing_car_interaction
        or missing_risk_grid
        or missing_risk_summary
        or missing_sensor_layout
        or missing_canvas_layer
        or missing_canvas_runtime
        or missing_lifecycle_coordinator
        or missing_renderer
        or missing_render_bridge
        or missing_page_actions
        or missing_source_workflow_state
        or missing_observation_builders
        or missing_source_inversion_actions
        or missing_observation_payload_actions
        or missing_monitoring_summary
        or missing_selection_display
        or missing_lightweight_concentration
        or missing_sensor_dimensions
        or missing_sensor_focus
        or missing_sensor_catalog
        or missing_simulation_monitoring_api
        or bad_index
        or bad_index_style
        or index_line_count > 1518
    ):
        findings.append(
            Finding(
                path=index_path,
                rule="smart-map-ui-helper-extracted",
                detail=(
                    "smart_map helper extraction is incomplete: "
                    f"index={missing_index}, style={missing_index_style}, helper={missing_helper}, catalog={missing_catalog}, "
                    f"car_patrol={missing_car_patrol}, sensor_series={missing_sensor_series}, "
                    f"sensor_series_actions={missing_sensor_series_actions}, "
                    f"device_image={missing_device_image}, gas_editor={missing_gas_editor}, "
                    f"diffusion_timeline={missing_diffusion_timeline}, "
                    f"device_fullscreen={missing_device_fullscreen}, "
                    f"emergency_scenario_panel={missing_emergency_scenario_panel}, "
                    f"sensor_edit_dialog={missing_sensor_edit_dialog}, "
                    f"search_box={missing_search_box}, "
                    f"legend_list={missing_legend_list}, "
                    f"zone_list={missing_zone_list}, "
                    f"stats_grid={missing_stats_grid}, "
                    f"alert_list={missing_alert_list}, "
                    f"risk_stats={missing_risk_stats}, "
                    f"weather_panel={missing_weather_panel}, "
                    f"layout_stats={missing_layout_stats}, "
                    f"layout_actions={missing_layout_actions}, "
                    f"yolo_result_card={missing_yolo_result_card}, "
                    f"sensor_history_chart={missing_sensor_history_chart}, "
                    f"sensor_device_card={missing_sensor_device_card}, "
                    f"sampling_summary={missing_sampling_summary}, "
                    f"selected_sensor_actions={missing_selected_sensor_actions}, "
                    f"selected_sensor_data_panel={missing_selected_sensor_data_panel}, "
                    f"source_inversion_panel={missing_source_inversion_panel}, "
                    f"coarse_candidate_panel={missing_coarse_candidate_panel}, "
                    f"gas_editor_panel={missing_gas_editor_panel}, "
                    f"sensor_batch_import_panel={missing_sensor_batch_import_panel}, "
                    f"observation_summary_panel={missing_observation_summary_panel}, "
                    f"refinement_summary_panel={missing_refinement_summary_panel}, "
                    f"toast={missing_toast}, "
                    f"toast_component={missing_toast_component}, "
                    f"validation_reports={missing_validation_reports}, "
                    f"placement_rules={missing_placement_rules}, sensor_placement={missing_sensor_placement}, "
                    f"sensor_batch_import={missing_sensor_batch_import}, "
                    f"sensor_readings={missing_sensor_readings}, "
                    f"sensor_editor={missing_sensor_editor}, "
                    f"sensor_info={missing_sensor_info}, "
                    f"sensor_hover={missing_sensor_hover}, "
                    f"sensor_hover_component={missing_sensor_hover_component}, "
                    f"car_info={missing_car_info}, "
                    f"algorithm_states={missing_algorithm_states}, "
                    f"algorithm_executors={missing_algorithm_executors}, "
                    f"evacuation_planning={missing_evacuation_planning}, "
                    f"evacuation_planning_actions={missing_evacuation_planning_actions}, "
                    f"viewport={missing_viewport}, viewport_controls={missing_viewport_controls}, "
                    f"bottom_toolbar={missing_bottom_toolbar}, "
                    f"coordinate_display={missing_coordinate_display}, "
                    f"runtime_display={missing_runtime_display}, "
                    f"weather_state={missing_weather_state}, "
                    f"view_controls={missing_view_controls}, "
                    f"canvas_shell={missing_canvas_shell}, "
                    f"measure_tool={missing_measure_tool}, "
                    f"canvas_interaction={missing_canvas_interaction}, "
                    f"canvas_selection_actions={missing_canvas_selection_actions}, "
                    f"core_state={missing_core_state}, "
                    f"leak_source={missing_leak_source}, "
                    f"workflow_steps={missing_workflow_steps}, "
                    f"diffusion_playback={missing_diffusion_playback}, "
                    f"refinement_playback={missing_refinement_playback}, "
                    f"diffusion_scenario={missing_diffusion_scenario}, "
                    f"diffusion_simulation={missing_diffusion_simulation}, "
                    f"diffusion_layer={missing_diffusion_layer}, "
                    f"source_overlay={missing_source_overlay}, "
                    f"evacuation_canvas={missing_evacuation_canvas}, "
                    f"facility_canvas={missing_facility_canvas}, "
                    f"entrance_canvas={missing_entrance_canvas}, "
                    f"sensor_canvas={missing_sensor_canvas}, "
                    f"base_canvas={missing_base_canvas}, "
                    f"hit_testing={missing_hit_testing}, "
                    f"info_panel={missing_info_panel}, "
                    f"facility_info={missing_facility_info}, "
                    f"car_interaction={missing_car_interaction}, "
                    f"risk_grid={missing_risk_grid}, "
                    f"risk_summary={missing_risk_summary}, "
                    f"sensor_layout={missing_sensor_layout}, "
                    f"canvas_layer={missing_canvas_layer}, "
                    f"canvas_runtime={missing_canvas_runtime}, "
                    f"lifecycle_coordinator={missing_lifecycle_coordinator}, "
                    f"renderer={missing_renderer}, "
                    f"render_bridge={missing_render_bridge}, "
                    f"page_actions={missing_page_actions}, "
                    f"source_workflow_state={missing_source_workflow_state}, "
                    f"observation_builders={missing_observation_builders}, "
                    f"source_inversion_actions={missing_source_inversion_actions}, "
                    f"observation_payload_actions={missing_observation_payload_actions}, "
                    f"monitoring_summary={missing_monitoring_summary}, "
                    f"selection_display={missing_selection_display}, "
                    f"lightweight_concentration={missing_lightweight_concentration}, "
                    f"sensor_dimensions={missing_sensor_dimensions}, "
                    f"sensor_focus={missing_sensor_focus}, "
                    f"sensor_catalog={missing_sensor_catalog}, "
                    f"simulation_monitoring_api={missing_simulation_monitoring_api}, "
                    f"forbidden_index={bad_index}, forbidden_index_style={bad_index_style}, "
                    f"line_count={index_line_count}"
                ),
            )
        )
    return findings


def check_frontend_type_hotspots(repo_root: Path) -> list[Finding]:
    findings: list[Finding] = []
    frontend_paths = [
        path
        for path in tracked_files(repo_root)
        if path.startswith("frontend/src/")
        and path.endswith((".ts", ".vue"))
    ]
    forbidden_pattern = re.compile(r"\bany\b|Record<string,\s*any>|(?:get|post|put|delete)<any")
    for path in frontend_paths:
        file_path = repo_root / path
        if not file_path.exists():
            continue
        text = file_path.read_text(encoding="utf-8", errors="replace")
        match = forbidden_pattern.search(text)
        if match:
            findings.append(
                Finding(
                    path=path,
                    rule="frontend-no-explicit-any",
                    detail=f"frontend source must not reintroduce explicit any near: {match.group(0)}",
                )
            )
    return findings


def check_smart_map_evacuation_reachability(repo_root: Path) -> list[Finding]:
    findings: list[Finding] = []
    if not (repo_root / "frontend/src/views/smart_map/index.vue").exists():
        return findings
    checks = {
        "frontend/src/views/smart_map/components/SmartMapEvacuationBuildingPanel.vue": (
            (
                "route.isReachable",
            ),
            (
                "route.success",
            ),
        ),
        "frontend/src/views/smart_map/components/SmartMapEvacuationSummaryPanel.vue": (
            (
                "batchResult.reachableCount",
                "可达建筑",
            ),
            (
                "batchResult.successCount",
                "成功建筑",
            ),
        ),
    }
    for path, (required_fragments, forbidden_fragments) in checks.items():
        text = (repo_root / path).read_text(encoding="utf-8", errors="replace")
        missing_fragments = [fragment for fragment in required_fragments if fragment not in text]
        bad_fragments = [fragment for fragment in forbidden_fragments if fragment in text]
        if missing_fragments or bad_fragments:
            findings.append(
                Finding(
                    path=path,
                    rule="smart-map-evacuation-reachability-contract",
                    detail=(
                        "smart_map templates must present evacuation reachability without "
                        f"legacy success payload fields: missing={missing_fragments}, forbidden={bad_fragments}"
                    ),
                )
            )
    return findings


def check_screen_map_workspace_contract(repo_root: Path) -> list[Finding]:
    findings: list[Finding] = []
    workspace_path = "frontend/src/views/screen/map-workspace/index.vue"
    screen_path = "frontend/src/views/screen/index.vue"
    routes_path = "frontend/src/router/routes.ts"
    workspace_file = repo_root / workspace_path
    if not workspace_file.exists():
        findings.append(
            Finding(
                path=workspace_path,
                rule="screen-map-workspace-contract",
                detail="digital park must retain its two-dimensional algorithm workspace",
            )
        )
        return findings

    workspace_text = workspace_file.read_text(encoding="utf-8", errors="replace")
    screen_text = (repo_root / screen_path).read_text(encoding="utf-8", errors="replace")
    routes_text = (repo_root / routes_path).read_text(encoding="utf-8", errors="replace")
    required_workspace_fragments = (
        "<SuperMap2DLayer />",
        "SmartMapSensorManualConfigPanel",
        "'source-change'",
        "'diffusion-frame'",
        "'inversion-stage'",
        "'evacuation-route'",
        "runDiffusion: runDiffusionSimulation",
        "runEvacuation: runEmbeddedEvacuation",
        "runLeakTracing: runParticleFilterInversionPreview",
    )
    forbidden_workspace_fragments = (
        "ParkScene3D",
        "SmartMapBottomToolbar",
        "SmartMapDeviceFullscreen",
        "SmartMapSensorEditDialog",
        "defineProps<{\n    embedded?: boolean",
    )
    missing_workspace = [
        fragment for fragment in required_workspace_fragments if fragment not in workspace_text
    ]
    bad_workspace = [
        fragment for fragment in forbidden_workspace_fragments if fragment in workspace_text
    ]
    missing_screen = [
        fragment
        for fragment in (
            "from './map-workspace/index.vue'",
            "@diffusion-frame=\"handleUnifiedDiffusionFrame\"",
            "@inversion-stage=\"handleUnifiedInversionStage\"",
            "@evacuation-route=\"handleUnifiedEvacuationRoute\"",
        )
        if fragment not in screen_text
    ]
    has_removed_route = "path: '/smart-map'" in routes_text
    if missing_workspace or bad_workspace or missing_screen or has_removed_route:
        findings.append(
            Finding(
                path=workspace_path,
                rule="screen-map-workspace-contract",
                detail=(
                    "digital park workspace contract regressed: "
                    f"workspace_missing={missing_workspace}, workspace_forbidden={bad_workspace}, "
                    f"screen_missing={missing_screen}, removed_route_restored={has_removed_route}"
                ),
            )
        )
    return findings


def check_backend_controller_service_boundaries(repo_root: Path) -> list[Finding]:
    findings: list[Finding] = []
    checks = (
        (
            "backend/src/main/java/com/at/controller/EnvironmentReadingController.java",
            "backend/src/main/java/com/at/service/EnvironmentReadingService.java",
            ("EnvironmentReadingMapper",),
            ("EnvironmentReadingService",),
        ),
        (
            "backend/src/main/java/com/at/controller/SimulationMonitoringController.java",
            "backend/src/main/java/com/at/service/SimulationMonitoringService.java",
            ("SimulationScenarioMapper", "SensorReadingMapper"),
            ("SimulationMonitoringService",),
        ),
        (
            "backend/src/main/java/com/at/controller/ImageAnalysisController.java",
            "backend/src/main/java/com/at/service/ImageAnalysisService.java",
            (
                "InspectRecordMapper",
                "CarMapper",
                "RestTemplate",
                "RequestContext",
                "normalizeAlgorithmResponse",
                "saveInspectRecordIfNeeded",
            ),
            ("ImageAnalysisService",),
        ),
        (
            "backend/src/main/java/com/at/controller/MonitoringDataController.java",
            "backend/src/main/java/com/at/service/MonitoringDataService.java",
            (
                "CarMapper",
                "EnvironmentReadingMapper",
                "SensorReadingMapper",
                "WarningHistoryService",
                "SensorService",
                "QWeatherService",
                "buildEnvironmentSnapshot",
                "buildTrend",
                "buildLatestReadings",
                "gasTypeCompatCarId",
                "public record MonitoringOverview",
            ),
            ("MonitoringDataService", "MonitoringOverviewDTO"),
        ),
    )
    for controller_path, service_path, forbidden_fragments, required_fragments in checks:
        controller_text = (repo_root / controller_path).read_text(encoding="utf-8", errors="replace")
        bad_fragments = [fragment for fragment in forbidden_fragments if fragment in controller_text]
        missing_fragments = [fragment for fragment in required_fragments if fragment not in controller_text]
        if bad_fragments or missing_fragments:
            findings.append(
                Finding(
                    path=controller_path,
                    rule="backend-controller-service-boundary",
                    detail=(
                        "controllers must delegate persistence and normalization to service owners: "
                        f"missing={missing_fragments}, forbidden={bad_fragments}"
                    ),
                )
            )
        if not (repo_root / service_path).exists():
            findings.append(
                Finding(
                    path=service_path,
                    rule="backend-controller-service-boundary",
                    detail="service owner is required so controller does not own mapper persistence rules",
                )
            )
    return findings


def check_frontend_api_boundaries(repo_root: Path) -> list[Finding]:
    findings: list[Finding] = []
    checks = (
        (
            "frontend/src/views/thing/monitor_history/index.vue",
            "frontend-history-api-boundary",
            (
                "reqWarningHistoryList",
                "reqDeleteWarningHistory",
                "type HistoryItem = WarningHistoryRecord",
            ),
            (
                "from '@/utils/request'",
                "request.get<",
                "request.post(",
                "as unknown as",
            ),
            "monitor history must use src/api/warningHistory.ts",
        ),
        (
            "frontend/src/views/car/CarDetail.vue",
            "frontend-history-add-api-boundary",
            ("reqAddWarningHistory",),
            ("/history/add",),
            "car detail must use src/api/warningHistory.ts for history creation",
        ),
        (
            "frontend/src/views/car/CarHome.vue",
            "frontend-history-list-api-boundary",
            ("reqWarningHistoryList", "type WarningHistoryItem = WarningHistoryRecord"),
            ("/history/list",),
            "car home must use src/api/warningHistory.ts for history list",
        ),
        (
            "frontend/src/views/home/index.vue",
            "frontend-history-list-api-boundary",
            (
                "reqWarningHistoryList",
                "type HistoryItem = WarningHistoryRecord",
                "reqMonitoringOverview",
                "monitoringOverview",
                "source-overview",
                "router.push({ path: '/monitor' })",
            ),
            (
                "from '@/utils/request'",
                "/history/list",
                "router.push({ name: 'SystemSetting' })",
                "{ title: '在运设备数'",
                "{ title: '设备在线率'",
            ),
            "home dashboard must use src/api/warningHistory.ts for history list",
        ),
        (
            "frontend/src/store/carStore.ts",
            "frontend-car-store-api-boundary",
            (
                "reqCarList",
                "reqSetCarWarning",
                "reqResetCarStatus",
            ),
            (
                "from '@/utils/request'",
                "/car/getAllCars",
                "/car/setWarning",
                "/car/resetStatus",
            ),
            "carStore must use src/api/car.ts",
        ),
        (
            "frontend/src/views/yolo/Home.vue",
            "frontend-analysis-api-boundary",
            ("reqAnalyzePersonImage", "reqInspectRecordList", "reqDeleteInspectRecord", "reqYoloSummary", "yoloSummarySource"),
            ("/analysis/person", "/analysis/list", "/analysis/delete", "from '@/utils/request'", "AI 实时分析中"),
            "YOLO page must use src/api/analysis.ts",
        ),
        (
            "frontend/src/views/car/CarHome.vue",
            "frontend-analysis-api-boundary",
            ("reqAnalyzePersonImage",),
            ("/analysis/person",),
            "car home must use src/api/analysis.ts for image analysis",
        ),
        (
            "frontend/src/views/screen/map-workspace/useSmartMapCarInteraction.ts",
            "frontend-analysis-api-boundary",
            ("reqAnalyzePersonImage",),
            ("/analysis/person", "from '@/utils/request'"),
            "screen map workspace car interaction must use src/api/analysis.ts for YOLO capture analysis",
        ),
        (
            "frontend/src/views/emergency/index.vue",
            "frontend-emergency-algorithm-api-boundary",
            (
                "runDiffusionSimulation",
                "runEvacuationPlanning",
                "buildEmergencyDiffusionPayload",
                "selectPlanningDiffusionFrame",
                "adaptDiffusionFrame",
                "adaptEvacuationResult",
                "buildRoutePathPoints",
            ),
            (
                "from '@/api/algorithmClient'",
                "runGasPathScenario",
                "runGasTimeSeriesScenario",
                "/api/gas-path",
                "/api/time-series",
            ),
            "emergency command page must use the current diffusion and D* Lite planning API chain",
        ),
    )
    for path, rule, required_fragments, forbidden_fragments, message in checks:
        text = (repo_root / path).read_text(encoding="utf-8", errors="replace")
        missing_fragments = [fragment for fragment in required_fragments if fragment not in text]
        bad_fragments = [fragment for fragment in forbidden_fragments if fragment in text]
        if missing_fragments or bad_fragments:
            findings.append(
                Finding(
                    path=path,
                    rule=rule,
                    detail=f"{message}: missing={missing_fragments}, forbidden={bad_fragments}",
                )
            )
    return findings


def check_frontend_route_contracts(repo_root: Path) -> list[Finding]:
    findings: list[Finding] = []
    routes_path = "frontend/src/router/routes.ts"
    home_path = "frontend/src/views/home/index.vue"
    routes_text = (repo_root / routes_path).read_text(encoding="utf-8", errors="replace")
    home_text = (repo_root / home_path).read_text(encoding="utf-8", errors="replace")

    required_route_fragments = (
        "path: '/acl'",
        "redirect: '/acl/role'",
        "path: '/acl/role'",
        "path: '/acl/employee'",
        "name: 'CarInspectionHome'",
        "name: 'YoloInspection'",
    )
    forbidden_route_fragments = (
        "redirect: '/acl/user'",
        "path: '/acl/user'",
        "name: 'EquipmentInspect'",
        "name: 'SystemSetting'",
    )
    required_home_fragments = (
        "园区公告（示例）",
        "当前没有后端公告接口",
        "公告为模拟/示例数据",
    )
    forbidden_home_fragments = (
        "AnnounceList",
        "AnnounceDetail",
        "router.push({ name: 'Announce",
    )

    missing_routes = [fragment for fragment in required_route_fragments if fragment not in routes_text]
    bad_routes = [fragment for fragment in forbidden_route_fragments if fragment in routes_text]
    missing_home = [fragment for fragment in required_home_fragments if fragment not in home_text]
    bad_home = [fragment for fragment in forbidden_home_fragments if fragment in home_text]
    if missing_routes or bad_routes or missing_home or bad_home:
        findings.append(
            Finding(
                path=routes_path,
                rule="frontend-route-contracts",
                detail=(
                    "known broken frontend links must stay closed: "
                    f"routes_missing={missing_routes}, routes_forbidden={bad_routes}, "
                    f"home_missing={missing_home}, home_forbidden={bad_home}"
                ),
            )
        )
    return findings


def check_monitor_point_closure(repo_root: Path) -> list[Finding]:
    findings: list[Finding] = []
    monitor_path = "frontend/src/layout/monitor.vue"
    directory_path = "frontend/src/views/monitor/index.vue"
    history_path = "frontend/src/views/thing/monitor_history/index.vue"
    route_path = "frontend/src/router/routes.ts"
    if not all((repo_root / path).exists() for path in (monitor_path, directory_path, history_path)):
        return findings
    monitor_text = (repo_root / monitor_path).read_text(encoding="utf-8", errors="replace")
    directory_text = (repo_root / directory_path).read_text(encoding="utf-8", errors="replace")
    history_text = (repo_root / history_path).read_text(encoding="utf-8", errors="replace")
    route_text = (repo_root / route_path).read_text(encoding="utf-8", errors="replace")

    required_monitor_fragments = (
        "reqMonitorPointList",
        "monitorPointById",
        "selectedMonitorPoint",
        "monitorPointExists",
        "未找到后端监测点",
        "来源：monitor_point 表",
        "未绑定视频源",
        "monitoring/overview 全局采样，不是当前监测点专属绑定",
        "monitorBindingText",
        "selectedMonitorPoint?.sensorId",
        "selectedMonitorPoint?.qualityStatus",
    )
    forbidden_monitor_fragments = (
        "seededMonitorNames",
        "北区储罐区",
        "中区生产区",
        "西区装卸区",
        "东区危废库",
        "MONITOR-A",
        "未建立 monitor_point 与传感器/摄像头映射",
    )
    required_directory_fragments = (
        "reqMonitorPointList",
        "monitorPoints",
        "已绑定视频",
        "已绑定传感器",
        "后端实体",
        "未绑定",
        "router.push({ name: 'MonitorDetail'",
    )
    forbidden_directory_fragments = (
        "seededMonitorNames",
        "router.push({ path: '/thing/monitor_history' })",
    )
    required_history_fragments = (
        "monitor-source-note",
        "监测点来自后端 monitor_point 表",
        "未绑定视频源",
        "monitor-meta",
        "qualityStatus",
        "normalizeMonitorPointName",
        "reqCreateMonitorPoint(monitorPointName)",
    )
    forbidden_history_fragments = (
        "reqCreateMonitorPoint('重点监测区域' + addForm.value.name)",
        "placeholder=\"仅需输入区域编号即可，如：3\"",
    )
    required_route_fragments = (
        "path: '/monitor'",
        "component: () => import('@/layout/index.vue')",
        "name: 'MonitorDirectory'",
        "component: () => import('@/views/monitor/index.vue')",
        "path: ':id'",
        "component: () => import('@/layout/monitor.vue')",
    )
    forbidden_route_fragments = (
        "path: '/monitor',\n    component: () => import('@/layout/monitor.vue')",
        "path: '/monitor/:id'",
    )

    missing_monitor = [fragment for fragment in required_monitor_fragments if fragment not in monitor_text]
    bad_monitor = [fragment for fragment in forbidden_monitor_fragments if fragment in monitor_text]
    missing_directory = [fragment for fragment in required_directory_fragments if fragment not in directory_text]
    bad_directory = [fragment for fragment in forbidden_directory_fragments if fragment in directory_text]
    missing_history = [fragment for fragment in required_history_fragments if fragment not in history_text]
    bad_history = [fragment for fragment in forbidden_history_fragments if fragment in history_text]
    missing_route = [fragment for fragment in required_route_fragments if fragment not in route_text]
    bad_route = [fragment for fragment in forbidden_route_fragments if fragment in route_text]
    if re.search(r"path: '/monitor'[\s\S]{0,420}redirect: '/thing/monitor_history'", route_text):
        bad_route.append("monitor route must not redirect to warning history")
    if (
        missing_monitor
        or bad_monitor
        or missing_directory
        or bad_directory
        or missing_history
        or bad_history
        or missing_route
        or bad_route
    ):
        findings.append(
            Finding(
                path=monitor_path,
                rule="monitor-point-crud-detail-closure",
                detail=(
                    "monitor-point CRUD/detail chain must consume backend entities and expose unbound video/sensor boundaries: "
                    f"monitor_missing={missing_monitor}, monitor_forbidden={bad_monitor}, "
                    f"directory_missing={missing_directory}, directory_forbidden={bad_directory}, "
                    f"history_missing={missing_history}, history_forbidden={bad_history}, "
                    f"route_missing={missing_route}, route_forbidden={bad_route}"
                ),
            )
        )
    return findings


def check_frontend_permission_gates(repo_root: Path) -> list[Finding]:
    checks = (
        (
            "frontend/src/store/modules/user.ts",
            ("decodeJwtPayload", "isAdmin", "currentRole", "currentUsername", "displayName"),
            "user store must expose JWT identity and role for UI permission gating",
        ),
        (
            "frontend/src/layout/index.vue",
            ("v-if=\"userStore.isAdmin\"", "index=\"/personnel-manage\"", "avatarText", "userStore.displayName"),
            "personnel management menu and avatar identity must derive from token role/username",
        ),
        (
            "frontend/src/views/yolo/Home.vue",
            ("!userStore.isAdmin", "v-if=\"userStore.isAdmin\"", "reqAnalyzePersonImage"),
            "YOLO write operations must be gated by admin UI state",
        ),
        (
            "frontend/src/views/car/CarHome.vue",
            ("!userStore.isAdmin", "reqAnalyzePersonImage"),
            "car warning and image-analysis write operations must be gated by admin UI state",
        ),
        (
            "frontend/src/views/home/index.vue",
            ("v-if=\"userStore.isAdmin\"", "goToSmartMap"),
            "home shortcuts must hide admin-only personnel entry and avoid legacy map test naming",
        ),
    )
    findings: list[Finding] = []
    for path, required_fragments, message in checks:
        text = (repo_root / path).read_text(encoding="utf-8", errors="replace")
        missing_fragments = [fragment for fragment in required_fragments if fragment not in text]
        bad_fragments = ["goToMapTest"] if path.endswith("home/index.vue") and "goToMapTest" in text else []
        if path == "frontend/src/layout/index.vue" and '<span class="avatar_text">用户</span>' in text:
            bad_fragments.append('<span class="avatar_text">用户</span>')
        if missing_fragments or bad_fragments:
            findings.append(
                Finding(
                    path=path,
                    rule="frontend-admin-ui-gates",
                    detail=f"{message}: missing={missing_fragments}, forbidden={bad_fragments}",
                )
            )
    return findings



def check_ci_workflow(repo_root: Path) -> list[Finding]:
    path = ".github/workflows/ci.yml"
    package_path = "frontend/package.json"
    frontend_node_check_path = "frontend/scripts/check-node-version.cjs"
    pre_commit_path = "frontend/.husky/pre-commit"
    commit_msg_path = "frontend/.husky/commit-msg"
    commitlint_path = "frontend/commitlint.config.cjs"
    workflow_path = repo_root / path
    if not workflow_path.exists():
        return [
            Finding(
                path=path,
                rule="ci-workflow-present",
                detail="main CI workflow is missing",
            )
        ]

    text = workflow_path.read_text(encoding="utf-8", errors="replace")
    package_text = (repo_root / package_path).read_text(encoding="utf-8", errors="replace")
    frontend_node_check_text = (repo_root / frontend_node_check_path).read_text(
        encoding="utf-8", errors="replace"
    )
    pre_commit_text = (repo_root / pre_commit_path).read_text(
        encoding="utf-8", errors="replace"
    )
    commit_msg_text = (repo_root / commit_msg_path).read_text(
        encoding="utf-8", errors="replace"
    )
    commitlint_text = (repo_root / commitlint_path).read_text(
        encoding="utf-8", errors="replace"
    )
    findings: list[Finding] = []
    if "npm run lint" not in text:
        findings.append(
            Finding(
                path=path,
                rule="frontend-lint-ci-gate",
                detail="frontend CI must run npm run lint as a hard gate",
            )
        )
    if "npm run typecheck:strict" not in text:
        findings.append(
            Finding(
                path=path,
                rule="frontend-strict-typecheck-ci-gate",
                detail="frontend CI must run npm run typecheck:strict",
            )
        )
    if re.search(r"Strict typecheck[\s\S]{0,160}continue-on-error:\s*true", text):
        findings.append(
            Finding(
                path=path,
                rule="frontend-strict-typecheck-ci-gate",
                detail="strict typecheck must not be marked continue-on-error",
            )
        )
    required_package_fragments = (
        '"check:node": "node ./scripts/check-node-version.cjs"',
        '"dev": "npm run check:node && vite --open"',
        '"typecheck:strict": "npm run check:node && node --max-old-space-size=12288 ./node_modules/vue-tsc/bin/vue-tsc.js -p tsconfig.json --noEmit --pretty false"',
        '"build:test": "npm run typecheck:strict && vite build --mode test"',
        '"build:pro": "npm run typecheck:strict && vite build --mode production"',
    )
    forbidden_package_fragments = (
        '"build:test": "npm run typecheck && vite build --mode test"',
        '"build:pro": "npm run typecheck && vite build --mode production"',
    )
    missing_package_fragments = [
        fragment for fragment in required_package_fragments if fragment not in package_text
    ]
    bad_package_fragments = [
        fragment for fragment in forbidden_package_fragments if fragment in package_text
    ]
    if missing_package_fragments or bad_package_fragments:
        findings.append(
            Finding(
                path=package_path,
                rule="frontend-local-build-strict-typecheck-gate",
                detail=(
                    "frontend local build scripts must run strict typecheck before Vite build: "
                    f"missing={missing_package_fragments}, forbidden={bad_package_fragments}"
                ),
            )
        )
    required_node_check_fragments = (
        "major < 20 || major >= 25",
        "Unsupported Node.js",
        "Use Node.js >=20 and <25",
    )
    missing_node_check_fragments = [
        fragment for fragment in required_node_check_fragments if fragment not in frontend_node_check_text
    ]
    if missing_node_check_fragments:
        findings.append(
            Finding(
                path=frontend_node_check_path,
                rule="frontend-node-version-gate",
                detail=(
                    "frontend scripts must fail fast on unsupported Node versions before Vite build/dev: "
                    f"missing={missing_node_check_fragments}"
                ),
            )
        )
    required_hook_fragments = {
        pre_commit_path: ("npm run lint", "npm run typecheck:strict"),
        commit_msg_path: ("commitlint --config commitlint.config.cjs",),
        commitlint_path: (
            "'scope-empty': [2, 'never']",
            "'scope-enum': [",
            "'header-max-length': [2, 'always', 72]",
            "'algorithm'",
            "'backend'",
            "'frontend'",
            "'smart-map'",
            "'yolo'",
        ),
    }
    hook_texts = {
        pre_commit_path: pre_commit_text,
        commit_msg_path: commit_msg_text,
        commitlint_path: commitlint_text,
    }
    for checked_path, required_fragments in required_hook_fragments.items():
        missing_fragments = [
            fragment
            for fragment in required_fragments
            if fragment not in hook_texts[checked_path]
        ]
        if missing_fragments:
            findings.append(
                Finding(
                    path=checked_path,
                    rule="frontend-local-commit-gates",
                    detail=(
                        "local Husky/commitlint gates must match repository rules: "
                        f"missing={missing_fragments}"
                    ),
                )
            )
    return findings


def check_algorithm_verification_report(repo_root: Path) -> list[Finding]:
    path = "docs/algorithm-verification-report.md"
    report_path = repo_root / path
    if not report_path.exists():
        return [
            Finding(
                path=path,
                rule="algorithm-verification-matrix-present",
                detail="docs must map core algorithm authenticity requirements to evidence",
            )
        ]

    text = report_path.read_text(encoding="utf-8", errors="replace")
    required_fragments = (
        "未满足 5 次真实数据验证",
        "仿真",
        "不能",
        "Prairie Grass",
        "BTEX",
        "python -m algorithm.diffusion.test_real_prairie_grass",
        "python -m algorithm.inversion.validate_particle_filter",
        "python -m algorithm.inversion.validate_prairie_grass_source_inversion",
        "python -m algorithm.deep_learning.validate_btex_real_data --epochs 700",
        "models/manifest.json",
        "已有模型版本 manifest，但尚无带标注的真实小车图片/视频验证集",
    )
    missing_fragments = [fragment for fragment in required_fragments if fragment not in text]
    forbidden_fragments = (
        "仓库尚无带标注的真实小车图片/视频验证集、模型版本 manifest",
        "YOLO 没有真实标注验证集和模型版本治理",
    )
    bad_fragments = [fragment for fragment in forbidden_fragments if fragment in text]
    if missing_fragments or bad_fragments:
        return [
            Finding(
                path=path,
                rule="algorithm-verification-matrix-complete",
                detail=(
                    "verification report is missing required evidence anchors or still carries stale facts: "
                    f"missing={missing_fragments}, forbidden={bad_fragments}"
                ),
            )
        ]
    return []


def check_policy_reference_text_readability(repo_root: Path) -> list[Finding]:
    findings: list[Finding] = []
    policy_dir = repo_root / "docs/references/policies"
    if not policy_dir.exists():
        return findings

    forbidden_fragments = (
        "body {",
        ".swiper",
        "accountHeader",
        "header-login-pop",
        "$.ajax",
        "window.onload",
        "localStorage.",
        "navigator.userAgent",
    )
    for reference_path in policy_dir.glob("*.txt"):
        path = reference_path.relative_to(repo_root).as_posix()
        text = reference_path.read_text(encoding="utf-8", errors="replace")
        bad_fragments = [fragment for fragment in forbidden_fragments if fragment in text]
        if bad_fragments:
            findings.append(
                Finding(
                    path=path,
                    rule="policy-reference-readable-text",
                    detail=f"policy reference text must not contain web scrape CSS/JS residue: {bad_fragments}",
                )
            )
    for reference_path in policy_dir.glob("*.pdf"):
        path = reference_path.relative_to(repo_root).as_posix()
        header = reference_path.read_bytes()[:5]
        if header != b"%PDF-":
            findings.append(
                Finding(
                    path=path,
                    rule="policy-reference-pdf-file",
                    detail="policy reference files with .pdf extension must be real PDF binaries, not HTML scrape residue",
                )
            )
    return findings


def check_readme_monitoring_truth_boundary(repo_root: Path) -> list[Finding]:
    findings: list[Finding] = []
    checks = {
        "README.md": (
            (
                "当前仓库没有真实硬件采集链路",
                "仿真采样、手工观测或巡检图片识别链路",
            ),
            (
                "1. 固定气体传感器和阿克曼巡检小车采集 CO、O2、NH3、CH4 浓度数据。",
                "固定气体传感器和阿克曼巡检小车作为静态/动态监控点位",
            ),
        ),
        "docs/项目总体要求.md": (
            (
                "当前仓库尚未接入真实硬件采集链路",
                "不能写成现场实测",
                "当前仓库没有真实车载气体传感器连续采样链路",
                "当前已落地的是巡检图片识别链路",
                "传感器点位数据及其来源标识",
                "四类气体浓度仿真/采样值和历史趋势",
                "小车巡检位置、任务状态及数据来源",
                "查看传感器仿真/采样数据及来源标识",
                "未接入真实采集链路前，路径更新只能标注为仿真/演练结果",
            ),
            (
                "模拟真实环境下的危险气体扩散过程；同时结合固定传感器与阿克曼巡检小车采集的浓度数据",
                "阿克曼巡检小车作为动态监控点位。",
                "传感器实时点位数据",
                "四类气体浓度实时值和历史趋势",
                "小车实时位置和状态",
                "查看传感器实时数据",
                "生成并实时更新人员逃生路径",
            ),
        ),
    }
    for path, (required_fragments, forbidden_fragments) in checks.items():
        text = (repo_root / path).read_text(encoding="utf-8", errors="replace")
        missing_fragments = [fragment for fragment in required_fragments if fragment not in text]
        bad_fragments = [fragment for fragment in forbidden_fragments if fragment in text]
        if missing_fragments or bad_fragments:
            findings.append(
                Finding(
                    path=path,
                    rule="readme-monitoring-truth-boundary",
                    detail=(
                        "monitoring docs must separate target telemetry from current simulated/manual evidence: "
                        f"missing={missing_fragments}, forbidden={bad_fragments}"
                    ),
                )
            )
    return findings


def check_backend_api_reference_routes(repo_root: Path) -> list[Finding]:
    api_path = "docs/api-reference.md"
    controller_dir = repo_root / "backend/src/main/java/com/at/controller"
    api_text = (repo_root / api_path).read_text(encoding="utf-8", errors="replace")
    documented_paths = set(re.findall(r"`(/[^`]+)`", api_text))
    missing: list[str] = []

    for controller_path in sorted(controller_dir.glob("*.java")):
        text = controller_path.read_text(encoding="utf-8", errors="replace")
        base_match = re.search(r'@RequestMapping\("([^"]+)"\)', text)
        base_path = base_match.group(1) if base_match else ""
        for mapping, method_path in re.findall(
            r'@(GetMapping|PostMapping|PutMapping|DeleteMapping)(?:\("([^"]*)"\))?',
            text,
        ):
            full_path = f"{base_path}{method_path}" if method_path else base_path
            full_path = re.sub(r"/+", "/", full_path)
            if not full_path.startswith("/"):
                full_path = f"/{full_path}"
            if full_path not in documented_paths:
                rel_path = controller_path.relative_to(repo_root).as_posix()
                missing.append(f"{mapping}:{full_path} ({rel_path})")

    if missing:
        return [
            Finding(
                path=api_path,
                rule="backend-api-reference-route-coverage",
                detail=f"API reference is missing backend routes: {missing}",
            )
        ]
    return []


def check_forward_model_package_import(repo_root: Path) -> list[Finding]:
    path = "tests/test_forward_model.py"
    text = (repo_root / path).read_text(encoding="utf-8", errors="replace")
    required_fragments = (
        "from algorithm.diffusion import gaussian_plume as gp",
        "algorithm.diffusion.gaussian_plume",
    )
    forbidden_fragments = (
        "importlib.util",
        "sys.path",
        "spec_from_file_location",
        'sys.modules["gaussian_plume"]',
        "_GP_PATH",
        'os.path.join(PROJECT_ROOT, "algorithm", "diffusion", "gaussian_plume.py")',
    )
    missing_fragments = [fragment for fragment in required_fragments if fragment not in text]
    bad_fragments = [fragment for fragment in forbidden_fragments if fragment in text]
    if missing_fragments or bad_fragments:
        return [
            Finding(
                path=path,
                rule="algorithm-forward-model-package-import",
                detail=(
                    "forward model regression must import gaussian_plume through the "
                    "algorithm.diffusion package instead of direct file loading: "
                    f"missing={missing_fragments}, forbidden={bad_fragments}"
                ),
            )
        ]
    return []


def main() -> int:
    repo_root = Path(__file__).resolve().parents[1]
    findings: list[Finding] = []

    for path in tracked_files(repo_root):
        if not is_source_file(path):
            continue
        if not (repo_root / path).exists():
            continue
        findings.extend(check_python_module_name(path))
        text = source_text(repo_root, path)
        names = declaration_names(path, text)
        findings.extend(check_duplicate_declarations(path, names))
        findings.extend(check_meaningless_names(path, names))
        findings.extend(check_project_contracts(path, text))
    findings.extend(check_ci_workflow(repo_root))
    findings.extend(check_algorithm_verification_report(repo_root))
    findings.extend(check_policy_reference_text_readability(repo_root))
    findings.extend(check_readme_monitoring_truth_boundary(repo_root))
    findings.extend(check_model_manifest(repo_root))
    findings.extend(check_yolo_install_docs(repo_root))
    findings.extend(check_deploy_env_docs(repo_root))
    findings.extend(check_docs_readme_self_check(repo_root))
    findings.extend(check_assets_readme_current(repo_root))
    findings.extend(check_tool_dry_run_contracts(repo_root))
    findings.extend(check_database_migration_assets(repo_root))
    findings.extend(check_database_audit_columns(repo_root))
    findings.extend(check_requirements_current_paths(repo_root))
    findings.extend(check_docs_truth_contracts(repo_root))
    findings.extend(check_backend_api_reference_routes(repo_root))
    findings.extend(check_forward_model_package_import(repo_root))
    findings.extend(check_algorithm_map_scale_contract(repo_root))
    findings.extend(check_smart_map_manual_entry_panel(repo_root))
    findings.extend(check_frontend_media_truth_boundary(repo_root))
    findings.extend(check_environment_schema_truth_boundary(repo_root))
    findings.extend(check_smart_map_extraction(repo_root))
    findings.extend(check_screen_map_workspace_contract(repo_root))
    findings.extend(check_frontend_type_hotspots(repo_root))
    findings.extend(check_smart_map_evacuation_reachability(repo_root))
    findings.extend(check_backend_controller_service_boundaries(repo_root))
    findings.extend(check_frontend_api_boundaries(repo_root))
    findings.extend(check_frontend_route_contracts(repo_root))
    findings.extend(check_monitor_point_closure(repo_root))
    findings.extend(check_frontend_permission_gates(repo_root))

    if not findings:
        print("Code quality audit passed.")
        return 0

    print("Code quality audit failed:")
    for finding in findings:
        print(f"- [{finding.rule}] {finding.path}: {finding.detail}")
    return 1


if __name__ == "__main__":
    sys.exit(main())
