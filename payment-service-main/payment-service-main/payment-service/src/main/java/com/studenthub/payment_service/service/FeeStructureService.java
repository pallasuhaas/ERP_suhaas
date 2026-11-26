package com.studenthub.payment_service.service;

import com.studenthub.payment_service.data.repository.FeeInvoiceRepository;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import com.studenthub.payment_service.exception.ResourceNotFoundException;
import com.studenthub.payment_service.data.model.FeeStructure;
import com.studenthub.payment_service.data.repository.FeeStructureRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FeeStructureService {

    private final FeeStructureRepository repository;
    private final FeeInvoiceRepository invoiceRepository;

    public FeeStructureService(FeeStructureRepository repository, FeeInvoiceRepository invoiceRepository) {
        this.repository = repository;
        this.invoiceRepository = invoiceRepository;
    }

    public List<FeeStructure> getAll() {
        return repository.findAll();
    }

    public FeeStructure getById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("FeeStructure not found with id: " + id));
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
        getById(id);
        blockIfUsed("Fee structure", java.util.Map.of("invoice", invoiceRepository.countByFeeStructureFeeStructureId(id)));
        repository.deleteById(id);
    }

    // BUG-010: refuse a delete that would break references, and say what is in the way
    private static void blockIfUsed(String what, java.util.Map<String, Long> users) {
        java.util.List<String> parts = new java.util.ArrayList<>();
        users.forEach((name, n) -> { if (n > 0) parts.add(n + " " + name + (n == 1 ? "" : "s")); });
        if (!parts.isEmpty()) {
            String list = parts.size() == 1 ? parts.get(0)
                    : String.join(", ", parts.subList(0, parts.size() - 1)) + " and " + parts.get(parts.size() - 1);
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    what + " is still used by " + list + ". Remove or reassign them first.");
        }
    }
}
