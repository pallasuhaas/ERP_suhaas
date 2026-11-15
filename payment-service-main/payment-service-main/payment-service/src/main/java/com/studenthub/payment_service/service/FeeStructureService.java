package com.studenthub.payment_service.service;

import com.studenthub.payment_service.data.model.FeeStructure;
import com.studenthub.payment_service.data.repository.FeeStructureRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FeeStructureService {

    private final FeeStructureRepository repository;

    public FeeStructureService(FeeStructureRepository repository) {
        this.repository = repository;
    }

    public List<FeeStructure> getAll() {
        return repository.findAll();
    }

    public FeeStructure getById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("FeeStructure not found with id: " + id));
    }

    public FeeStructure create(FeeStructure feeStructure) {
        return repository.save(feeStructure);
    }

    public FeeStructure update(Long id, FeeStructure updated) {
        FeeStructure existing = getById(id);

        existing.setAcademicYear(updated.getAcademicYear());
        existing.setGradeLevel(updated.getGradeLevel());
        existing.setFeeType(updated.getFeeType());
        existing.setAmount(updated.getAmount());
        existing.setDueDate(updated.getDueDate());
        existing.setRecurring(updated.getRecurring());

        return repository.save(existing);
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }
}
