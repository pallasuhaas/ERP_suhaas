package com.studenthub.payment_service.controller;

import com.studenthub.payment_service.data.model.FeeStructure;
import com.studenthub.payment_service.service.FeeStructureService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/fee-structures")
public class FeeStructureController {

    private final FeeStructureService service;

    public FeeStructureController(FeeStructureService service) {
        this.service = service;
    }

    @GetMapping
    public List<FeeStructure> getAll() {
        return service.getAll();
    }

    @GetMapping("/{id}")
    public FeeStructure getById(@PathVariable Long id) {
        return service.getById(id);
    }

    @PostMapping
    public FeeStructure create(@RequestBody FeeStructure feeStructure) {
        return service.create(feeStructure);
    }

    @PutMapping("/{id}")
    public FeeStructure update(@PathVariable Long id,
                               @RequestBody FeeStructure feeStructure) {
        return service.update(id, feeStructure);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
