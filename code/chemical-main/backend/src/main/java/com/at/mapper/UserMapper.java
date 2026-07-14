package com.at.mapper;

import com.at.pojo.User;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;

/** Shared user table access for authentication and admin user management. */
@Mapper
public interface UserMapper {

    // 列表：不返回 password 字段，避免哈希外泄。
    @Select("SELECT id, username, role FROM user ORDER BY id ASC")
    List<User> selectList();

    @Select("SELECT id, username, password, role FROM user WHERE id = #{id}")
    User selectById(Long id);

    @Select("SELECT id, username, password, role FROM user WHERE username = #{username}")
    User selectByUsername(String username);

    @Insert("INSERT INTO user(username, password, role, create_time) VALUES(#{username}, #{password}, #{role}, NOW())")
    int insert(User user);

    @Update("UPDATE user SET role = #{role}, password = #{password} WHERE id = #{id}")
    int updateById(User user);

    @Delete("DELETE FROM user WHERE id = #{id}")
    int deleteById(Long id);
}
