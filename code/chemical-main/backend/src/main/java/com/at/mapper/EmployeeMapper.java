package com.at.mapper;

import com.at.pojo.Employee;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;

@Mapper
public interface EmployeeMapper {

    @Select("SELECT id, name, age, gender, phone, department, "
            + "employee_no AS employeeNo, status, job_desc AS jobDesc, "
            + "create_time AS createTime FROM employee ORDER BY id ASC")
    List<Employee> selectList();

    @Select("SELECT id, name, age, gender, phone, department, "
            + "employee_no AS employeeNo, status, job_desc AS jobDesc, "
            + "create_time AS createTime FROM employee WHERE employee_no = #{employeeNo} LIMIT 1")
    Employee selectByEmployeeNo(Integer employeeNo);

    // 按主键查（task 模块校验指派员工存在用）
    @Select("SELECT id, name, age, gender, phone, department, "
            + "employee_no AS employeeNo, status, job_desc AS jobDesc, "
            + "create_time AS createTime FROM employee WHERE id = #{id} LIMIT 1")
    Employee selectById(Long id);

    @Insert("INSERT INTO employee(name, age, gender, phone, department, employee_no, status, job_desc, create_time) "
            + "VALUES(#{name}, #{age}, #{gender}, #{phone}, #{department}, #{employeeNo}, #{status}, #{jobDesc}, NOW())")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(Employee employee);

    @Update("UPDATE employee SET name = #{name}, age = #{age}, gender = #{gender}, phone = #{phone}, "
            + "department = #{department}, employee_no = #{employeeNo}, status = #{status}, job_desc = #{jobDesc} "
            + "WHERE id = #{id}")
    int update(Employee employee);

    @Delete("DELETE FROM employee WHERE id = #{id}")
    int deleteById(Long id);
}
