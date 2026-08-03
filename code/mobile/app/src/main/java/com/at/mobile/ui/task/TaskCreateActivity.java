package com.at.mobile.ui.task;

import android.os.Bundle;
import android.text.TextUtils;
import android.view.View;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.ProgressBar;
import android.widget.RadioGroup;
import android.widget.Spinner;
import android.widget.TextView;

import com.at.mobile.R;
import com.at.mobile.data.remote.ApiException;
import com.at.mobile.data.remote.dto.CarVO;
import com.at.mobile.data.remote.dto.EmployeeVO;
import com.at.mobile.data.repository.CarRepository;
import com.at.mobile.data.repository.EmployeeRepository;
import com.at.mobile.data.repository.TaskRepository;
import com.at.mobile.data.remote.dto.TaskCreateRequest;
import com.at.mobile.ui.common.BaseActivity;
import com.at.mobile.util.GasHazardLevel;
import com.at.mobile.util.TimeElapsed;

import java.util.ArrayList;
import java.util.List;

/**
 * 新建处置任务页。
 * 来源：从事故列表带 warningHistoryId 进入（冗余告警字段），或从工具栏进入（无告警来源）。
 * 指派对象二选一：巡检小车 / 工作人员，提交后 status=assigned。
 */
public class TaskCreateActivity extends BaseActivity {

    public static final String EXTRA_WARNING_ID = "warning_history_id";
    public static final String EXTRA_GAS_TYPE = "gas_type";
    public static final String EXTRA_AREA_NAME = "area_name";
    public static final String EXTRA_CAR_ID = "car_id";
    public static final String EXTRA_X = "x";
    public static final String EXTRA_Y = "y";
    public static final String EXTRA_WARNING_TIME = "warning_time";

    private EditText titleField;
    private EditText descriptionField;
    private RadioGroup assigneeGroup;
    private Spinner carSpinner;
    private Spinner employeeSpinner;
    private Button submitButton;
    private ProgressBar progressBar;
    private TextView statusText;
    private TextView toolbarTitle;
    private View warningInfoCard;
    private ImageView warningIcon;
    private TextView warningTitleText;
    private TextView warningLevelText;
    private TextView warningElapsedText;
    private TextView warningTimeoutText;

    private final List<CarVO> cars = new ArrayList<>();
    private final List<EmployeeVO> employees = new ArrayList<>();
    private ArrayAdapter<String> carAdapter;
    private ArrayAdapter<String> employeeAdapter;
    /** 指派对象列表是否已加载完成，未完成时禁用提交。 */
    private boolean optionsLoaded;

    private TaskRepository taskRepo;
    private Integer warningHistoryId;
    private String gasType;
    private String areaName;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_task_create);
        taskRepo = TaskRepository.get(this);
        bindViews();
        readExtras();
        setupToolbar();
        setupSpinners();
        submitButton.setEnabled(false);
        loadOptions();
        bindToolbarBack();
    }

    private void bindViews() {
        titleField = findViewById(R.id.etTitle);
        descriptionField = findViewById(R.id.etDescription);
        assigneeGroup = findViewById(R.id.rgAssigneeType);
        carSpinner = findViewById(R.id.spCar);
        employeeSpinner = findViewById(R.id.spEmployee);
        submitButton = findViewById(R.id.btnSubmit);
        progressBar = findViewById(R.id.progressBar);
        statusText = findViewById(R.id.tvMessage);
        toolbarTitle = findViewById(R.id.tvToolbarTitle);
        warningInfoCard = findViewById(R.id.tvWarningInfo);
        warningIcon = findViewById(R.id.ivWarningIcon);
        warningTitleText = findViewById(R.id.tvWarningTitle);
        warningLevelText = findViewById(R.id.tvWarningLevel);
        warningElapsedText = findViewById(R.id.tvWarningElapsed);
        warningTimeoutText = findViewById(R.id.tvWarningTimeout);
        bindLoadingViews(progressBar, statusText);
        submitButton.setOnClickListener(v -> submitTask());
    }

    private void readExtras() {
        warningHistoryId = (int) getIntent().getLongExtra(EXTRA_WARNING_ID, -1L);
        if (warningHistoryId <= 0) {
            warningHistoryId = null;
        }
        gasType = getIntent().getStringExtra(EXTRA_GAS_TYPE);
        areaName = getIntent().getStringExtra(EXTRA_AREA_NAME);
        if (warningHistoryId != null) {
            warningInfoCard.setVisibility(View.VISIBLE);
            warningTitleText.setText("关联告警 #" + warningHistoryId
                    + (gasType == null ? "" : " " + gasType)
                    + (areaName == null ? "" : " @" + areaName));

            // 危险等级徽章
            int level = GasHazardLevel.of(gasType);
            warningLevelText.setText(getString(GasHazardLevel.labelRes(level)));
            warningLevelText.setBackgroundResource(GasHazardLevel.badgeBackground(level));
            warningLevelText.setTextColor(getResources().getColor(GasHazardLevel.textColor(level)));
            warningIcon.setBackgroundResource(GasHazardLevel.badgeBackground(level));

            // 已持续时长 + 超时标签
            String warningTime = getIntent().getStringExtra(EXTRA_WARNING_TIME);
            if (warningTime != null && !warningTime.isEmpty()) {
                String elapsed = TimeElapsed.incidentElapsed(warningTime);
                warningElapsedText.setText("已持续 " + elapsed);
                boolean timeout = TimeElapsed.isIncidentTimeout(warningTime);
                warningTimeoutText.setVisibility(timeout ? View.VISIBLE : View.GONE);
            } else {
                warningElapsedText.setText("已持续 --");
            }
        }
    }

    private void setupToolbar() {
        toolbarTitle.setText(R.string.task_create_title);
    }

    private void setupSpinners() {
        carAdapter = new ArrayAdapter<>(this, android.R.layout.simple_spinner_item, new ArrayList<>());
        carAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        carSpinner.setAdapter(carAdapter);

        employeeAdapter = new ArrayAdapter<>(this, android.R.layout.simple_spinner_item, new ArrayList<>());
        employeeAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        employeeSpinner.setAdapter(employeeAdapter);

        assigneeGroup.setOnCheckedChangeListener((group, checkedId) -> {
            boolean isCar = checkedId == R.id.rbCar;
            carSpinner.setVisibility(isCar ? View.VISIBLE : View.GONE);
            employeeSpinner.setVisibility(isCar ? View.GONE : View.VISIBLE);
        });
    }

    private void loadOptions() {
        new CarRepository(this).getAllCars(new com.at.mobile.data.repository.RepositoryCallback<List<CarVO>>() {
            @Override
            public void onSuccess(List<CarVO> data) {
                cars.clear();
                if (data != null) {
                    cars.addAll(data);
                }
                List<String> labels = new ArrayList<>();
                for (CarVO car : cars) {
                    labels.add("巡检车 #" + car.getCarId() + (car.isWarning() ? "（预警中）" : ""));
                }
                carAdapter.clear();
                carAdapter.addAll(labels);
                carAdapter.notifyDataSetChanged();
                markOptionsReady();
            }

            @Override
            public void onError(ApiException e) {
                showStatus(getString(R.string.network_error, e.getMessage()));
            }
        });

        new EmployeeRepository(this).listEmployees(new com.at.mobile.data.repository.RepositoryCallback<List<EmployeeVO>>() {
            @Override
            public void onSuccess(List<EmployeeVO> data) {
                employees.clear();
                if (data != null) {
                    employees.addAll(data);
                }
                List<String> labels = new ArrayList<>();
                for (EmployeeVO employee : employees) {
                    labels.add(employee.displayName());
                }
                employeeAdapter.clear();
                employeeAdapter.addAll(labels);
                employeeAdapter.notifyDataSetChanged();
                markOptionsReady();
            }

            @Override
            public void onError(ApiException e) {
                showStatus(getString(R.string.network_error, e.getMessage()));
            }
        });
    }

    /** 两个指派对象列表任一加载完成即启用提交按钮（允许只选车或只选人）。 */
    private void markOptionsReady() {
        if (!optionsLoaded) {
            optionsLoaded = true;
            submitButton.setEnabled(true);
        }
    }

    private void submitTask() {
        String title = titleField.getText().toString().trim();
        if (TextUtils.isEmpty(title)) {
            showStatus(getString(R.string.task_title_empty));
            return;
        }
        String description = descriptionField.getText().toString().trim();
        boolean isCar = assigneeGroup.getCheckedRadioButtonId() == R.id.rbCar;

        TaskCreateRequest body;
        if (isCar) {
            if (cars.isEmpty()) {
                showStatus(getString(R.string.assignee_empty));
                return;
            }
            CarVO car = cars.get(carSpinner.getSelectedItemPosition());
            body = new TaskCreateRequest(title, description, warningHistoryId, "car", car.getCarId(), null);
        } else {
            if (employees.isEmpty()) {
                showStatus(getString(R.string.assignee_empty));
                return;
            }
            EmployeeVO employee = employees.get(employeeSpinner.getSelectedItemPosition());
            body = new TaskCreateRequest(title, description, warningHistoryId, "employee", null, employee.getId());
        }

        showStatus(null);
        setLoading(true);
        submitButton.setEnabled(false);
        taskRepo.createTask(body, new com.at.mobile.data.repository.RepositoryCallback<com.at.mobile.data.remote.dto.TaskVO>() {
            @Override
            public void onSuccess(com.at.mobile.data.remote.dto.TaskVO data) {
                setLoading(false);
                submitButton.setEnabled(true);
                toast(getString(R.string.task_create_success));
                finish();
            }

            @Override
            public void onError(ApiException e) {
                setLoading(false);
                submitButton.setEnabled(true);
                showStatus(getString(R.string.task_create_fail, e.getMessage()));
            }
        });
    }
}
