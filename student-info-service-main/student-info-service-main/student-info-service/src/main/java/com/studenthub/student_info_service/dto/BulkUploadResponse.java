package com.studenthub.student_info_service.dto;

import com.studenthub.student_info_service.data.model.Student;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class BulkUploadResponse {

    private int saved;
    private int skipped;
    private List<Student> students;
    private List<String> skippedAdmissionNumbers;
}
