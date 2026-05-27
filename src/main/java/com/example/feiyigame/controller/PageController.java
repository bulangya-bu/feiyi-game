package com.example.feiyigame.controller;

import com.example.feiyigame.service.LevelService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.server.ResponseStatusException;

@Controller
public class PageController {

    private final LevelService levelService;

    public PageController(LevelService levelService) {
        this.levelService = levelService;
    }

    @GetMapping("/")
    public String index(Model model) {
        model.addAttribute("featuredLevels", levelService.getAllLevels().stream().limit(3).toList());
        return "index";
    }

    @GetMapping("/levels")
    public String levels() {
        return "levels";
    }

    @GetMapping("/game/{id}")
    public String game(@PathVariable int id, Model model) {
        if (!levelService.exists(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Level not found");
        }
        model.addAttribute("levelId", id);
        return "game";
    }
}
