package com.example.feiyigame.controller;

import com.example.feiyigame.model.Level;
import com.example.feiyigame.service.LevelService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/levels")
public class LevelApiController {

    private final LevelService levelService;

    public LevelApiController(LevelService levelService) {
        this.levelService = levelService;
    }

    @GetMapping
    public List<Level> getLevels() {
        return levelService.getAllLevels();
    }

    @GetMapping("/{id}")
    public Level getLevel(@PathVariable int id) {
        Level level = levelService.getLevelById(id);
        if (level == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Level not found");
        }
        return level;
    }
}
