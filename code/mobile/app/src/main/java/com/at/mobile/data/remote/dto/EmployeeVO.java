package com.at.mobile.data.remote.dto;

import com.google.gson.annotations.SerializedName;

/** 员工，对应后端 EmployeeResponseDTO。 */
public class EmployeeVO {
    @SerializedName("id") private Long id;
    @SerializedName("name") private String name;
    @SerializedName("department") private String department;
    @SerializedName("employeeNo") private Integer employeeNo;
    @SerializedName("status") private String status;
    @SerializedName("phone") private String phone;

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getDepartment() { return department; }
    public Integer getEmployeeNo() { return employeeNo; }
    public String getStatus() { return status; }
    public String getPhone() { return phone; }

    public String displayName() {
        return name + (department == null ? "" : "（" + department + "）");
    }
}
